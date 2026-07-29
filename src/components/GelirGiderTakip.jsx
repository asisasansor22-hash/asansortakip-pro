import React, { useState, useMemo, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { toXLSX } from '../utils/excel'
import {
  YONTEMLER, GELIR_KATEGORILERI, GIDER_KATEGORILERI,
  kategoriler, kategoriBilgi, yontemBilgi,
  isoBugun, trTarih, gunAdi, ayEtiket, paraYaz, kisaPara, yuzdeYaz,
  donemAralik, aralikGunSayisi, defteriNormalize, kaynaklariBirlestir,
  sabitGiderleriUret, suz, toplamlar, kategoriDagilimi, yontemDagilimi,
  aylikSeri, yillikTablo, gunlereGrupla, binalaraGorePerformans, tahsilatDurumu,
  excelHareketSatirlari, excelYillikSatirlar,
} from '../utils/finans'

const YESIL = "#34C759";
const KIRMIZI = "#FF3B30";
const MAVI = "#007AFF";
const MOR = "#AF52DE";
const TURUNCU = "#FF9500";

const DONEMLER = [
  { id: "bugun", ad: "Bugün" },
  { id: "hafta", ad: "Bu Hafta" },
  { id: "ay", ad: "Bu Ay" },
  { id: "gecenAy", ad: "Geçen Ay" },
  { id: "yil", ad: "Bu Yıl" },
  { id: "tumu", ad: "Tümü" },
  { id: "ozel", ad: "Özel" },
];

const ALT_SEKMELER = [
  { id: 0, ad: "📊 Özet" },
  { id: 1, ad: "🧾 İşlemler" },
  { id: 2, ad: "🔁 Sabit Giderler" },
  { id: 3, ad: "📈 Raporlar" },
];

const KDV_ORANLARI = [0, 1, 10, 20];

// "1.250,50" / "1250.5" / "1250" → 1250.5
function sayiOku(deger) {
  if (typeof deger === "number") return deger;
  let s = String(deger || "").replace(/[^\d.,-]/g, "").trim();
  if (!s) return 0;
  if (s.indexOf(",") > -1 && s.indexOf(".") > -1) s = s.replace(/\./g, "").replace(",", ".");
  else if (s.indexOf(",") > -1) s = s.replace(",", ".");
  const n = parseFloat(s);
  return isNaN(n) ? 0 : n;
}

// Renkler inline değil CSS değişkeniyle veriliyor (bkz. index.css → GELİR-GİDER MODÜLÜ)
function renk(c) { return { "--gg-c": c }; }
function tint(c, arka, kenar) { return { "--gg-bg": c + (arka || "14"), "--gg-br": c + (kenar || "33") }; }
function dolgu(c) { return { "--gg-bg": c, "--gg-fg": "#fff", "--gg-br": c }; }
function solukDolgu(c) { return { "--gg-bg": c + "1c", "--gg-fg": c, "--gg-br": c + "55" }; }
function notrDolgu() { return { "--gg-bg": "var(--bg-card)", "--gg-fg": "var(--text-muted)", "--gg-br": "var(--border-soft)" }; }

const girdi = {
  width: "100%",
  background: "var(--bg-root)",
  border: "1px solid var(--border)",
  borderRadius: 10,
  padding: "10px 12px",
  color: "var(--text)",
  fontSize: 14,
  outline: "none",
  boxSizing: "border-box",
};

const etiketStil = { display: "block", fontSize: 11, fontWeight: 700, marginBottom: 5, letterSpacing: 0.2 };

function Dugme({ children, onClick, renk: c, ikincil, kucuk, tam, disabled, title }) {
  const ana = c || MAVI;
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className="gg-btn"
      style={Object.assign(
        { padding: kucuk ? "6px 11px" : "10px 16px", borderRadius: kucuk ? 8 : 10, fontSize: kucuk ? 11 : 13, width: tam ? "100%" : undefined },
        ikincil ? solukDolgu(ana) : dolgu(ana)
      )}
    >{children}</button>
  );
}

function Secim({ secili, c, onClick, children, tam, kucuk }) {
  return (
    <button onClick={onClick} className="gg-btn" style={Object.assign(
      { padding: kucuk ? "7px 11px" : "8px 12px", borderRadius: 9, fontSize: kucuk ? 11.5 : 12, flex: tam ? 1 : undefined },
      secili ? solukDolgu(c) : notrDolgu()
    )}>{children}</button>
  );
}

function KPI({ ikon, baslik, deger, alt, renk: c, vurgu }) {
  return (
    <div className="gg-tint" style={Object.assign({ padding: "13px 15px", minWidth: 0 },
      vurgu ? { "--gg-bg": "linear-gradient(135deg," + c + "22, var(--bg-panel))", "--gg-br": c + "55" } : { "--gg-bg": "var(--bg-panel)", "--gg-br": "var(--border-soft)" })}>
      <div className="gg-muted" style={{ fontSize: 11, fontWeight: 600, display: "flex", alignItems: "center", gap: 5 }}>
        <span>{ikon}</span><span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{baslik}</span>
      </div>
      <div className="gg-c" style={Object.assign({ fontSize: vurgu ? 24 : 20, fontWeight: 900, letterSpacing: -0.6, marginTop: 5, wordBreak: "break-word" }, renk(c))}>{deger}</div>
      {alt ? <div className="gg-dim" style={{ fontSize: 10.5, marginTop: 3 }}>{alt}</div> : null}
    </div>
  );
}

// Son 12 ayın gelir/gider sütunları + net kâr çizgisi.
// Sıfır çizgisi ortak: negatif net de doğru yerde görünür.
function TrendGrafik({ seri }) {
  const G = 720, Y = 250;
  const solBosluk = 48, sagBosluk = 12, ustBosluk = 14, altBosluk = 46;
  const alanG = G - solBosluk - sagBosluk;
  const alanY = Y - ustBosluk - altBosluk;

  const ust = Math.max(1, ...seri.map(function (s) { return Math.max(s.gelir, s.gider, s.net); }));
  const alt = Math.min(0, ...seri.map(function (s) { return s.net; }));
  const menzil = ust - alt || 1;
  function yKoor(v) { return ustBosluk + alanY * ((ust - v) / menzil); }
  const sifirY = yKoor(0);

  const grupG = alanG / seri.length;
  const sutunG = Math.min(16, grupG / 3.2);
  const cizgiNoktalar = seri.map(function (s, i) {
    return (solBosluk + grupG * i + grupG / 2) + "," + yKoor(s.net);
  }).join(" ");

  const isaretler = [ust, ust * 0.5, 0];
  if (alt < 0) isaretler.push(alt);

  return (
    <div style={{ width: "100%", overflowX: "auto" }}>
      <svg viewBox={"0 0 " + G + " " + Y} style={{ width: "100%", minWidth: 520, height: "auto", display: "block" }}>
        {isaretler.map(function (v, i) {
          const y = yKoor(v);
          return (
            <g key={i}>
              <line x1={solBosluk} y1={y} x2={G - sagBosluk} y2={y} stroke="var(--border-soft)" strokeWidth={v === 0 ? 1.4 : 1} strokeDasharray={v === 0 ? "" : "3 4"} />
              <text x={solBosluk - 6} y={y + 4} textAnchor="end" fontSize="10" fill="var(--text-dim)">{kisaPara(v)}</text>
            </g>
          );
        })}
        {seri.map(function (s, i) {
          const merkez = solBosluk + grupG * i + grupG / 2;
          return (
            <g key={s.ay}>
              <rect x={merkez - sutunG - 2} y={yKoor(s.gelir)} width={sutunG} height={Math.max(0.5, sifirY - yKoor(s.gelir))} rx="3" fill={YESIL} opacity="0.92" />
              <rect x={merkez + 2} y={yKoor(s.gider)} width={sutunG} height={Math.max(0.5, sifirY - yKoor(s.gider))} rx="3" fill={KIRMIZI} opacity="0.92" />
              <text x={merkez} y={Y - altBosluk + 16} textAnchor="middle" fontSize="10.5" fill="var(--text-muted)" fontWeight="600">{s.kisa}</text>
              <text x={merkez} y={Y - altBosluk + 30} textAnchor="middle" fontSize="9.5" fill={s.net >= 0 ? YESIL : KIRMIZI} fontWeight="700">
                {s.gelir || s.gider ? kisaPara(s.net) : ""}
              </text>
            </g>
          );
        })}
        <polyline points={cizgiNoktalar} fill="none" stroke={MAVI} strokeWidth="2" strokeLinejoin="round" opacity="0.8" />
        {seri.map(function (s, i) {
          return <circle key={s.ay} cx={solBosluk + grupG * i + grupG / 2} cy={yKoor(s.net)} r="2.8" fill={MAVI} />;
        })}
      </svg>
      <div className="gg-muted" style={{ display: "flex", gap: 16, justifyContent: "center", marginTop: 6, fontSize: 11, flexWrap: "wrap" }}>
        <span><span style={{ display: "inline-block", width: 10, height: 10, borderRadius: 3, background: YESIL, marginRight: 5 }} />Gelir</span>
        <span><span style={{ display: "inline-block", width: 10, height: 10, borderRadius: 3, background: KIRMIZI, marginRight: 5 }} />Gider</span>
        <span><span style={{ display: "inline-block", width: 14, height: 3, borderRadius: 2, background: MAVI, marginRight: 5, verticalAlign: "middle" }} />Net kâr eğrisi</span>
      </div>
    </div>
  );
}

