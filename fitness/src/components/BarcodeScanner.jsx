import React, { useEffect, useRef, useState } from "react";
import { lookupBarcode, portionOf, cleanBarcode, isValidBarcode } from "../data/foodApi";

// 📷 Barkodla besin ekle.
// Okuma stratejisi:
//   1) Tarayıcıda yerleşik BarcodeDetector varsa onu kullan (Android Chrome) —
//      ek kütüphane yüklenmez, en hızlısı.
//   2) Yoksa (iOS Safari desteklemiyor) ZXing dinamik olarak yüklenir.
//   3) Kamera hiç yoksa/izin verilmezse elle barkod girişi her zaman çalışır.
export default function BarcodeScanner({ onAdd, onClose }) {
  const [phase, setPhase] = useState("idle");   // idle | scanning | found | error
  const [err, setErr] = useState("");
  const [manual, setManual] = useState("");
  const [busy, setBusy] = useState(false);
  const [food, setFood] = useState(null);
  const [grams, setGrams] = useState("100");

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const stopRef = useRef(null);   // ZXing kontrolcüsü / döngü durdurucu
  const aliveRef = useRef(true);

  useEffect(() => {
    aliveRef.current = true;
    return () => { aliveRef.current = false; stopCamera(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function stopCamera() {
    try { if (stopRef.current) { stopRef.current(); stopRef.current = null; } } catch (e) {}
    try {
      const s = streamRef.current;
      if (s) { s.getTracks().forEach((t) => t.stop()); streamRef.current = null; }
    } catch (e) {}
  }

  async function onDetected(code) {
    const c = cleanBarcode(code);
    if (!isValidBarcode(c)) return;
    stopCamera();
    setPhase("idle");
    await search(c);
  }

  // Kamerayı başlat (kullanıcı hareketiyle çağrılmalı — iOS şartı)
  async function startCamera() {
    setErr(""); setFood(null);
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setErr("Bu tarayıcı kamera erişimini desteklemiyor. Barkodu elle girebilirsin.");
      setPhase("error");
      return;
    }
    setPhase("scanning");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      if (!aliveRef.current) { stream.getTracks().forEach((t) => t.stop()); return; }
      streamRef.current = stream;
      const v = videoRef.current;
      if (v) {
        v.srcObject = stream;
        v.setAttribute("playsinline", "true"); // iOS: tam ekrana geçmesin
        await v.play().catch(() => {});
      }

      // 1) Yerleşik BarcodeDetector
      if (typeof window !== "undefined" && "BarcodeDetector" in window) {
        try {
          const det = new window.BarcodeDetector({
            formats: ["ean_13", "ean_8", "upc_a", "upc_e", "code_128", "itf"],
          });
          let raf = 0;
          const loop = async () => {
            if (!aliveRef.current || !videoRef.current) return;
            try {
              const codes = await det.detect(videoRef.current);
              if (codes && codes.length) { onDetected(codes[0].rawValue); return; }
            } catch (e) { /* kare atlanabilir */ }
            raf = requestAnimationFrame(loop);
          };
          stopRef.current = () => cancelAnimationFrame(raf);
          raf = requestAnimationFrame(loop);
          return;
        } catch (e) { /* desteklenmiyorsa ZXing'e düş */ }
      }

      // 2) ZXing (iOS Safari dahil) — sadece gerektiğinde indirilir
      const [{ BrowserMultiFormatReader }, { DecodeHintType, BarcodeFormat }] = await Promise.all([
        import("@zxing/browser"),
        import("@zxing/library"),
      ]);
      if (!aliveRef.current) return;
      const hints = new Map();
      hints.set(DecodeHintType.POSSIBLE_FORMATS, [
        BarcodeFormat.EAN_13, BarcodeFormat.EAN_8,
        BarcodeFormat.UPC_A, BarcodeFormat.UPC_E,
        BarcodeFormat.CODE_128, BarcodeFormat.ITF,
      ]);
      const reader = new BrowserMultiFormatReader(hints);
      const controls = await reader.decodeFromStream(stream, videoRef.current, (result) => {
        if (result) onDetected(result.getText());
      });
      stopRef.current = () => { try { controls.stop(); } catch (e) {} };
    } catch (e) {
      const denied = e && (e.name === "NotAllowedError" || e.name === "SecurityError");
      setErr(denied
        ? "Kamera izni verilmedi. Tarayıcı ayarlarından izin ver veya barkodu elle gir."
        : "Kamera açılamadı. Barkodu elle girebilirsin.");
      setPhase("error");
      stopCamera();
    }
  }

  async function search(code) {
    setBusy(true); setErr("");
    const r = await lookupBarcode(code);
    setBusy(false);
    if (!aliveRef.current) return;
    if (r.success) {
      setFood(r.food);
      setGrams(r.food.serving ? String(r.food.serving.g) : "100");
      setPhase("found");
    } else {
      setErr(r.error || "Bulunamadı.");
      setPhase("error");
    }
  }

  function submitManual(e) {
    e.preventDefault();
    const c = cleanBarcode(manual);
    if (!isValidBarcode(c)) { setErr("Barkod 8-14 haneli olmalı."); return; }
    search(c);
  }

  function add() {
    if (!food) return;
    const g = Math.max(1, Number(grams) || 0);
    const { kcal, p } = portionOf(food, g);
    const label = food.name + (food.brand ? " (" + food.brand + ")" : "") + " · " + g + " g";
    onAdd({ name: label, kcal, p });
    onClose();
  }

  const preview = food ? portionOf(food, grams) : null;

  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,.65)", zIndex: 80,
      display: "flex", alignItems: "flex-end", justifyContent: "center",
    }}>
      <div onClick={(e) => e.stopPropagation()} className="card" style={{
        width: "100%", maxWidth: 560, borderRadius: "16px 16px 0 0",
        maxHeight: "92vh", overflowY: "auto",
        paddingBottom: "calc(16px + env(safe-area-inset-bottom))",
      }}>
        <div className="row" style={{ justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <div style={{ fontWeight: 800, fontSize: 17 }}>📷 Barkodla Ekle</div>
          <button className="icon-btn" onClick={onClose}>✕</button>
        </div>

        {/* Kamera */}
        {phase === "scanning" && (
          <div style={{ marginBottom: 12 }}>
            <div style={{ position: "relative", borderRadius: 12, overflow: "hidden", background: "#000" }}>
              <video ref={videoRef} muted playsInline
                style={{ width: "100%", maxHeight: "46vh", objectFit: "cover", display: "block" }} />
              {/* Hedef çerçevesi */}
              <div style={{
                position: "absolute", left: "10%", right: "10%", top: "35%", height: "30%",
                border: "2px solid var(--accent)", borderRadius: 10, boxShadow: "0 0 0 9999px rgba(0,0,0,.25)",
              }} />
            </div>
            <p style={{ color: "var(--muted)", fontSize: 12, margin: "8px 0 0", textAlign: "center" }}>
              Barkodu çerçeveye getir. Işık iyi olsun, telefonu 10-15 cm uzakta tut.
            </p>
            <button className="btn-ghost" style={{ width: "100%", padding: 11, marginTop: 8 }}
              onClick={() => { stopCamera(); setPhase("idle"); }}>Kamerayı kapat</button>
          </div>
        )}

        {phase !== "scanning" && !food && (
          <button className="btn-primary" style={{ width: "100%", padding: 14, marginBottom: 12 }} onClick={startCamera}>
            📷 Kamerayı Aç ve Tara
          </button>
        )}

        {/* Elle giriş — kamera olmasa da her zaman çalışır */}
        {!food && (
          <form onSubmit={submitManual} style={{ marginBottom: 10 }}>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 6 }}>veya barkodu elle gir</div>
            <div className="row" style={{ gap: 8 }}>
              <input className="input" style={{ flex: 1 }} type="text" inputMode="numeric"
                placeholder="örn. 8690504014201" value={manual}
                onChange={(e) => setManual(e.target.value)} />
              <button className="icon-btn" style={{ padding: "0 16px", minHeight: 44 }} disabled={busy}>
                {busy ? "…" : "Ara"}
              </button>
            </div>
          </form>
        )}

        {busy && <p style={{ color: "var(--muted)", fontSize: 13 }}>Aranıyor…</p>}
        {err && <div className="err" style={{ marginBottom: 10 }}>{err}</div>}

        {/* Bulunan ürün */}
        {food && (
          <div>
            <div className="card" style={{ background: "var(--card2)", marginBottom: 12 }}>
              <div className="row" style={{ gap: 10, alignItems: "center" }}>
                {food.image && (
                  <img src={food.image} alt="" style={{ width: 56, height: 56, objectFit: "contain", borderRadius: 8, background: "#fff", flexShrink: 0 }} />
                )}
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{food.name}</div>
                  <div style={{ color: "var(--muted)", fontSize: 12 }}>
                    {food.brand || "marka yok"}{food.quantity ? " · " + food.quantity : ""}
                  </div>
                </div>
              </div>
              <div style={{ color: "var(--muted)", fontSize: 12, marginTop: 8 }}>
                100 g: <b style={{ color: "var(--text)" }}>{food.per100.kcal} kcal</b> · P {food.per100.protein} g
                {food.per100.carbs ? " · K " + food.per100.carbs + " g" : ""}
                {food.per100.fat ? " · Y " + food.per100.fat + " g" : ""}
              </div>
            </div>

            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 6 }}>Ne kadar yedin?</div>
            <div className="row" style={{ gap: 6, marginBottom: 8, flexWrap: "wrap" }}>
              {food.serving && (
                <button className={"chip" + (String(grams) === String(food.serving.g) ? " on" : "")}
                  onClick={() => setGrams(String(food.serving.g))}>
                  1 porsiyon ({food.serving.label})
                </button>
              )}
              {[50, 100, 150, 200].map((g) => (
                <button key={g} className={"chip" + (String(grams) === String(g) ? " on" : "")}
                  onClick={() => setGrams(String(g))}>{g} g</button>
              ))}
            </div>
            <div className="row" style={{ gap: 8, alignItems: "center", marginBottom: 12 }}>
              <input className="input" style={{ flex: 1 }} type="number" inputMode="numeric" min="1"
                value={grams} onChange={(e) => setGrams(e.target.value)} />
              <span style={{ color: "var(--muted)", fontSize: 13 }}>gram</span>
            </div>

            <div className="card" style={{ background: "var(--card2)", textAlign: "center", marginBottom: 12 }}>
              <div style={{ fontWeight: 900, fontSize: 26, color: "var(--accent)" }}>{preview.kcal} kcal</div>
              <div style={{ color: "var(--muted)", fontSize: 13 }}>{preview.p} g protein</div>
            </div>

            <button className="btn-primary" style={{ width: "100%", padding: 14 }} onClick={add}>
              ✓ Güne Ekle
            </button>
            <button className="btn-ghost" style={{ width: "100%", padding: 11, marginTop: 8 }}
              onClick={() => { setFood(null); setErr(""); setManual(""); setPhase("idle"); }}>
              ← Başka ürün ara
            </button>
          </div>
        )}

        <p style={{ color: "var(--muted)", fontSize: 10.5, marginTop: 12, marginBottom: 0, lineHeight: 1.5 }}>
          Veriler <b>Open Food Facts</b> açık veritabanından gelir (ücretsiz, API anahtarı gerekmez).
          Topluluk katkısıyla doldurulduğu için bazı ürünler eksik veya hatalı olabilir — değerleri gözden geçir.
        </p>
      </div>
    </div>
  );
}
