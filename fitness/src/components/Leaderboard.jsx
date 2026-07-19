import React, { useEffect, useState } from "react";
import { lbGet, publicAvatarsGet, currentUid } from "../firebase";

const MEDALS = ["🥇", "🥈", "🥉"];

// 🏆 Fit Ligi — herkese açık liderlik tablosu.
// Puan: 🔥 seri ×15 + bu haftaki antrenman ×25 + toplam antrenman ×3 + tonaj/1000.
export default function Leaderboard() {
  const [rows, setRows] = useState(null);
  const [avatars, setAvatars] = useState({});
  const me = currentUid();

  async function load() {
    const [lb, av] = await Promise.all([lbGet(), publicAvatarsGet()]);
    setAvatars(av || {});
    const list = Object.keys(lb || {}).map((uid) => {
      const r = lb[uid] || {};
      const streak = Number(r.streak) || 0;
      const week = Number(r.week) || 0;
      const total = Number(r.total) || 0;
      const vol = Number(r.vol) || 0;
      return {
        uid, name: r.name || "sporcu", streak, week, total, vol,
        puan: streak * 15 + week * 25 + total * 3 + Math.round(vol / 1000),
      };
    });
    list.sort((a, b) => b.puan - a.puan || b.streak - a.streak || b.week - a.week);
    setRows(list);
  }
  useEffect(() => { load(); }, []);

  return (
    <div>
      <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ margin: 0 }}>🏆 Fit Ligi</h2>
        <button className="icon-btn" onClick={load}>🔄</button>
      </div>
      <p style={{ color: "var(--muted)", marginTop: 4, fontSize: 13 }}>
        Antrenman kaydettikçe yüksel! Puan = 🔥 seri ×15 + bu hafta ×25 + toplam ×3 + tonaj.
      </p>

      {rows === null ? (
        <p style={{ color: "var(--muted)" }}>Yükleniyor…</p>
      ) : rows.length === 0 ? (
        <p style={{ color: "var(--muted)", fontSize: 13 }}>
          Henüz kimse yok — ilk antrenmanını kaydet, ligin ilk sırasına yerleş! 💪
        </p>
      ) : (
        rows.map((r, i) => {
          const mine = r.uid === me;
          const av = avatars[r.uid];
          return (
            <div key={r.uid} className="card" style={{
              marginBottom: 8, padding: "10px 12px",
              borderColor: mine ? "var(--accent)" : (i < 3 ? "#fbbf24" : undefined),
            }}>
              <div className="row" style={{ alignItems: "center", gap: 10 }}>
                <div style={{ width: 28, textAlign: "center", fontWeight: 800, fontSize: i < 3 ? 20 : 14, color: "var(--muted)", flexShrink: 0 }}>
                  {MEDALS[i] || (i + 1) + "."}
                </div>
                <div style={{ width: 36, height: 36, borderRadius: 999, overflow: "hidden", background: "var(--card2)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: "var(--accent)", flexShrink: 0 }}>
                  {av
                    ? <img src={av} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : r.name.slice(0, 1).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {r.name}{mine && <span style={{ color: "var(--accent)", fontSize: 11 }}> (sen)</span>}
                  </div>
                  <div style={{ color: "var(--muted)", fontSize: 11 }}>
                    🔥 {r.streak} gün seri · bu hafta {r.week} · toplam {r.total}
                  </div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontWeight: 800, fontSize: 16, color: i < 3 ? "#fbbf24" : "var(--text)" }}>{r.puan}</div>
                  <div style={{ color: "var(--muted)", fontSize: 10 }}>puan</div>
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
