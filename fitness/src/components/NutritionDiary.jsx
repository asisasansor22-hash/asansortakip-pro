import React, { useEffect, useState } from "react";
import { dbGet, dbSet } from "../firebase";

const z = (n) => String(n).padStart(2, "0");
const dayKey = (d = new Date()) => d.getFullYear() + "-" + z(d.getMonth() + 1) + "-" + z(d.getDate());
const num = (s) => { const n = parseFloat(String(s).replace(",", ".")); return isNaN(n) ? 0 : n; };
const GLASS = 250; // ml

// Sık kullanılan yiyecekler (kcal / protein g, porsiyon başına yaklaşık)
const QUICK = [
  { name: "Yumurta (1 adet)", kcal: 78, p: 6 },
  { name: "Tavuk göğsü (100g)", kcal: 165, p: 31 },
  { name: "Pirinç pilav (1 kase)", kcal: 200, p: 4 },
  { name: "Yulaf (50g)", kcal: 190, p: 7 },
  { name: "Tam buğday ekmek (1 dilim)", kcal: 70, p: 3 },
  { name: "Yoğurt (200g)", kcal: 120, p: 10 },
  { name: "Muz (1 adet)", kcal: 105, p: 1 },
  { name: "Whey protein (1 ölçek)", kcal: 120, p: 24 },
  { name: "Ton balığı (1 kutu)", kcal: 130, p: 28 },
  { name: "Badem (30g)", kcal: 170, p: 6 },
];

function Bar({ val, goal, color }) {
  const pct = goal > 0 ? Math.min(100, Math.round((val / goal) * 100)) : 0;
  return (
    <div style={{ height: 8, borderRadius: 999, background: "var(--card2)", overflow: "hidden", marginTop: 6 }}>
      <div style={{ width: pct + "%", height: "100%", background: color, borderRadius: 999, transition: "width .2s" }} />
    </div>
  );
}

