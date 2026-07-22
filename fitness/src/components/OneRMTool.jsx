import React, { useState } from "react";

// Epley: 1RM = w × (1 + r/30)
const est1RM = (w, r) => (w > 0 && r > 0 ? w * (1 + r / 30) : 0);
const round05 = (x) => Math.round(x * 2) / 2;

// % → yaklaşık yapılabilir tekrar (kaba rehber)
const PCT = [
  { p: 100, r: "1" }, { p: 95, r: "2" }, { p: 90, r: "4" }, { p: 85, r: "6" },
  { p: 80, r: "8" }, { p: 75, r: "10" }, { p: 70, r: "12" }, { p: 65, r: "15" }, { p: 60, r: "18-20" },
];

// 🧮 1RM & Yüzde Tablosu — kilo+tekrar gir, 1RM'ini ve antrenman yüzdelerini gör.
export default function OneRMTool({ onClose }) {
  const [w, setW] = useState("");
  const [r, setR] = useState("");
  const num = (s) => { const n = parseFloat(String(s).replace(",", ".")); return isNaN(n) ? 0 : n; };
  const orm = est1RM(num(w), num(r));

  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,.6)", zIndex: 60,
      display: "flex", alignItems: "flex-end", justifyContent: "center",
    }}>
      <div onClick={(e) => e.stopPropagation()} className="card" style={{
        width: "100%", maxWidth: 560, borderRadius: "16px 16px 0 0", maxHeight: "88vh", overflowY: "auto",
        paddingBottom: "calc(16px + env(safe-area-inset-bottom))",
      }}>
        <div className="row" style={{ justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <div style={{ fontWeight: 800, fontSize: 17 }}>🧮 1RM & Yüzde Tablosu</div>
          <button className="icon-btn" onClick={onClose}>✕</button>
        </div>
        <p style={{ color: "var(--muted)", fontSize: 12, marginTop: -2, marginBottom: 10 }}>
          Kaldırdığın kilo ve tekrarı gir; tahmini 1 tekrar maksimumunu (1RM) ve antrenman yüzdelerini hesaplar (Epley formülü).
        </p>
        <div className="row" style={{ gap: 8, marginBottom: 12 }}>
          <input className="input" type="number" inputMode="decimal" placeholder="Kilo (kg)" value={w} onChange={(e) => setW(e.target.value)} />
          <input className="input" type="number" inputMode="numeric" placeholder="Tekrar" value={r} onChange={(e) => setR(e.target.value)} />
        </div>

        {orm > 0 ? (
          <>
            <div className="card" style={{ background: "var(--card2)", textAlign: "center", marginBottom: 12 }}>
              <div style={{ color: "var(--muted)", fontSize: 12 }}>Tahmini 1RM</div>
              <div style={{ fontWeight: 900, fontSize: 34, color: "var(--accent)" }}>{round05(orm)} kg</div>
            </div>
            <div className="card" style={{ padding: 0, overflow: "hidden" }}>
              {PCT.map((row, i) => (
                <div key={row.p} className="row" style={{ justifyContent: "space-between", alignItems: "center", padding: "9px 12px", borderTop: i ? "1px solid var(--line)" : "none" }}>
                  <span style={{ fontWeight: 700, width: 46 }}>%{row.p}</span>
                  <span style={{ fontWeight: 800, fontSize: 16 }}>{round05(orm * row.p / 100)} kg</span>
                  <span style={{ color: "var(--muted)", fontSize: 12, width: 70, textAlign: "right" }}>~{row.r} tekrar</span>
                </div>
              ))}
            </div>
            <p style={{ color: "var(--muted)", fontSize: 11, marginTop: 8 }}>
              İpucu: hipertrofi için %70-85 (8-12 tekrar), güç için %85-95 (2-6 tekrar) aralığı idealdir.
            </p>
          </>
        ) : (
          <p style={{ color: "var(--muted)", fontSize: 13 }}>Kilo ve tekrar gir, tablo burada oluşacak.</p>
        )}
      </div>
    </div>
  );
}
