import React, { useState } from "react";
import { NUTRITION_PLANS } from "../data/nutrition";
import { SUPPLEMENTS, TIERS } from "../data/supplements";
import CalorieCalculator from "./CalorieCalculator";
import NutritionDiary from "./NutritionDiary";

const SUBTABS = [
  { id: "diary", label: "Günlük" },
  { id: "plans", label: "Diyet" },
  { id: "calorie", label: "Kalori" },
  { id: "supps", label: "Supplement" },
];

function DietPlans() {
  const [open, setOpen] = useState(NUTRITION_PLANS[0].id);
  return (
    <div>
      <p style={{ color: "var(--muted)", marginTop: -4 }}>Hedefine göre hazır yemek düzeni ve makro hedefleri.</p>
      {NUTRITION_PLANS.map((n) => {
        const isOpen = open === n.id;
        return (
          <div key={n.id} className="card" style={{ marginBottom: 12 }}>
            <button onClick={() => setOpen(isOpen ? null : n.id)}
              style={{ background: "none", color: "var(--text)", width: "100%", textAlign: "left" }}>
              <div className="row" style={{ justifyContent: "space-between" }}>
                <div style={{ fontWeight: 800, fontSize: 16 }}>{n.emoji} {n.name}</div>
                <span className="pill">{n.kcal}</span>
              </div>
              <p style={{ color: "var(--muted)", fontSize: 13, margin: "8px 0 0" }}>{n.desc}</p>
            </button>
            {isOpen && (
              <div style={{ marginTop: 12 }}>
                <div className="macro" style={{ marginBottom: 12 }}>
                  <div className="m"><b>{n.macros.protein}</b><s>Protein</s></div>
                  <div className="m"><b>{n.macros.carb}</b><s>Karbonhidrat</s></div>
                  <div className="m"><b>{n.macros.fat}</b><s>Yağ</s></div>
                </div>
                {n.meals.map((m, i) => (
                  <div key={i} className="meal"><h4>{m.title}</h4><p>{m.items}</p></div>
                ))}
              </div>
            )}
          </div>
        );
      })}
      <p style={{ color: "var(--muted)", fontSize: 12, textAlign: "center", marginTop: 16 }}>
        ⚠️ Bu planlar genel öneridir. Sağlık durumuna göre bir diyetisyene danışman önerilir.
      </p>
    </div>
  );
}

function Supplements() {
  const [open, setOpen] = useState(null);
  const renk = (k) => k === "Güçlü" ? "var(--ok)" : k === "Orta" ? "var(--warn)" : k === "Yok" ? "var(--danger)" : "var(--muted)";
  const tierRenk = { iyi: "var(--ok)", kosullu: "var(--warn)", gereksiz: "var(--danger)" };

  return (
    <div>
      <p style={{ color: "var(--muted)", marginTop: -4 }}>
        Kanıt düzeyine göre sıralanmış takviye rehberi — dozaj, çekince ve araştırma notlarıyla.
      </p>

      {/* Beklenti ayarı: takviye asıl işin yerine geçmez */}
      <div className="card" style={{ marginBottom: 14, borderColor: "var(--accent2)" }}>
        <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 6 }}>🎯 Önce şunu bil</div>
        <p style={{ color: "var(--muted)", fontSize: 12.5, margin: 0, lineHeight: 1.6 }}>
          Kas gelişiminin büyük kısmı <b>antrenman hacmi, aşamalı yüklenme, yeterli protein/kalori ve uykudan</b> gelir.
          Takviye en iyi ihtimalle kenar süsüdür — aşağıdaki “işe yarar” listesindekiler bile tek başına fark yaratmaz.
        </p>
        <p style={{ color: "var(--attn)", fontSize: 12, margin: "10px 0 0", lineHeight: 1.6 }}>
          ⚠️ <b>Pazarlama tuzağı:</b> “Kas protein sentezini %X artırır” iddiası tek başına bir şey ifade etmez.
          Mitchell ve ark. (2014) akut protein sentezi yanıtı ile <b>16 haftalık gerçek kas büyümesi arasında
          bağlantı bulamadı</b>. Bir ürün yalnızca bu veriyle pazarlanıyorsa, kas yaptığı kanıtlanmış değildir.
        </p>
      </div>

      {TIERS.map((tier) => {
        const list = SUPPLEMENTS.filter((s) => s.tier === tier.id);
        if (!list.length) return null;
        return (
          <div key={tier.id} style={{ marginBottom: 6 }}>
            <div className="section-title" style={{ color: tierRenk[tier.id] }}>{tier.label}</div>
            <p style={{ color: "var(--muted)", fontSize: 12, margin: "-4px 4px 10px" }}>{tier.desc}</p>
            {list.map((s) => {
              const isOpen = open === s.id;
              return (
                <div key={s.id} className="card" style={{ marginBottom: 10, borderColor: isOpen ? tierRenk[tier.id] : undefined }}>
                  <button onClick={() => setOpen(isOpen ? null : s.id)}
                    style={{ background: "none", color: "var(--text)", width: "100%", textAlign: "left" }}>
                    <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                      <div style={{ fontWeight: 800, fontSize: 15, minWidth: 0 }}>{s.emoji} {s.name}</div>
                      <span className="pill" style={{ color: renk(s.kanit), flexShrink: 0 }}>Kanıt: {s.kanit}</span>
                    </div>
                    <p style={{ color: "var(--muted)", fontSize: 13, margin: "8px 0 0", lineHeight: 1.5 }}>{s.fayda}</p>
                  </button>
                  {isOpen && (
                    <div style={{ marginTop: 10 }}>
                      <div className="meal"><h4>💊 Dozaj</h4><p>{s.doz}</p></div>
                      <ul className="tips" style={{ marginTop: 6 }}>
                        {s.notlar.map((t, i) => <li key={i}>• {t}</li>)}
                      </ul>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        );
      })}

      <p style={{ color: "var(--muted)", fontSize: 11.5, textAlign: "center", marginTop: 16, lineHeight: 1.6 }}>
        Kaynaklar: ISSN position stand'leri, sistematik derlemeler ve meta-analizler.<br />
        ⚠️ Takviyeler dengeli beslenmenin yerini tutmaz. İlaç kullanıyorsan veya sağlık sorunun varsa doktoruna danış.
      </p>
    </div>
  );
}

export default function Nutrition() {
  const [tab, setTab] = useState("diary");
  return (
    <div>
      <h2>Beslenme</h2>
      <div className="subtabs">
        {SUBTABS.map((t) => (
          <button key={t.id} className={"subtab" + (tab === t.id ? " on" : "")} onClick={() => setTab(t.id)}>{t.label}</button>
        ))}
      </div>
      {tab === "diary" && <NutritionDiary />}
      {tab === "plans" && <DietPlans />}
      {tab === "calorie" && <CalorieCalculator />}
      {tab === "supps" && <Supplements />}
    </div>
  );
}
