import React, { useState } from "react";
import { READY_PROGRAMS } from "../data/programs";
import { getExercise } from "../data/exercises";
import ExerciseAnimation from "./ExerciseAnimation";

export default function ReadyPrograms({ onCopy, onCopyDay, profile }) {
  const [open, setOpen] = useState(null);
  const [copied, setCopied] = useState(null);
  const [copiedDay, setCopiedDay] = useState(null);
  const [showAll, setShowAll] = useState(false);
  const [princ, setPrinc] = useState(false);

  function copy(p) {
    if (onCopy) onCopy(p);
    setCopied(p.id);
    setTimeout(() => setCopied(null), 1800);
  }
  function copyDay(p, di) {
    if (onCopyDay) onCopyDay(p, di);
    setCopiedDay(p.id + "-" + di);
    setTimeout(() => setCopiedDay(null), 1800);
  }

  // Profil filtresi: cinsiyet (uygun veya herkes) + stil eşleşmesi.
  // Hedef eşleşmesi sıralamada öne alır. "Tümünü gör" tüm programları açar.
  let list = READY_PROGRAMS;
  if (profile && !showAll) {
    list = READY_PROGRAMS.filter((p) =>
      (p.gender === "herkes" || p.gender === profile.gender) && p.style === profile.style
    );
    if (list.length === 0) {
      list = READY_PROGRAMS.filter((p) => p.gender === "herkes" || p.gender === profile.gender);
    }
    list = [...list].sort((a, b) => (b.goalTag === profile.goal) - (a.goalTag === profile.goal));
  }

  return (
    <div>
      <h2>Hazır Programlar</h2>
      <p style={{ color: "var(--muted)", marginTop: -4 }}>
        {profile && !showAll ? "Profiline göre önerilen programlar." : "Tüm hazır programlar."} Kopyala, "Programım"da düzenle.
      </p>

      <div className="card" style={{ marginBottom: 14, borderColor: "var(--accent2)" }}>
        <button onClick={() => setPrinc((v) => !v)} style={{ background: "none", color: "var(--text)", width: "100%", textAlign: "left", fontWeight: 700, fontSize: 15 }}>
          🔬 Temel İlkeler (bilimsel) {princ ? "▲" : "▼"}
        </button>
        {princ && (
          <div style={{ marginTop: 10, fontSize: 13, lineHeight: 1.5, color: "var(--text)" }}>
            <p style={{ margin: "0 0 8px" }}><b style={{ color: "var(--accent)" }}>📈 Progresif yüklenme</b> — En kritik ilke. Her hafta kilo, tekrar veya seti azar azar artır. İlerleme olmazsa kas da olmaz.</p>
            <p style={{ margin: "0 0 8px" }}><b style={{ color: "var(--accent)" }}>📊 Hacim</b> — Kas başına haftada <b>10–20 set</b> hipertrofi için etkili aralık.</p>
            <p style={{ margin: "0 0 8px" }}><b style={{ color: "var(--accent)" }}>🔁 Frekans</b> — Her kası haftada <b>en az 2 kez</b> çalış (hacmi güne yay).</p>
            <p style={{ margin: "0 0 8px" }}><b style={{ color: "var(--accent)" }}>🔢 Tekrar aralığı</b> — Ağır bileşik 5–8, hipertrofi 8–15, izolasyon 15–30. Her set'i yetmezliğe <b>1–3 tekrar</b> kala bitir.</p>
            <p style={{ margin: "0 0 8px" }}><b style={{ color: "var(--accent)" }}>🧘 Form &gt; ağırlık</b> — Doğru form + tam hareket açıklığı, ego liftten önce gelir. Dinlenme: güç 2–3 dk, hipertrofi 1–2 dk.</p>
            <p style={{ margin: 0, color: "var(--muted)", fontSize: 12 }}>
              ⚧ Egzersizler kadın ve erkekte <b>aynı</b> çalışır (2025 meta-analizi: kadınlar aynı oranda kas yapar). Cinsiyet seçimi yalnızca program <b>vurgusunu</b> belirler, zorunluluk değildir.
            </p>
          </div>
        )}
      </div>

      {profile && (
        <div className="row" style={{ marginBottom: 14 }}>
          <button className={"seg" + (!showAll ? " on" : "")} onClick={() => setShowAll(false)}>Bana özel</button>
          <button className={"seg" + (showAll ? " on" : "")} onClick={() => setShowAll(true)}>Tümünü gör</button>
        </div>
      )}

      {list.map((p) => {
        const isOpen = open === p.id;
        return (
          <div key={p.id} className="card" style={{ marginBottom: 12 }}>
            <div className="row" style={{ justifyContent: "space-between" }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: 16 }}>{p.name}</div>
                <div style={{ color: "var(--muted)", fontSize: 12, marginTop: 2 }}>{p.goal} · {p.freq}</div>
              </div>
              <span className="pill lvl">{p.level}</span>
            </div>
            <p style={{ color: "var(--muted)", fontSize: 13, margin: "10px 0" }}>{p.desc}</p>

            <div className="row">
              <button className="icon-btn" onClick={() => setOpen(isOpen ? null : p.id)}>
                {isOpen ? "Gizle" : "Detay"}
              </button>
              <button className="icon-btn" style={{ color: "var(--accent)" }} onClick={() => copy(p)}>
                {copied === p.id ? "✓ Eklendi" : (p.days.length > 1 ? "Tüm günleri ekle" : "Programıma ekle")}
              </button>
            </div>

            {isOpen && (
              <div style={{ marginTop: 12 }}>
                {p.days.length > 1 && (
                  <p style={{ color: "var(--muted)", fontSize: 12, margin: "0 4px 10px" }}>
                    💡 Her günü ayrı program olarak ekleyip <b>Haftalık Plan</b>'dan istediğin güne atayabilirsin (ör. Push→Salı, Pull→Cuma).
                  </p>
                )}
                {p.days.map((d, di) => (
                  <div key={di} style={{ marginBottom: 14 }}>
                    <div className="row" style={{ justifyContent: "space-between", alignItems: "center", margin: "6px 4px" }}>
                      <div className="section-title" style={{ margin: 0 }}>{d.name}</div>
                      {d.exercises && d.exercises.length > 0 && (
                        <button className="icon-btn" style={{ color: "var(--accent)", padding: "4px 10px", fontSize: 12 }} onClick={() => copyDay(p, di)}>
                          {copiedDay === p.id + "-" + di ? "✓ Eklendi" : "+ Bu günü ekle"}
                        </button>
                      )}
                    </div>
                    {d.note && <p style={{ color: "var(--muted)", fontSize: 13, margin: "0 4px 8px" }}>{d.note}</p>}
                    {d.exercises && d.exercises.length > 0 && (
                      <div className="grid">
                        {d.exercises.map((exId) => {
                          const ex = getExercise(exId);
                          if (!ex) return null;
                          return (
                            <div key={exId} className="card ex-card" style={{ padding: 8 }}>
                              <div className="figbox"><ExerciseAnimation type={ex.anim} gear={ex.equip} exId={ex.id} size={84} still /></div>
                              <div className="exname" style={{ fontSize: 12 }}>{ex.name}</div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