export default function NutritionDiary() {
  const [diary, setDiary] = useState({ goal: { kcal: 0, protein: 0 }, days: {} });
  const [loaded, setLoaded] = useState(false);
  const today = dayKey();

  const [name, setName] = useState("");
  const [kcal, setKcal] = useState("");
  const [prot, setProt] = useState("");
  const [editGoal, setEditGoal] = useState(false);
  const [gKcal, setGKcal] = useState("");
  const [gProt, setGProt] = useState("");

  useEffect(() => {
    let alive = true;
    (async () => {
      const d = await dbGet("diary");
      if (alive && d && typeof d === "object") {
        setDiary({ goal: d.goal || { kcal: 0, protein: 0 }, days: d.days || {} });
      }
      if (alive) setLoaded(true);
    })();
    return () => { alive = false; };
  }, []);

  // Fonksiyonel kalıcılık: en güncel state üzerinden hesapla (hızlı ardışık
  // eklemelerde bayat-closure yüzünden veri kaybı olmasın).
  function persistFn(updater) {
    setDiary((prev) => { const next = updater(prev); dbSet("diary", next); return next; });
  }
  const mkItem = (item) => ({
    id: "f_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
    name: item.name, kcal: Math.round(item.kcal || 0), p: Math.round(item.p || 0),
  });
  // Bir state'ten bugünkü günü normalize ederek çıkar
  function dayOf(state) {
    const raw = (state.days && state.days[today]) || {};
    const items = Array.isArray(raw.items) ? raw.items : (raw.items ? Object.values(raw.items) : []);
    return { items, water: raw.water || 0 };
  }
  // Bugünkü günü fn ile güncelle + 31 günden eskisini buda
  function withDay(prev, fn) {
    const cur = dayOf(prev);
    const nextDay = { ...cur, ...fn(cur) };
    const days = { ...prev.days, [today]: nextDay };
    const keys = Object.keys(days).sort();
    while (keys.length > 31) delete days[keys.shift()];
    return { ...prev, days };
  }

  // Firebase boş dizileri kaydetmez; okurken items/water eksik gelebilir → normalize et
  const rawDay = diary.days[today] || {};
  const dayItems = Array.isArray(rawDay.items) ? rawDay.items : (rawDay.items ? Object.values(rawDay.items) : []);
  const day = { items: dayItems, water: rawDay.water || 0 };
  const totKcal = day.items.reduce((s, x) => s + ((x && x.kcal) || 0), 0);
  const totProt = day.items.reduce((s, x) => s + ((x && x.p) || 0), 0);
  const goal = diary.goal || { kcal: 0, protein: 0 };

  function addItem(item) {
    if (!item.name) return;
    const it = mkItem(item);
    persistFn((prev) => withDay(prev, (d) => ({ items: [...d.items, it] })));
  }
  function addManual() {
    if (!name.trim()) return;
    const item = { name: name.trim(), kcal: num(kcal), p: num(prot) };
    addItemWithRecent(item);
    setName(""); setKcal(""); setProt("");
  }

  // Manuel eklenen yiyeceği hem güne hem "son kullanılanlar"a yaz
  function addItemWithRecent(item) {
    const it = mkItem(item);
    persistFn((prev) => {
      const base = withDay(prev, (d) => ({ items: [...d.items, it] }));
      const rec = [{ name: it.name, kcal: it.kcal, p: it.p },
        ...(Array.isArray(prev.recent) ? prev.recent : []).filter((r) => r.name.toLowerCase() !== it.name.toLowerCase())].slice(0, 10);
      return { ...base, recent: rec };
    });
  }
  function delItem(id) { persistFn((prev) => withDay(prev, (d) => ({ items: d.items.filter((x) => x.id !== id) }))); }
  function water(delta) { persistFn((prev) => withDay(prev, (d) => ({ water: Math.max(0, (d.water || 0) + delta) }))); }

  function saveGoal() {
    persistFn((prev) => ({ ...prev, goal: { kcal: Math.round(num(gKcal)), protein: Math.round(num(gProt)) } }));
    setEditGoal(false);
  }

  if (!loaded) return <p style={{ color: "var(--muted)" }}>Yükleniyor…</p>;

  const waterMl = (day.water || 0) * GLASS;

  return (
    <div>
      <p style={{ color: "var(--muted)", marginTop: -4 }}>Bugün yediklerini ekle, kalori ve proteini hedefine göre takip et.</p>

      {/* Özet */}
      <div className="card" style={{ marginBottom: 12 }}>
        <div className="row" style={{ justifyContent: "space-between", alignItems: "baseline" }}>
          <div style={{ fontWeight: 800, fontSize: 22 }}>{totKcal} <span style={{ fontSize: 13, color: "var(--muted)" }}>kcal</span></div>
          <button className="icon-btn" onClick={() => { setGKcal(goal.kcal ? String(goal.kcal) : ""); setGProt(goal.protein ? String(goal.protein) : ""); setEditGoal((v) => !v); }}>
            🎯 Hedef
          </button>
        </div>
        {goal.kcal > 0 && (
          <>
            <div style={{ color: "var(--muted)", fontSize: 12, marginTop: 2 }}>
              Hedef {goal.kcal} kcal · Kalan {Math.max(0, goal.kcal - totKcal)} kcal
            </div>
            <Bar val={totKcal} goal={goal.kcal} color={totKcal > goal.kcal ? "#fca5a5" : "var(--accent)"} />
          </>
        )}
        <div className="row" style={{ justifyContent: "space-between", marginTop: 12 }}>
          <div style={{ fontSize: 13 }}>Protein: <b>{totProt} g</b>{goal.protein > 0 && <span style={{ color: "var(--muted)" }}> / {goal.protein} g</span>}</div>
        </div>
        {goal.protein > 0 && <Bar val={totProt} goal={goal.protein} color="var(--accent2)" />}

        {editGoal && (
          <div className="row" style={{ gap: 8, marginTop: 12 }}>
            <input className="input" type="number" inputMode="numeric" placeholder="Kalori hedefi" value={gKcal} onChange={(e) => setGKcal(e.target.value)} />
            <input className="input" type="number" inputMode="numeric" placeholder="Protein (g)" value={gProt} onChange={(e) => setGProt(e.target.value)} />
            <button className="btn-primary" style={{ width: "auto", padding: "0 16px" }} onClick={saveGoal}>Kaydet</button>
          </div>
        )}
        {!goal.kcal && !editGoal && (
          <p style={{ color: "var(--muted)", fontSize: 12, marginTop: 8 }}>Hedef belirlemek için “🎯 Hedef”e dokun. (Kalori sekmesinden ihtiyacını hesaplayabilirsin.)</p>
        )}
      </div>

      {/* Su takibi */}
      <div className="card" style={{ marginBottom: 12 }}>
        <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontWeight: 700 }}>💧 Su</div>
            <div style={{ color: "var(--muted)", fontSize: 12 }}>{day.water || 0} bardak · {(waterMl / 1000).toFixed(2)} L</div>
          </div>
          <div className="row" style={{ gap: 8 }}>
            <button className="icon-btn" onClick={() => water(-1)} style={{ fontSize: 18, padding: "4px 14px" }}>−</button>
            <button className="icon-btn" onClick={() => water(1)} style={{ fontSize: 18, padding: "4px 14px" }}>＋</button>
          </div>
        </div>
      </div>

      {/* Öğün ekle */}
      <div className="section-title">Yiyecek Ekle</div>
      <div className="row" style={{ gap: 6, marginBottom: 8 }}>
        <input className="input" placeholder="Yiyecek adı" value={name} onChange={(e) => setName(e.target.value)} style={{ flex: 2 }} />
        <input className="input" type="number" inputMode="numeric" placeholder="kcal" value={kcal} onChange={(e) => setKcal(e.target.value)} style={{ flex: 1, minWidth: 0 }} />
        <input className="input" type="number" inputMode="numeric" placeholder="prot" value={prot} onChange={(e) => setProt(e.target.value)} style={{ flex: 1, minWidth: 0 }} />
        <button className="btn-primary" style={{ width: "auto", padding: "0 16px" }} onClick={addManual}>Ekle</button>
      </div>
      {Array.isArray(diary.recent) && diary.recent.length > 0 && (
        <>
          <div style={{ color: "var(--muted)", fontSize: 11, margin: "0 4px 4px" }}>Son kullanılanlar</div>
          <div className="chips" style={{ marginBottom: 8 }}>
            {diary.recent.map((r) => (
              <button key={r.name} className="chip on" onClick={() => addItemWithRecent(r)} title={r.kcal + " kcal · " + r.p + "g protein"}>
                ↻ {r.name}
              </button>
            ))}
          </div>
        </>
      )}
      <div className="chips" style={{ marginBottom: 14 }}>
        {QUICK.map((q) => (
          <button key={q.name} className="chip" onClick={() => addItem(q)} title={q.kcal + " kcal · " + q.p + "g protein"}>
            + {q.name.replace(/\s*\(.*\)/, "")}
          </button>
        ))}
      </div>

      {/* Bugünün listesi */}
      <div className="section-title">Bugün ({day.items.length})</div>
      {day.items.length === 0 ? (
        <p style={{ color: "var(--muted)", fontSize: 13 }}>Henüz bir şey eklemedin.</p>
      ) : (
        day.items.map((it) => (
          <div key={it.id} className="card" style={{ marginBottom: 8, padding: 12 }}>
            <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 14, wordBreak: "break-word" }}>{it.name}</div>
                <div style={{ color: "var(--muted)", fontSize: 12 }}>{it.kcal} kcal · {it.p} g protein</div>
              </div>
              <button className="icon-btn" onClick={() => delItem(it.id)} style={{ padding: "4px 10px" }}>✕</button>
            </div>
          </div>
        ))
      )}

      <p style={{ color: "var(--muted)", fontSize: 12, textAlign: "center", marginTop: 16 }}>
        Değerler yaklaşıktır; günlük son 31 gün saklanır.
      </p>
    </div>
  );
}
