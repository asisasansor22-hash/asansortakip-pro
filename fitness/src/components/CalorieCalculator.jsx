import React, { useState } from "react";

// Mifflin-St Jeor BMR + aktivite çarpanı (TDEE) + hedefe göre kalori & makro.
const ACTIVITY = [
  { id: 1.2, label: "Hareketsiz (masa başı)" },
  { id: 1.375, label: "Hafif (haftada 1-3 antrenman)" },
  { id: 1.55, label: "Orta (haftada 3-5 antrenman)" },
  { id: 1.725, label: "Aktif (haftada 6-7 antrenman)" },
  { id: 1.9, label: "Çok aktif (ağır iş + antrenman)" },
];
const GOALS = [
  { id: "cut", label: "Yağ ver", adj: -0.20, pro: 2.2 },
  { id: "maintain", label: "Koru", adj: 0, pro: 1.8 },
  { id: "bulk", label: "Kas yap", adj: 0.12, pro: 2.0 },
];

export default function CalorieCalculator() {
  const [gender, setGender] = useState("male");
  const [age, setAge] = useState("");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [act, setAct] = useState(1.55);
  const [goal, setGoal] = useState("maintain");
  const [res, setRes] = useState(null);

  function calc(e) {
    e.preventDefault();
    const a = +age, h = +height, w = +weight;
    if (!a || !h || !w) { setRes({ err: "Yaş, boy ve kilo gir." }); return; }
    const bmr = 10 * w + 6.25 * h - 5 * a + (gender === "male" ? 5 : -161);
    const tdee = bmr * act;
    const g = GOALS.find((x) => x.id === goal);
    const kcal = Math.round(tdee * (1 + g.adj));
    const protein = Math.round(w * g.pro);          // g
    const fat = Math.round(w * 0.9);                 // g
    const fatKcal = fat * 9, proKcal = protein * 4;
    const carb = Math.max(0, Math.round((kcal - fatKcal - proKcal) / 4));
    const weekly = ((kcal - tdee) * 7) / 7700; // kg/hafta (7700 kcal ≈ 1 kg)
    setRes({ bmr: Math.round(bmr), tdee: Math.round(tdee), kcal, protein, fat, carb, weekly });
  }

  return (
    <div>
      <p style={{ color: "var(--muted)", marginTop: -4 }}>
        Günlük kalori ve makro ihtiyacını hesapla (Mifflin-St Jeor formülü).
      </p>
      <form onSubmit={calc} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <div className="row">
          <button type="button" className={"seg" + (gender === "male" ? " on" : "")} onClick={() => setGender("male")}>♂ Erkek</button>
          <button type="button" className={"seg" + (gender === "female" ? " on" : "")} onClick={() => setGender("female")}>♀ Kadın</button>
        </div>
        <div className="row">
          <input className="input" type="number" placeholder="Yaş" value={age} onChange={(e) => setAge(e.target.value)} />
          <input className="input" type="number" placeholder="Boy (cm)" value={height} onChange={(e) => setHeight(e.target.value)} />
          <input className="input" type="number" placeholder="Kilo (kg)" value={weight} onChange={(e) => setWeight(e.target.value)} />
        </div>
        <select className="input" value={act} onChange={(e) => setAct(+e.target.value)}>
          {ACTIVITY.map((a) => <option key={a.id} value={a.id}>{a.label}</option>)}
        </select>
        <div className="row">
          {GOALS.map((g) => (
            <button type="button" key={g.id} className={"seg" + (goal === g.id ? " on" : "")} onClick={() => setGoal(g.id)}>{g.label}</button>
          ))}
        </div>
        <button className="btn-primary">Hesapla</button>
      </form>

      {res && res.err && <div className="err" style={{ marginTop: 12 }}>{res.err}</div>}
      {res && !res.err && (
        <div style={{ marginTop: 16 }}>
          <div className="kcal-big">{res.kcal} <span>kcal/gün</span></div>
          <div style={{ color: "var(--muted)", fontSize: 12, textAlign: "center", marginBottom: 10 }}>
            BMR {res.bmr} · Korunum (TDEE) {res.tdee} kcal
          </div>
          {Math.abs(res.weekly) >= 0.05 && (
            <div style={{ textAlign: "center", fontSize: 13, marginBottom: 12, color: res.weekly < 0 ? "var(--ok)" : "var(--accent)" }}>
              ≈ haftada {Math.abs(res.weekly).toFixed(2)} kg {res.weekly < 0 ? "verirsin" : "alırsın"}
              <span style={{ color: "var(--muted)" }}> (güvenli aralık 0.25–1 kg)</span>
            </div>
          )}
          <div className="macro">
            <div className="m"><b>{res.protein} g</b><s>Protein</s></div>
            <div className="m"><b>{res.carb} g</b><s>Karbonhidrat</s></div>
            <div className="m"><b>{res.fat} g</b><s>Yağ</s></div>
          </div>
          <p style={{ color: "var(--muted)", fontSize: 12, marginTop: 12 }}>
            Protein hedefi {GOALS.find((g) => g.id === goal).pro} g/kg araştırma aralığındadır (kas için ~1.6-2.2 g/kg).
            Değerler tahmindir; 2-3 hafta sonra kilo değişimine göre ayarla.
          </p>
        </div>
      )}
    </div>
  );
}