function KategoriListesi({ baslik, dagilim, bosMetin }) {
  return (
    <div className="gg-kutu" style={{ padding: 14 }}>
      <div className="gg-text" style={{ fontWeight: 800, fontSize: 13, marginBottom: 12 }}>{baslik}</div>
      {dagilim.length === 0
        ? <div className="gg-dim" style={{ fontSize: 12, padding: "14px 0", textAlign: "center" }}>{bosMetin}</div>
        : dagilim.map(function (k) {
          return (
            <div key={k.id} style={{ marginBottom: 11 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <span className="gg-text" style={{ fontSize: 12, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {k.ikon} {k.ad} <span className="gg-dim" style={{ fontWeight: 500 }}>· {k.adet}</span>
                </span>
                <span className="gg-c" style={Object.assign({ fontSize: 12, fontWeight: 800, whiteSpace: "nowrap" }, renk(k.renk))}>{paraYaz(k.tutar)}</span>
              </div>
              <div className="gg-bar" style={Object.assign({ height: 7 }, renk(k.renk))}>
                <i style={{ width: Math.max(2, k.yuzde) + "%" }} />
              </div>
              <div className="gg-dim" style={{ fontSize: 10, marginTop: 2 }}>{yuzdeYaz(k.yuzde)}</div>
            </div>
          );
        })}
    </div>
  );
}

function IslemSatiri({ k, onDuzenle, onSil, onIptal }) {
  const bilgi = kategoriBilgi(k.tip, k.kategori);
  const gelir = k.tip === "gelir";
  const c = gelir ? YESIL : KIRMIZI;
  const silinebilir = k.kaynak === "manuel";
  const kaynakAdi = k.kaynak === "tahsilat" ? "otomatik: tahsilat"
    : k.kaynak === "gider" ? "otomatik: gider defteri"
      : k.kaynak === "ekstra" ? "otomatik: ekstra iş"
        : k.kaynak === "sabit" ? "sabit gider" : "";
  return (
    <div className="gg-satir" style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", opacity: k.iptal ? 0.5 : 1 }}>
      <div className="gg-tint gg-c" style={Object.assign({
        width: 34, height: 34, borderRadius: 10, display: "flex", alignItems: "center",
        justifyContent: "center", fontSize: 16, flexShrink: 0,
      }, tint(bilgi.renk, "22", "22"), renk(bilgi.renk))}>{bilgi.ikon}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="gg-text" style={{ fontSize: 13, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", textDecoration: k.iptal ? "line-through" : "none" }}>
          {k.aciklama || bilgi.ad}
        </div>
        <div className="gg-dim" style={{ fontSize: 10.5, marginTop: 2, display: "flex", gap: 6, flexWrap: "wrap" }}>
          <span>{bilgi.ad}</span>
          {k.binaAd ? <span>· 🏢 {k.binaAd}</span> : null}
          {k.yontem !== "belirsiz" ? <span>· {yontemBilgi(k.yontem).ikon} {yontemBilgi(k.yontem).ad}</span> : null}
          {k.belgeNo ? <span>· 🧾 {k.belgeNo}</span> : null}
          {kaynakAdi ? <span>· {kaynakAdi}</span> : null}
          {k.iptal ? <span className="gg-c" style={Object.assign({ fontWeight: 700 }, renk(KIRMIZI))}>· İPTAL</span> : null}
        </div>
      </div>
      <div style={{ textAlign: "right", flexShrink: 0 }}>
        <div className="gg-c" style={Object.assign({ fontSize: 14, fontWeight: 900, whiteSpace: "nowrap", textDecoration: k.iptal ? "line-through" : "none" }, renk(c))}>
          {(gelir ? "+" : "−") + paraYaz(k.tutar)}
        </div>
        <div style={{ display: "flex", gap: 4, justifyContent: "flex-end", marginTop: 4 }}>
          <button onClick={function () { onDuzenle(k); }} title="Düzenle" className="gg-btn"
            style={Object.assign({ borderRadius: 6, width: 26, height: 24, fontSize: 11 }, notrDolgu())}>✏️</button>
          {silinebilir
            ? <button onClick={function () { onSil(k); }} title="Sil" className="gg-btn"
              style={Object.assign({ borderRadius: 6, width: 26, height: 24, fontSize: 11 }, solukDolgu(KIRMIZI))}>🗑</button>
            : <button onClick={function () { onIptal(k); }} title={k.iptal ? "Geri al" : "İptal et — toplamlardan düşülür"} className="gg-btn"
              style={Object.assign({ borderRadius: 6, width: 26, height: 24, fontSize: 11 }, notrDolgu())}>{k.iptal ? "↩" : "🚫"}</button>}
        </div>
      </div>
    </div>
  );
}

function ModalKabuk({ baslik, onKapat, children, altBar }) {
  return createPortal(
    <div className="gg-modul" style={{ position: "fixed", inset: 0, zIndex: 9999 }}>
      <div onClick={onKapat} className="gg-overlay" style={{ position: "absolute", inset: 0 }} />
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "flex-end", justifyContent: "center", pointerEvents: "none" }}>
        <div style={{
          background: "var(--bg-panel)", width: "100%", maxWidth: 560, maxHeight: "92vh", overflowY: "auto",
          borderTopLeftRadius: 22, borderTopRightRadius: 22, border: "1px solid var(--border)",
          paddingBottom: "env(safe-area-inset-bottom,10px)", pointerEvents: "auto",
        }}>
          <div style={{
            position: "sticky", top: 0, background: "var(--bg-panel)", padding: "16px 18px 12px",
            borderBottom: "1px solid var(--border-soft)", display: "flex", justifyContent: "space-between", alignItems: "center", zIndex: 2,
          }}>
            <div className="gg-text" style={{ fontWeight: 800, fontSize: 16 }}>{baslik}</div>
            <button onClick={onKapat} className="gg-btn" style={Object.assign({ borderRadius: 9, width: 30, height: 30, fontSize: 15 }, notrDolgu())}>✕</button>
          </div>
          <div style={{ padding: 18 }}>{children}</div>
          {altBar ? <div style={{ position: "sticky", bottom: 0, background: "var(--bg-panel)", padding: "12px 18px", borderTop: "1px solid var(--border-soft)" }}>{altBar}</div> : null}
        </div>
      </div>
    </div>,
    document.body
  );
}

function IslemFormu({ kayit, elevs, onKaydet, onKapat }) {
  const duzenleme = !!kayit.id;
  const kaynakli = duzenleme && kayit.kaynak && kayit.kaynak !== "manuel";
  const [f, setF] = useState(function () {
    return {
      tip: kayit.tip || "gider",
      tarih: kayit.tarih || isoBugun(),
      tutar: kayit.tutar ? String(kayit.tutar).replace(".", ",") : "",
      kategori: kayit.kategori || (kayit.tip === "gelir" ? "bakim" : "yedek_parca"),
      aciklama: kayit.aciklama || "",
      yontem: kayit.yontem && kayit.yontem !== "belirsiz" ? kayit.yontem : "nakit",
      binaId: kayit.binaId === null || kayit.binaId === undefined ? "" : String(kayit.binaId),
      belgeNo: kayit.belgeNo || "",
      kdvOran: kayit.kdvOran || 0,
    };
  });
  function set(alan, deger) { setF(function (p) { return Object.assign({}, p, { [alan]: deger }); }); }

  const liste = kategoriler(f.tip);
  const binalar = useMemo(function () {
    return (elevs || []).slice().sort(function (a, b) { return String(a.ad || "").localeCompare(String(b.ad || ""), "tr"); });
  }, [elevs]);
  const tutarSayi = sayiOku(f.tutar);

  function kaydet() {
    if (tutarSayi <= 0) { alert("Geçerli bir tutar giriniz."); return; }
    if (!f.tarih) { alert("Tarih seçiniz."); return; }
    const bina = binalar.find(function (e) { return String(e.id) === String(f.binaId); });
    onKaydet({
      id: kayit.id || "m-" + Date.now(),
      tip: f.tip,
      tarih: f.tarih,
      tutar: tutarSayi,
      kategori: f.kategori,
      aciklama: f.aciklama.trim() || kategoriBilgi(f.tip, f.kategori).ad,
      yontem: f.yontem,
      binaId: bina ? bina.id : null,
      binaAd: bina ? bina.ad : "",
      ilce: bina ? bina.ilce || "" : "",
      belgeNo: f.belgeNo.trim(),
      kdvOran: Number(f.kdvOran) || 0,
      kaynak: kayit.kaynak || "manuel",
      iptal: !!kayit.iptal,
      duzenlendi: kaynakli ? true : !!kayit.duzenlendi,
      girisZamani: kayit.girisZamani || new Date().toLocaleString("tr-TR"),
      guncelleme: duzenleme ? new Date().toLocaleString("tr-TR") : "",
    });
  }

  return (
    <ModalKabuk
      baslik={duzenleme ? "İşlemi Düzenle" : "Yeni İşlem"}
      onKapat={onKapat}
      altBar={<Dugme onClick={kaydet} renk={f.tip === "gelir" ? YESIL : KIRMIZI} tam>💾 {duzenleme ? "Güncelle" : "Kaydet"}</Dugme>}
    >
      {kaynakli ? (
        <div className="gg-tint gg-text" style={Object.assign({ padding: "9px 12px", fontSize: 11.5, marginBottom: 14, lineHeight: 1.45 }, tint(TURUNCU, "18", "44"))}>
          ℹ️ Bu kayıt {kayit.kaynak === "tahsilat" ? "tahsilat" : kayit.kaynak === "ekstra" ? "ekstra iş" : kayit.kaynak === "gider" ? "gider defteri" : "sabit gider"} modülünden otomatik aktarıldı.
          Tutar ve tarih kaynaktan güncellenmeye devam eder; kategori, açıklama ve ödeme bilgisi buradaki hâliyle korunur.
        </div>
      ) : null}

      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {[{ id: "gelir", ad: "💰 Gelir", c: YESIL }, { id: "gider", ad: "💸 Gider", c: KIRMIZI }].map(function (t) {
          const secili = f.tip === t.id;
          return (
            <button key={t.id} className="gg-btn" onClick={function () {
              setF(function (p) { return Object.assign({}, p, { tip: t.id, kategori: kategoriler(t.id)[0].id }); });
            }} style={Object.assign({ flex: 1, padding: "12px 0", borderRadius: 12, fontSize: 14, fontWeight: 800 },
              secili ? solukDolgu(t.c) : notrDolgu())}>{t.ad}</button>
          );
        })}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
        <div>
          <label className="gg-muted" style={etiketStil}>Tarih</label>
          <input type="date" value={f.tarih} onChange={function (e) { set("tarih", e.target.value); }} style={girdi} />
        </div>
        <div>
          <label className="gg-muted" style={etiketStil}>Tutar (₺)</label>
          <input type="text" inputMode="decimal" value={f.tutar} placeholder="0"
            onChange={function (e) { set("tutar", e.target.value); }}
            className="gg-c" style={Object.assign({}, girdi, { fontWeight: 800, fontSize: 16 }, renk(f.tip === "gelir" ? YESIL : KIRMIZI))} />
        </div>
      </div>

      <div style={{ marginBottom: 12 }}>
        <label className="gg-muted" style={etiketStil}>Kategori</label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {liste.map(function (k) {
            return <Secim key={k.id} kucuk secili={f.kategori === k.id} c={k.renk} onClick={function () { set("kategori", k.id); }}>{k.ikon} {k.ad}</Secim>;
          })}
        </div>
      </div>

      <div style={{ marginBottom: 12 }}>
        <label className="gg-muted" style={etiketStil}>Açıklama</label>
        <input type="text" value={f.aciklama} placeholder={f.tip === "gelir" ? "Ör: Nisan bakım tahsilatı" : "Ör: 2 adet fren balatası"}
          onChange={function (e) { set("aciklama", e.target.value); }} style={girdi} />
      </div>

      <div style={{ marginBottom: 12 }}>
        <label className="gg-muted" style={etiketStil}>Ödeme Yöntemi</label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {YONTEMLER.map(function (y) {
            return <Secim key={y.id} kucuk secili={f.yontem === y.id} c={MAVI} onClick={function () { set("yontem", y.id); }}>{y.ikon} {y.ad}</Secim>;
          })}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
        <div>
          <label className="gg-muted" style={etiketStil}>Bina / Asansör (opsiyonel)</label>
          <select value={f.binaId} onChange={function (e) { set("binaId", e.target.value); }} style={girdi}>
            <option value="">— Yok —</option>
            {binalar.map(function (e) { return <option key={e.id} value={e.id}>{e.ad}{e.ilce ? " (" + e.ilce + ")" : ""}</option>; })}
          </select>
        </div>
        <div>
          <label className="gg-muted" style={etiketStil}>Belge / Fiş No (opsiyonel)</label>
          <input type="text" value={f.belgeNo} placeholder="Ör: A-1042" onChange={function (e) { set("belgeNo", e.target.value); }} style={girdi} />
        </div>
      </div>

      <div>
        <label className="gg-muted" style={etiketStil}>KDV Oranı</label>
        <div style={{ display: "flex", gap: 6 }}>
          {KDV_ORANLARI.map(function (o) {
            return <Secim key={o} tam secili={Number(f.kdvOran) === o} c={MOR} onClick={function () { set("kdvOran", o); }}>{o === 0 ? "Yok" : "%" + o}</Secim>;
          })}
        </div>
        {Number(f.kdvOran) > 0 && tutarSayi > 0 ? (
          <div className="gg-dim" style={{ fontSize: 11, marginTop: 6 }}>
            KDV hariç: <b className="gg-text">{paraYaz(tutarSayi / (1 + Number(f.kdvOran) / 100))}</b> ·
            KDV: <b className="gg-c" style={renk(MOR)}>{paraYaz(tutarSayi - tutarSayi / (1 + Number(f.kdvOran) / 100))}</b>
          </div>
        ) : null}
      </div>
    </ModalKabuk>
  );
}

function SabitGiderFormu({ sabit, onKaydet, onKapat }) {
  const [f, setF] = useState(function () {
    return {
      ad: sabit.ad || "",
      tutar: sabit.tutar ? String(sabit.tutar).replace(".", ",") : "",
      kategori: sabit.kategori || "kira",
      gun: sabit.gun || 1,
      baslangic: sabit.baslangic || isoBugun().slice(0, 7),
      bitis: sabit.bitis || "",
      yontem: sabit.yontem || "havale",
      aktif: sabit.aktif === false ? false : true,
    };
  });
  function set(alan, deger) { setF(function (p) { return Object.assign({}, p, { [alan]: deger }); }); }

  function kaydet() {
    const tutar = sayiOku(f.tutar);
    if (!f.ad.trim()) { alert("Gider adı giriniz."); return; }
    if (tutar <= 0) { alert("Geçerli bir tutar giriniz."); return; }
    if (!/^\d{4}-\d{2}$/.test(f.baslangic)) { alert("Başlangıç ayı seçiniz."); return; }
    if (f.bitis && f.bitis < f.baslangic) { alert("Bitiş ayı başlangıçtan önce olamaz."); return; }
    onKaydet({
      id: sabit.id || Date.now(),
      ad: f.ad.trim(),
      tutar: tutar,
      kategori: f.kategori,
      gun: Math.min(Math.max(parseInt(f.gun, 10) || 1, 1), 28),
      baslangic: f.baslangic,
      bitis: f.bitis || "",
      yontem: f.yontem,
      aktif: !!f.aktif,
    });
  }

  return (
    <ModalKabuk baslik={sabit.id ? "Sabit Gideri Düzenle" : "Yeni Sabit Gider"} onKapat={onKapat}
      altBar={<Dugme onClick={kaydet} renk={KIRMIZI} tam>💾 Kaydet</Dugme>}>
      <div className="gg-tint gg-muted" style={Object.assign({ padding: "9px 12px", fontSize: 11.5, marginBottom: 14, lineHeight: 1.45 }, tint(MAVI))}>
        Sabit giderler her ay otomatik olarak deftere işlenir. Ayın seçtiğiniz günü geldiğinde kayıt oluşur; geçmiş aylar için de eksikler tamamlanır.
      </div>
      <div style={{ marginBottom: 12 }}>
        <label className="gg-muted" style={etiketStil}>Gider Adı</label>
        <input type="text" value={f.ad} placeholder="Ör: Ofis kirası, Ahmet usta maaşı" onChange={function (e) { set("ad", e.target.value); }} style={girdi} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
        <div>
          <label className="gg-muted" style={etiketStil}>Aylık Tutar (₺)</label>
          <input type="text" inputMode="decimal" value={f.tutar} placeholder="0" onChange={function (e) { set("tutar", e.target.value); }}
            className="gg-c" style={Object.assign({}, girdi, { fontWeight: 800 }, renk(KIRMIZI))} />
        </div>
        <div>
          <label className="gg-muted" style={etiketStil}>Ayın Kaçıncı Günü</label>
          <input type="number" min="1" max="28" value={f.gun} onChange={function (e) { set("gun", e.target.value); }} style={girdi} />
        </div>
      </div>
      <div style={{ marginBottom: 12 }}>
        <label className="gg-muted" style={etiketStil}>Kategori</label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {GIDER_KATEGORILERI.map(function (k) {
            return <Secim key={k.id} kucuk secili={f.kategori === k.id} c={k.renk} onClick={function () { set("kategori", k.id); }}>{k.ikon} {k.ad}</Secim>;
          })}
        </div>
      </div>
      <div style={{ marginBottom: 12 }}>
        <label className="gg-muted" style={etiketStil}>Ödeme Yöntemi</label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {YONTEMLER.map(function (y) {
            return <Secim key={y.id} kucuk secili={f.yontem === y.id} c={MAVI} onClick={function () { set("yontem", y.id); }}>{y.ikon} {y.ad}</Secim>;
          })}
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
        <div>
          <label className="gg-muted" style={etiketStil}>Başlangıç Ayı</label>
          <input type="month" value={f.baslangic} onChange={function (e) { set("baslangic", e.target.value); }} style={girdi} />
        </div>
        <div>
          <label className="gg-muted" style={etiketStil}>Bitiş Ayı (boş = süresiz)</label>
          <input type="month" value={f.bitis} onChange={function (e) { set("bitis", e.target.value); }} style={girdi} />
        </div>
      </div>
      <label className="gg-ic-kutu" style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", padding: "11px 12px", borderRadius: 10 }}>
        <input type="checkbox" checked={!!f.aktif} onChange={function (e) { set("aktif", e.target.checked); }} style={{ width: 18, height: 18, accentColor: YESIL }} />
        <span className="gg-text" style={{ fontSize: 13, fontWeight: 700 }}>Aktif — her ay otomatik işlensin</span>
      </label>
    </ModalKabuk>
  );
}

export default function GelirGiderTakip(props) {
  const {
    kayitlar, setKayitlar, sabitGiderler, setSabitGiderler, elevs,
    sonOdemeler, hesapKayitlari, haftalikKapamalar, aylikKapamalar,
    giderler, giderHaftaArsiv, ekstraIsler,
  } = props;

  const [altSekme, setAltSekme] = useState(0);
  const [donem, setDonem] = useState("ay");
  const [ozelAralik, setOzelAralik] = useState(function () {
    const a = donemAralik("ay");
    return { bas: a.bas, bit: a.bit };
  });
  const [tipFiltre, setTipFiltre] = useState("hepsi");
  const [kategoriFiltre, setKategoriFiltre] = useState("hepsi");
  const [yontemFiltre, setYontemFiltre] = useState("hepsi");
  const [arama, setArama] = useState("");
  const [iptalleriGoster, setIptalleriGoster] = useState(false);
  const [formKayit, setFormKayit] = useState(null);
  const [sabitForm, setSabitForm] = useState(null);
  const [raporYil, setRaporYil] = useState(new Date().getFullYear());

  const bugun = isoBugun();

  // ── Diğer modüllerden defteri besle (aynalama + sabit giderler) ──
  useEffect(function () {
    const kaynaklar = {
      odemeler: sonOdemeler || [],
      odemeArsivleri: []
        .concat((hesapKayitlari || []).map(function (h) { return h && h.odemeler; }))
        .concat((haftalikKapamalar || []).map(function (h) { return h && h.odemeler; }))
        .concat((aylikKapamalar || []).map(function (h) { return h && h.odemeler; }))
        .filter(Boolean),
      giderler: giderler || [],
      giderArsivleri: (giderHaftaArsiv || []).map(function (h) { return (h && h.giderler) || []; }),
      ekstraIsler: ekstraIsler || [],
    };
    setKayitlar(function (onceki) {
      const sonuc = kaynaklariBirlestir(onceki, kaynaklar);
      const yeniSabitler = sabitGiderleriUret(sabitGiderler, sonuc.kayitlar, bugun);
      if (!sonuc.degisti && yeniSabitler.length === 0) return onceki; // referans korunur → gereksiz yazma olmaz
      return sonuc.kayitlar.concat(yeniSabitler).sort(function (a, b) {
        if (a.tarih === b.tarih) return String(b.id).localeCompare(String(a.id));
        return a.tarih < b.tarih ? 1 : -1;
      });
    });
  }, [sonOdemeler, hesapKayitlari, haftalikKapamalar, aylikKapamalar, giderler, giderHaftaArsiv, ekstraIsler, sabitGiderler, setKayitlar, bugun]);

  const defter = useMemo(function () { return defteriNormalize(kayitlar); }, [kayitlar]);
  const aralik = useMemo(function () { return donemAralik(donem, bugun, ozelAralik); }, [donem, bugun, ozelAralik]);

  const donemKayitlari = useMemo(function () {
    return suz(defter, { bas: aralik.bas, bit: aralik.bit, iptalleriGoster: true });
  }, [defter, aralik]);

  const ozet = useMemo(function () { return toplamlar(donemKayitlari); }, [donemKayitlari]);
  const gelirDagilim = useMemo(function () { return kategoriDagilimi(donemKayitlari, "gelir"); }, [donemKayitlari]);
  const giderDagilim = useMemo(function () { return kategoriDagilimi(donemKayitlari, "gider"); }, [donemKayitlari]);
  const seri = useMemo(function () { return aylikSeri(defter, 12, bugun); }, [defter, bugun]);
  const tahsilat = useMemo(function () { return tahsilatDurumu(defter, elevs, bugun); }, [defter, elevs, bugun]);
  const gunSayisi = aralikGunSayisi(aralik.bas, aralik.bit);

  const listeKayitlari = useMemo(function () {
    return suz(defter, {
      bas: aralik.bas, bit: aralik.bit, tip: tipFiltre, kategori: kategoriFiltre,
      yontem: yontemFiltre, arama: arama, iptalleriGoster: iptalleriGoster,
    });
  }, [defter, aralik, tipFiltre, kategoriFiltre, yontemFiltre, arama, iptalleriGoster]);

  const gunGruplari = useMemo(function () { return gunlereGrupla(listeKayitlari); }, [listeKayitlari]);
  const listeOzet = useMemo(function () { return toplamlar(listeKayitlari); }, [listeKayitlari]);

  const yillar = useMemo(function () {
    const kume = {};
    defter.forEach(function (k) { kume[String(k.tarih).slice(0, 4)] = true; });
    kume[String(new Date().getFullYear())] = true;
    return Object.keys(kume).sort().reverse();
  }, [defter]);

  const yilTablosu = useMemo(function () { return yillikTablo(defter, raporYil); }, [defter, raporYil]);
  const yilKayitlari = useMemo(function () {
    return suz(defter, { bas: raporYil + "-01-01", bit: raporYil + "-12-31", iptalleriGoster: false });
  }, [defter, raporYil]);
  const yilOzet = useMemo(function () { return toplamlar(yilKayitlari); }, [yilKayitlari]);
  const yontemler = useMemo(function () { return yontemDagilimi(donemKayitlari); }, [donemKayitlari]);
  const binaPerf = useMemo(function () { return binalaraGorePerformans(yilKayitlari, elevs).slice(0, 10); }, [yilKayitlari, elevs]);

  const sabitAylikToplam = (sabitGiderler || []).reduce(function (s, x) { return s + (x.aktif === false ? 0 : Number(x.tutar) || 0); }, 0);

  // ── İşlemler ──
  function sirala(liste) {
    return liste.sort(function (a, b) {
      if (a.tarih === b.tarih) return String(b.id).localeCompare(String(a.id));
      return a.tarih < b.tarih ? 1 : -1;
    });
  }

  function kayitYaz(yeni) {
    setKayitlar(function (onceki) {
      const liste = defteriNormalize(onceki);
      const idx = liste.findIndex(function (k) { return k.id === String(yeni.id); });
      if (idx >= 0) liste[idx] = Object.assign({}, liste[idx], yeni, { id: String(yeni.id) });
      else liste.unshift(yeni);
      return sirala(defteriNormalize(liste));
    });
    setFormKayit(null);
  }

  function kayitSil(k) {
    if (!window.confirm("Bu işlem silinsin mi?\n" + k.aciklama + " · " + paraYaz(k.tutar))) return;
    setKayitlar(function (onceki) { return defteriNormalize(onceki).filter(function (x) { return x.id !== k.id; }); });
  }

  function kayitIptal(k) {
    setKayitlar(function (onceki) {
      return defteriNormalize(onceki).map(function (x) {
        return x.id === k.id ? Object.assign({}, x, { iptal: !x.iptal, guncelleme: new Date().toLocaleString("tr-TR") }) : x;
      });
    });
  }

  function sabitYaz(yeni) {
    setSabitGiderler(function (onceki) {
      const liste = Array.isArray(onceki) ? onceki.slice() : [];
      const idx = liste.findIndex(function (s) { return String(s.id) === String(yeni.id); });
      if (idx >= 0) liste[idx] = yeni; else liste.push(yeni);
      return liste;
    });
    setSabitForm(null);
  }

  function sabitSil(s) {
    if (!window.confirm("\"" + s.ad + "\" sabit gideri silinsin mi?\nDaha önce oluşturulmuş aylık kayıtlar defterde kalır.")) return;
    setSabitGiderler(function (onceki) { return (onceki || []).filter(function (x) { return String(x.id) !== String(s.id); }); });
  }

  function excelIndir() {
    toXLSX(excelHareketSatirlari(listeKayitlari, { donem: aralik.etiket }), "gelir-gider_" + aralik.bas + "_" + aralik.bit, "Gelir-Gider");
  }

  function excelYilIndir() {
    toXLSX(excelYillikSatirlar(defter, raporYil), "kar-zarar_" + raporYil, String(raporYil));
  }

  const netRenk = ozet.net >= 0 ? YESIL : KIRMIZI;
  const filtreKategorileri = tipFiltre === "gelir" ? GELIR_KATEGORILERI
    : tipFiltre === "gider" ? GIDER_KATEGORILERI
      : GELIR_KATEGORILERI.concat(GIDER_KATEGORILERI);

  return (
    <div className="gg-modul">
      {/* Başlık + dönem seçici */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
        <h2 className="gg-text" style={{ fontSize: 18, fontWeight: 900, margin: 0 }}>📒 Gelir & Gider Takibi</h2>
        <Dugme onClick={function () { setFormKayit({ tip: "gider", tarih: bugun }); }} renk={MAVI}>➕ İşlem Ekle</Dugme>
      </div>

      <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 10 }}>
        {DONEMLER.map(function (d) {
          const secili = donem === d.id;
          return (
            <button key={d.id} className="gg-btn" onClick={function () { setDonem(d.id); }}
              style={Object.assign({ padding: "7px 12px", borderRadius: 20, fontSize: 12 },
                secili ? dolgu(MAVI) : { "--gg-bg": "var(--bg-panel)", "--gg-fg": "var(--text-muted)", "--gg-br": "var(--border-soft)" })}>{d.ad}</button>
          );
        })}
      </div>

      {donem === "ozel" ? (
        <div style={{ display: "flex", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 130 }}>
            <label className="gg-muted" style={etiketStil}>Başlangıç</label>
            <input type="date" value={ozelAralik.bas} onChange={function (e) { setOzelAralik(function (p) { return Object.assign({}, p, { bas: e.target.value }); }); }} style={girdi} />
          </div>
          <div style={{ flex: 1, minWidth: 130 }}>
            <label className="gg-muted" style={etiketStil}>Bitiş</label>
            <input type="date" value={ozelAralik.bit} onChange={function (e) { setOzelAralik(function (p) { return Object.assign({}, p, { bit: e.target.value }); }); }} style={girdi} />
          </div>
        </div>
      ) : null}

      <div className="gg-dim" style={{ fontSize: 11.5, marginBottom: 12 }}>
        📅 {aralik.etiket} · {gunSayisi} gün · {ozet.adet} işlem
      </div>

      {/* Alt sekmeler */}
      <div style={{ display: "flex", gap: 4, marginBottom: 16, background: "var(--bg-panel)", borderRadius: 12, padding: 4, flexWrap: "wrap" }}>
        {ALT_SEKMELER.map(function (s) {
          const secili = altSekme === s.id;
          return (
            <button key={s.id} className="gg-btn" onClick={function () { setAltSekme(s.id); }}
              style={Object.assign({ flex: 1, minWidth: 80, padding: "9px 6px", borderRadius: 9, fontSize: 11.5, fontWeight: secili ? 800 : 600 },
                secili ? solukDolgu(MAVI) : { "--gg-bg": "transparent", "--gg-fg": "var(--text-muted)", "--gg-br": "transparent" })}>{s.ad}</button>
          );
        })}
      </div>

      {/* ══ ÖZET ══ */}
      {altSekme === 0 ? (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 10, marginBottom: 12 }}>
            <KPI ikon="💰" baslik="Toplam Gelir" deger={paraYaz(ozet.gelir)} alt={ozet.gelirAdet + " tahsilat"} renk={YESIL} />
            <KPI ikon="💸" baslik="Toplam Gider" deger={paraYaz(ozet.gider)} alt={ozet.giderAdet + " harcama"} renk={KIRMIZI} />
            <KPI ikon={ozet.net >= 0 ? "📈" : "📉"} baslik={ozet.net >= 0 ? "Net Kâr" : "Net Zarar"} deger={paraYaz(ozet.net)}
              alt={"Kâr marjı: " + yuzdeYaz(ozet.marj)} renk={netRenk} vurgu />
            <KPI ikon="📊" baslik="Günlük Ortalama" deger={paraYaz(ozet.net / gunSayisi)}
              alt={"Gelir " + paraYaz(ozet.gelir / gunSayisi) + " · Gider " + paraYaz(ozet.gider / gunSayisi)} renk={MAVI} />
          </div>

          {/* Gelir-gider dengesi */}
          <div className="gg-kutu" style={{ padding: 14, marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: 700, marginBottom: 8 }}>
              <span className="gg-c" style={renk(YESIL)}>Gelir {paraYaz(ozet.gelir)}</span>
              <span className="gg-c" style={renk(KIRMIZI)}>Gider {paraYaz(ozet.gider)}</span>
            </div>
            <div className="gg-bar" style={{ height: 12, display: "flex" }}>
              <span style={{ width: (ozet.gelir + ozet.gider > 0 ? (ozet.gelir / (ozet.gelir + ozet.gider)) * 100 : 50) + "%", background: YESIL }} />
              <span style={{ flex: 1, background: ozet.gider > 0 ? KIRMIZI : "transparent" }} />
            </div>
            <div className="gg-dim" style={{ fontSize: 11, marginTop: 6 }}>
              {ozet.gelir > 0
                ? "Her 100 ₺ gelirin " + Math.round(ozet.giderOrani) + " ₺'si gidere gidiyor, " + Math.round(100 - ozet.giderOrani) + " ₺'si kâr olarak kalıyor."
                : "Bu dönemde henüz gelir kaydı yok."}
            </div>
          </div>

          {/* Bakım tahsilat hedefi */}
          <div className="gg-kutu" style={{ padding: 14, marginBottom: 12 }}>
            <div className="gg-text" style={{ fontWeight: 800, fontSize: 13, marginBottom: 10 }}>🎯 {tahsilat.etiket} Bakım Tahsilat Hedefi</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginBottom: 10 }}>
              <div style={{ textAlign: "center" }}>
                <div className="gg-c" style={Object.assign({ fontSize: 16, fontWeight: 900 }, renk(YESIL))}>{paraYaz(tahsilat.tahsil)}</div>
                <div className="gg-dim" style={{ fontSize: 10 }}>Tahsil edilen</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div className="gg-c" style={Object.assign({ fontSize: 16, fontWeight: 900 }, renk(MAVI))}>{paraYaz(tahsilat.hedef)}</div>
                <div className="gg-dim" style={{ fontSize: 10 }}>Aylık hedef</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div className="gg-c" style={Object.assign({ fontSize: 16, fontWeight: 900 }, renk(tahsilat.kalan > 0 ? TURUNCU : YESIL))}>{paraYaz(tahsilat.kalan)}</div>
                <div className="gg-dim" style={{ fontSize: 10 }}>Kalan</div>
              </div>
            </div>
            <div className="gg-bar" style={Object.assign({ height: 8 }, renk(MAVI))}>
              <i style={{ width: tahsilat.oran + "%" }} />
            </div>
            <div className="gg-dim" style={{ display: "flex", justifyContent: "space-between", fontSize: 10.5, marginTop: 6, gap: 8, flexWrap: "wrap" }}>
              <span>Tahsilat oranı: {yuzdeYaz(tahsilat.oran, 0)}</span>
              <span>Devir alacak: <b className="gg-c" style={renk(TURUNCU)}>{paraYaz(tahsilat.alacak)}</b></span>
            </div>
          </div>

          <div className="gg-kutu" style={{ padding: 14, marginBottom: 12 }}>
            <div className="gg-text" style={{ fontWeight: 800, fontSize: 13, marginBottom: 10 }}>📈 Son 12 Ay — Gelir / Gider / Net</div>
            <TrendGrafik seri={seri} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 12, marginBottom: 12 }}>
            <KategoriListesi baslik="💰 Gelir Dağılımı" dagilim={gelirDagilim} bosMetin="Bu dönemde gelir kaydı yok" />
            <KategoriListesi baslik="💸 Gider Dağılımı" dagilim={giderDagilim} bosMetin="Bu dönemde gider kaydı yok" />
          </div>

          {yontemler.length > 0 ? (
            <div className="gg-kutu" style={{ padding: 14, marginBottom: 12 }}>
              <div className="gg-text" style={{ fontWeight: 800, fontSize: 13, marginBottom: 10 }}>💳 Ödeme Yöntemine Göre</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {yontemler.map(function (y) {
                  return (
                    <div key={y.id} className="gg-ic-kutu" style={{ borderRadius: 10, padding: "9px 12px", minWidth: 120 }}>
                      <div className="gg-muted" style={{ fontSize: 11, fontWeight: 700 }}>{y.ikon} {y.ad}</div>
                      {y.gelir > 0 ? <div className="gg-c" style={Object.assign({ fontSize: 12, fontWeight: 800, marginTop: 3 }, renk(YESIL))}>+{paraYaz(y.gelir)}</div> : null}
                      {y.gider > 0 ? <div className="gg-c" style={Object.assign({ fontSize: 12, fontWeight: 800, marginTop: 3 }, renk(KIRMIZI))}>−{paraYaz(y.gider)}</div> : null}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}

          <div className="gg-kutu" style={{ overflow: "hidden" }}>
            <div style={{ padding: "12px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span className="gg-text" style={{ fontWeight: 800, fontSize: 13 }}>🕐 Son İşlemler</span>
              <Dugme kucuk ikincil onClick={function () { setAltSekme(1); }}>Tümü →</Dugme>
            </div>
            {donemKayitlari.filter(function (k) { return !k.iptal; }).slice(0, 8).map(function (k) {
              return <IslemSatiri key={k.id} k={k} onDuzenle={setFormKayit} onSil={kayitSil} onIptal={kayitIptal} />;
            })}
            {donemKayitlari.length === 0 ? (
              <div className="gg-dim" style={{ padding: "26px 14px", textAlign: "center", fontSize: 12.5 }}>
                Bu dönemde işlem yok. Sağ üstten ➕ İşlem Ekle ile başlayabilirsiniz.
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {/* ══ İŞLEMLER ══ */}
      {altSekme === 1 ? (
        <div>
          <div className="gg-kutu" style={{ padding: 14, marginBottom: 12 }}>
            <input type="text" value={arama} placeholder="🔍 Açıklama, bina, kategori, belge no ara..."
              onChange={function (e) { setArama(e.target.value); }} style={Object.assign({}, girdi, { marginBottom: 10 })} />
            <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
              {[{ id: "hepsi", ad: "Hepsi", c: MAVI }, { id: "gelir", ad: "💰 Gelir", c: YESIL }, { id: "gider", ad: "💸 Gider", c: KIRMIZI }].map(function (t) {
                return (
                  <Secim key={t.id} tam secili={tipFiltre === t.id} c={t.c}
                    onClick={function () { setTipFiltre(t.id); setKategoriFiltre("hepsi"); }}>{t.ad}</Secim>
                );
              })}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <select value={kategoriFiltre} onChange={function (e) { setKategoriFiltre(e.target.value); }} style={girdi}>
                <option value="hepsi">Tüm kategoriler</option>
                {filtreKategorileri.map(function (k) { return <option key={k.id} value={k.id}>{k.ikon + " " + k.ad}</option>; })}
              </select>
              <select value={yontemFiltre} onChange={function (e) { setYontemFiltre(e.target.value); }} style={girdi}>
                <option value="hepsi">Tüm ödeme yöntemleri</option>
                {YONTEMLER.map(function (y) { return <option key={y.id} value={y.id}>{y.ikon + " " + y.ad}</option>; })}
              </select>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10, gap: 8, flexWrap: "wrap" }}>
              <label className="gg-muted" style={{ display: "flex", alignItems: "center", gap: 7, cursor: "pointer", fontSize: 11.5 }}>
                <input type="checkbox" checked={iptalleriGoster} onChange={function (e) { setIptalleriGoster(e.target.checked); }} style={{ width: 16, height: 16, accentColor: KIRMIZI }} />
                İptal edilenleri de göster
              </label>
              <Dugme kucuk ikincil renk={YESIL} onClick={excelIndir} disabled={listeKayitlari.length === 0}>📥 Excel indir</Dugme>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginBottom: 12 }}>
            {[
              { c: YESIL, deger: listeOzet.gelir, ad: "Gelir" },
              { c: KIRMIZI, deger: listeOzet.gider, ad: "Gider" },
              { c: listeOzet.net >= 0 ? YESIL : KIRMIZI, deger: listeOzet.net, ad: "Net" },
            ].map(function (x) {
              return (
                <div key={x.ad} className="gg-tint" style={Object.assign({ padding: "9px 10px", textAlign: "center" }, tint(x.c))}>
                  <div className="gg-c" style={Object.assign({ fontSize: 14, fontWeight: 900 }, renk(x.c))}>{paraYaz(x.deger)}</div>
                  <div className="gg-dim" style={{ fontSize: 10 }}>{x.ad}</div>
                </div>
              );
            })}
          </div>

          {gunGruplari.length === 0 ? (
            <div className="gg-kutu" style={{ textAlign: "center", padding: "38px 16px" }}>
              <div style={{ fontSize: 34, marginBottom: 8 }}>🧾</div>
              <div className="gg-muted" style={{ fontWeight: 700, fontSize: 14 }}>Kayıt bulunamadı</div>
              <div className="gg-dim" style={{ fontSize: 12, marginTop: 5 }}>Dönemi veya filtreleri değiştirmeyi deneyin.</div>
            </div>
          ) : gunGruplari.map(function (g) {
            const bugunMu = g.tarih === bugun;
            return (
              <div key={g.tarih} className="gg-kutu" style={{ overflow: "hidden", marginBottom: 10 }}>
                <div className={bugunMu ? "gg-tint" : "gg-ic-kutu"} style={Object.assign({
                  padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center",
                  flexWrap: "wrap", gap: 6, borderRadius: 0, border: "none",
                }, bugunMu ? tint(MAVI) : {})}>
                  <span className={bugunMu ? "gg-c" : "gg-muted"} style={Object.assign({ fontSize: 12, fontWeight: 800 }, bugunMu ? renk(MAVI) : {})}>
                    {(bugunMu ? "☀️ Bugün · " : "") + gunAdi(g.tarih) + ", " + trTarih(g.tarih)}
                  </span>
                  <span style={{ fontSize: 11.5, fontWeight: 700, display: "flex", gap: 6 }}>
                    {g.gelir > 0 ? <span className="gg-c" style={renk(YESIL)}>+{paraYaz(g.gelir)}</span> : null}
                    {g.gider > 0 ? <span className="gg-c" style={renk(KIRMIZI)}>−{paraYaz(g.gider)}</span> : null}
                    <span className="gg-c" style={renk(g.net >= 0 ? YESIL : KIRMIZI)}>= {paraYaz(g.net)}</span>
                  </span>
                </div>
                {g.kayitlar.map(function (k) {
                  return <IslemSatiri key={k.id} k={k} onDuzenle={setFormKayit} onSil={kayitSil} onIptal={kayitIptal} />;
                })}
              </div>
            );
          })}
        </div>
      ) : null}

      {/* ══ SABİT GİDERLER ══ */}
      {altSekme === 2 ? (
        <div>
          <div className="gg-kutu" style={{ padding: 14, marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <div>
              <div className="gg-muted" style={{ fontSize: 12, fontWeight: 700 }}>Aylık sabit gider yükü</div>
              <div className="gg-c" style={Object.assign({ fontSize: 22, fontWeight: 900, marginTop: 3 }, renk(KIRMIZI))}>{paraYaz(sabitAylikToplam)}</div>
              <div className="gg-dim" style={{ fontSize: 10.5, marginTop: 2 }}>
                {(sabitGiderler || []).filter(function (s) { return s.aktif !== false; }).length} aktif kalem · yıllık {paraYaz(sabitAylikToplam * 12)}
              </div>
            </div>
            <Dugme onClick={function () { setSabitForm({}); }} renk={KIRMIZI}>➕ Sabit Gider</Dugme>
          </div>

          {(sabitGiderler || []).length === 0 ? (
            <div className="gg-kutu" style={{ textAlign: "center", padding: "38px 16px" }}>
              <div style={{ fontSize: 34, marginBottom: 8 }}>🔁</div>
              <div className="gg-muted" style={{ fontWeight: 700, fontSize: 14 }}>Henüz sabit gider tanımlı değil</div>
              <div className="gg-dim" style={{ fontSize: 12, marginTop: 5, lineHeight: 1.5 }}>
                Kira, maaş, SGK, sigorta gibi her ay tekrar eden giderleri bir kez tanımlayın;<br />uygulama her ay otomatik deftere işlesin.
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {(sabitGiderler || []).slice().sort(function (a, b) { return (Number(b.tutar) || 0) - (Number(a.tutar) || 0); }).map(function (s) {
                const bilgi = kategoriBilgi("gider", s.kategori);
                const pasif = s.aktif === false;
                return (
                  <div key={s.id} className="gg-kutu" style={{ padding: 14, display: "flex", alignItems: "center", gap: 11, opacity: pasif ? 0.55 : 1 }}>
                    <div className="gg-tint gg-c" style={Object.assign({ width: 38, height: 38, borderRadius: 11, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, flexShrink: 0 }, tint(bilgi.renk, "22", "22"), renk(bilgi.renk))}>{bilgi.ikon}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="gg-text" style={{ fontSize: 13.5, fontWeight: 800 }}>{s.ad}{pasif ? " (pasif)" : ""}</div>
                      <div className="gg-dim" style={{ fontSize: 10.5, marginTop: 2 }}>
                        {bilgi.ad} · her ayın {s.gun}. günü · {yontemBilgi(s.yontem).ad}
                      </div>
                      <div className="gg-dim" style={{ fontSize: 10.5, marginTop: 1 }}>
                        {ayEtiket(s.baslangic)}{s.bitis ? " – " + ayEtiket(s.bitis) : " – süresiz"}
                      </div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div className="gg-c" style={Object.assign({ fontSize: 15, fontWeight: 900 }, renk(KIRMIZI))}>{paraYaz(s.tutar)}</div>
                      <div style={{ display: "flex", gap: 5, marginTop: 5, justifyContent: "flex-end" }}>
                        <Dugme kucuk ikincil onClick={function () { setSabitForm(s); }}>✏️</Dugme>
                        <Dugme kucuk ikincil renk={KIRMIZI} onClick={function () { sabitSil(s); }}>🗑</Dugme>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : null}

      {/* ══ RAPORLAR ══ */}
      {altSekme === 3 ? (
        <div>
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 12, flexWrap: "wrap" }}>
            <select value={raporYil} onChange={function (e) { setRaporYil(parseInt(e.target.value, 10)); }} style={Object.assign({}, girdi, { width: "auto", minWidth: 120 })}>
              {yillar.map(function (y) { return <option key={y} value={y}>{y} yılı</option>; })}
            </select>
            <Dugme ikincil renk={YESIL} onClick={excelYilIndir}>📥 Yıllık kâr/zarar Excel</Dugme>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 10, marginBottom: 12 }}>
            <KPI ikon="💰" baslik={raporYil + " Geliri"} deger={paraYaz(yilOzet.gelir)} renk={YESIL} />
            <KPI ikon="💸" baslik={raporYil + " Gideri"} deger={paraYaz(yilOzet.gider)} renk={KIRMIZI} />
            <KPI ikon={yilOzet.net >= 0 ? "📈" : "📉"} baslik={raporYil + " Net"} deger={paraYaz(yilOzet.net)} alt={"Marj " + yuzdeYaz(yilOzet.marj)} renk={yilOzet.net >= 0 ? YESIL : KIRMIZI} vurgu />
            <KPI ikon="🧾" baslik="İşlem Sayısı" deger={String(yilOzet.adet)} alt={yilOzet.gelirAdet + " gelir · " + yilOzet.giderAdet + " gider"} renk={MAVI} />
          </div>

          <div className="gg-kutu" style={{ marginBottom: 12, overflow: "hidden" }}>
            <div className="gg-text" style={{ padding: "12px 14px", fontWeight: 800, fontSize: 13 }}>📅 Ay Ay Kâr / Zarar — {raporYil}</div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, minWidth: 420 }}>
                <thead>
                  <tr>
                    {["Ay", "Gelir", "Gider", "Net", "Marj"].map(function (h, i) {
                      return <th key={i} className="gg-muted" style={{ padding: "9px 12px", textAlign: i === 0 ? "left" : "right", fontWeight: 700, borderBottom: "1px solid var(--border-soft)", whiteSpace: "nowrap" }}>{h}</th>;
                    })}
                  </tr>
                </thead>
                <tbody>
                  {yilTablosu.map(function (s) {
                    const bos = s.gelir === 0 && s.gider === 0;
                    return (
                      <tr key={s.ay} style={{ borderBottom: "1px solid var(--border-soft)", opacity: bos ? 0.4 : 1 }}>
                        <td className="gg-text" style={{ padding: "8px 12px", fontWeight: 700 }}>{s.etiket}</td>
                        <td className="gg-c" style={Object.assign({ padding: "8px 12px", textAlign: "right", fontWeight: 700, whiteSpace: "nowrap" }, renk(YESIL))}>{s.gelir ? paraYaz(s.gelir) : "—"}</td>
                        <td className="gg-c" style={Object.assign({ padding: "8px 12px", textAlign: "right", fontWeight: 700, whiteSpace: "nowrap" }, renk(KIRMIZI))}>{s.gider ? paraYaz(s.gider) : "—"}</td>
                        <td className="gg-c" style={Object.assign({ padding: "8px 12px", textAlign: "right", fontWeight: 900, whiteSpace: "nowrap" }, renk(bos ? "var(--text-dim)" : s.net >= 0 ? YESIL : KIRMIZI))}>{bos ? "—" : paraYaz(s.net)}</td>
                        <td className="gg-muted" style={{ padding: "8px 12px", textAlign: "right", whiteSpace: "nowrap" }}>{s.gelir ? yuzdeYaz(s.marj, 0) : "—"}</td>
                      </tr>
                    );
                  })}
                  <tr className="gg-ic-kutu">
                    <td className="gg-text" style={{ padding: "10px 12px", fontWeight: 900 }}>TOPLAM</td>
                    <td className="gg-c" style={Object.assign({ padding: "10px 12px", textAlign: "right", fontWeight: 900, whiteSpace: "nowrap" }, renk(YESIL))}>{paraYaz(yilOzet.gelir)}</td>
                    <td className="gg-c" style={Object.assign({ padding: "10px 12px", textAlign: "right", fontWeight: 900, whiteSpace: "nowrap" }, renk(KIRMIZI))}>{paraYaz(yilOzet.gider)}</td>
                    <td className="gg-c" style={Object.assign({ padding: "10px 12px", textAlign: "right", fontWeight: 900, whiteSpace: "nowrap" }, renk(yilOzet.net >= 0 ? YESIL : KIRMIZI))}>{paraYaz(yilOzet.net)}</td>
                    <td className="gg-muted" style={{ padding: "10px 12px", textAlign: "right", fontWeight: 900 }}>{yuzdeYaz(yilOzet.marj, 0)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {yilOzet.kdvGelir > 0 || yilOzet.kdvGider > 0 ? (
            <div className="gg-kutu" style={{ padding: 14, marginBottom: 12 }}>
              <div className="gg-text" style={{ fontWeight: 800, fontSize: 13, marginBottom: 10 }}>🏛️ KDV Özeti — {raporYil}</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
                <div style={{ textAlign: "center" }}>
                  <div className="gg-c" style={Object.assign({ fontSize: 15, fontWeight: 900 }, renk(YESIL))}>{paraYaz(yilOzet.kdvGelir)}</div>
                  <div className="gg-dim" style={{ fontSize: 10 }}>Hesaplanan KDV</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div className="gg-c" style={Object.assign({ fontSize: 15, fontWeight: 900 }, renk(MAVI))}>{paraYaz(yilOzet.kdvGider)}</div>
                  <div className="gg-dim" style={{ fontSize: 10 }}>İndirilecek KDV</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div className="gg-c" style={Object.assign({ fontSize: 15, fontWeight: 900 }, renk(yilOzet.kdvFark >= 0 ? KIRMIZI : YESIL))}>{paraYaz(Math.abs(yilOzet.kdvFark))}</div>
                  <div className="gg-dim" style={{ fontSize: 10 }}>{yilOzet.kdvFark >= 0 ? "Ödenecek KDV" : "Devreden KDV"}</div>
                </div>
              </div>
              <div className="gg-dim" style={{ fontSize: 10.5, marginTop: 8 }}>
                Yalnızca KDV oranı girilen kayıtlar hesaba katılır; resmî beyan yerine geçmez.
              </div>
            </div>
          ) : null}

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 12, marginBottom: 12 }}>
            <KategoriListesi baslik={"💰 " + raporYil + " Gelir Kalemleri"} dagilim={kategoriDagilimi(yilKayitlari, "gelir")} bosMetin="Kayıt yok" />
            <KategoriListesi baslik={"💸 " + raporYil + " Gider Kalemleri"} dagilim={kategoriDagilimi(yilKayitlari, "gider")} bosMetin="Kayıt yok" />
          </div>

          {binaPerf.length > 0 ? (
            <div className="gg-kutu" style={{ overflow: "hidden" }}>
              <div className="gg-text" style={{ padding: "12px 14px", fontWeight: 800, fontSize: 13 }}>🏢 En Çok Kazandıran Binalar — {raporYil}</div>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, minWidth: 420 }}>
                  <thead>
                    <tr>
                      {["#", "Bina", "İlçe", "Gelir", "Gider", "Net"].map(function (h, i) {
                        return <th key={i} className="gg-muted" style={{ padding: "9px 12px", textAlign: i > 2 ? "right" : "left", fontWeight: 700, borderBottom: "1px solid var(--border-soft)", whiteSpace: "nowrap" }}>{h}</th>;
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {binaPerf.map(function (b, i) {
                      return (
                        <tr key={b.binaId} style={{ borderBottom: "1px solid var(--border-soft)" }}>
                          <td className="gg-dim" style={{ padding: "8px 12px" }}>{i + 1}</td>
                          <td className="gg-text" style={{ padding: "8px 12px", fontWeight: 700, maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{b.ad}</td>
                          <td className="gg-muted" style={{ padding: "8px 12px", whiteSpace: "nowrap" }}>{b.ilce || "—"}</td>
                          <td className="gg-c" style={Object.assign({ padding: "8px 12px", textAlign: "right", fontWeight: 700, whiteSpace: "nowrap" }, renk(YESIL))}>{paraYaz(b.gelir)}</td>
                          <td className="gg-c" style={Object.assign({ padding: "8px 12px", textAlign: "right", fontWeight: 700, whiteSpace: "nowrap" }, renk(KIRMIZI))}>{b.gider ? paraYaz(b.gider) : "—"}</td>
                          <td className="gg-c" style={Object.assign({ padding: "8px 12px", textAlign: "right", fontWeight: 900, whiteSpace: "nowrap" }, renk(b.net >= 0 ? YESIL : KIRMIZI))}>{paraYaz(b.net)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      {formKayit ? <IslemFormu kayit={formKayit} elevs={elevs} onKaydet={kayitYaz} onKapat={function () { setFormKayit(null); }} /> : null}
      {sabitForm ? <SabitGiderFormu sabit={sabitForm} onKaydet={sabitYaz} onKapat={function () { setSabitForm(null); }} /> : null}
    </div>
  );
}
