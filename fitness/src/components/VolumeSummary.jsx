import React from "react";
import { volumeRows, TARGET_MIN, TARGET_MAX } from "../data/volume";
import { tensionMix } from "../data/tension";

const COLOR = {
  none: "var(--line)",
  low:  "#fbbf24",
  ok:   "var(--accent)",
  high: "#fb923c",
};

// 📊 Haftalık kas grubu hacmi özeti — "omuz 10 set · göğüs 15 set" gibi.
// days: [{exercises, sets}] — tek program için [program] gönder.
// Hareket eklendikçe/çıktıkça anında güncellenir (saf hesap, state yok).
export default function VolumeSummary({ days, title = "Haftalık Hacim (set/kas)", compact = false, showTension = true }) {
  const list = Array.isArray(days) ? days : [days];
  const rows = volumeRows(list);
  const active = rows.filter((r) => r.sets > 0);
  const allIds = list.flatMap((d) => (d && d.exercises) || []);
  const mix = tensionMix(allIds);

  if (active.length === 0) {
    return (
      <div style={{ color: "var(--muted)", fontSize: 12 }}>
        Hareket ekledikçe haftalık set dağılımı burada görünecek.
      </div>
    );
  }

  const low = active.filter((r) => r.level === "low");

  // Kompakt: tek satır rozetler (ör. program kartı içinde)
  if (compact) {
    return (
      <div className="row" style={{ flexWrap: "wrap", gap: 6 }}>
        {active.map((r) => (
          <span key={r.id} style={{
            fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 999,
            background: "var(--card2)", color: COLOR[r.level],
          }}>
            {r.emoji} {r.name} {r.sets}
          </span>
        ))}
      </div>
    );
  }

  const max = Math.max(TARGET_MAX, ...active.map((r) => r.sets));

  return (
    <div>
      {title && <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8 }}>{title}</div>}
      {rows.map((r) => (
        <div key={r.id} style={{ marginBottom: 8 }}>
          <div className="row" style={{ justifyContent: "space-between", fontSize: 12, marginBottom: 3 }}>
            <span style={{ color: r.sets === 0 ? "var(--muted)" : "var(--text)" }}>{r.emoji} {r.name}</span>
            <span style={{ fontWeight: 700, color: COLOR[r.level] }}>
              {r.sets} set{r.level === "low" && r.sets > 0 ? " · az" : ""}
            </span>
          </div>
          <div style={{ position: "relative", height: 8, background: "var(--card2)", borderRadius: 999 }}>
            <div style={{ width: Math.min(100, (r.sets / max) * 100) + "%", height: "100%", background: COLOR[r.level], borderRadius: 999 }} />
            {/* 10 set = etkili alt eşik */}
            <div title="10 set — etkili alt eşik" style={{
              position: "absolute", top: -2, bottom: -2,
              left: (TARGET_MIN / max) * 100 + "%",
              width: 2, background: "var(--text)", opacity: 0.45, borderRadius: 2,
            }} />
          </div>
        </div>
      ))}

      <div style={{ color: "var(--muted)", fontSize: 10, marginTop: 6 }}>
        🟡 az (&lt;{TARGET_MIN}) · 🟢 ideal ({TARGET_MIN}-{TARGET_MAX}) · 🟠 yüksek (&gt;{TARGET_MAX}) · dikey çizgi = {TARGET_MIN} set eşiği
      </div>

      {low.length > 0 && (
        <p style={{ color: "#fbbf24", fontSize: 11.5, marginTop: 8, marginBottom: 0 }}>
          ⚠️ {low.map((r) => r.name).join(", ")} için haftalık set {TARGET_MIN}'un altında.
          Hipertrofi hedefliyorsan bu bölgelere hareket/set ekle.
        </p>
      )}

      {showTension && (
        <p style={{ color: mix.hasStretch ? "var(--muted)" : "#fbbf24", fontSize: 11.5, marginTop: 8, marginBottom: 0 }}>
          {mix.hasStretch
            ? `🔵 Gerilme (uzun boy) hareketi: ${mix.uzun} · ⚪ orta: ${mix.orta} · 🟠 kasılma: ${mix.kisa}`
            : "⚠️ Programda kası gerilmiş boyda yükleyen hareket yok. Hipertrofi için her kasa en az bir gerilme hareketi ekle."}
        </p>
      )}

      <p style={{ color: "var(--muted)", fontSize: 10.5, marginTop: 6, marginBottom: 0 }}>
        Not: Bileşik hareketlerin yardımcı kaslara katkısı yarım set sayılır (ör. bench press → omuz/kol).
      </p>
    </div>
  );
}
