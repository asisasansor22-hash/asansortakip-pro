import React, { useState } from 'react'
import { S } from '../utils/constants.js'

const RENKLER = [
  "#3b82f6","#10b981","#f59e0b","#ef4444",
  "#8b5cf6","#06b6d4","#f97316","#84cc16",
  "#ec4899","#14b8a6"
];

function BakimciYonetimPaneli({ bakimcilar, setBakimcilar }) {
  const [form, setForm] = useState({ ad: "", tel: "", sifre: "", renk: "#3b82f6" });
  const [editId, setEditId] = useState(null);
  const [silOnay, setSilOnay] = useState(null);
  const [sifreGoster, setSifreGoster] = useState({});

  const F = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const kaydet = () => {
    if (!form.ad.trim()) return;
    if (editId) {
      setBakimcilar(p => p.map(b => b.id === editId ? { ...b, ...form, ad: form.ad.trim() } : b));
      setEditId(null);
    } else {
      setBakimcilar(p => [...p, {
        id: Date.now(),
        ad: form.ad.trim(),
        tel: form.tel.trim(),
        sifre: form.sifre,
        renk: form.renk,
        aktif: true
      }]);
    }
    setForm({ ad: "", tel: "", sifre: "", renk: "#3b82f6" });
  };

  const duzenle = (b) => {
    setForm({ ad: b.ad, tel: b.tel || "", sifre: b.sifre || "", renk: b.renk || "#3b82f6" });
    setEditId(b.id);
    setSilOnay(null);
  };

  const iptal = () => {
    setEditId(null);
    setForm({ ad: "", tel: "", sifre: "", renk: "#3b82f6" });
  };

  const sil = (id) => {
    setBakimcilar(p => p.filter(b => b.id !== id));
    setSilOnay(null);
  };

  const togSifreGoster = (id) =>
    setSifreGoster(p => ({ ...p, [id]: !p[id] }));

  return (
    React.createElement('div', { className: "ios-animate" },

      React.createElement('h2', { style: { fontSize: 18, fontWeight: 900, margin: 0, marginBottom: 16 } },
        "👥 Bakımcı Yönetimi"
      ),

      /* ── FORM ── */
      React.createElement('div', {
        style: {
          background: "var(--bg-panel)", borderRadius: 14,
          padding: 16, marginBottom: 16,
          border: "1px solid var(--border-soft)"
        }
      },
        React.createElement('div', {
          style: {
            fontSize: 12, fontWeight: 700, color: "var(--text-muted)",
            marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.5px"
          }
        }, editId ? "✏️ Bakımcı Düzenle" : "➕ Yeni Bakımcı Ekle"),

        React.createElement('input', {
          placeholder: "Ad Soyad *",
          value: form.ad,
          onChange: e => F("ad", e.target.value),
          style: { ...S.inp, marginBottom: 8 }
        }),
        React.createElement('input', {
          placeholder: "Telefon",
          value: form.tel,
          onChange: e => F("tel", e.target.value),
          style: { ...S.inp, marginBottom: 8 }
        }),
        React.createElement('input', {
          type: "text",
          placeholder: "Şifre (opsiyonel)",
          value: form.sifre,
          onChange: e => F("sifre", e.target.value),
          style: { ...S.inp, marginBottom: 12 }
        }),

        React.createElement('div', {
          style: { fontSize: 11, color: "var(--text-muted)", marginBottom: 8, fontWeight: 600 }
        }, "Renk Seçin"),
        React.createElement('div', { style: { display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 } },
          RENKLER.map(r =>
            React.createElement('button', {
              key: r,
              onClick: () => F("renk", r),
              style: {
                width: 30, height: 30, borderRadius: "50%", background: r,
                border: form.renk === r ? "3px solid #fff" : "3px solid transparent",
                cursor: "pointer", flexShrink: 0,
                boxShadow: form.renk === r ? ("0 0 0 2px " + r) : "none",
                transition: "box-shadow 0.15s"
              }
            })
          )
        ),

        React.createElement('div', { style: { display: "flex", gap: 8 } },
          editId && React.createElement('button', {
            onClick: iptal,
            style: {
              flex: 1, padding: "12px", background: "var(--bg-elevated)",
              border: "none", borderRadius: 12, color: "var(--text-muted)",
              cursor: "pointer", fontWeight: 600, fontSize: 14
            }
          }, "İptal"),
          React.createElement('button', {
            onClick: kaydet,
            style: {
              flex: 1, padding: "12px", background: "var(--accent)",
              border: "none", borderRadius: 12, color: "#fff",
              cursor: "pointer", fontWeight: 700, fontSize: 15
            }
          }, editId ? "💾 Güncelle" : "✅ Ekle")
        )
      ),

      /* ── LİSTE ── */
      bakimcilar.length === 0
        ? React.createElement('div', {
          style: {
            textAlign: "center", padding: "40px 20px",
            color: "var(--text-dim)", background: "var(--bg-panel)",
            borderRadius: 14, border: "1px solid var(--border-soft)"
          }
        },
          React.createElement('div', { style: { fontSize: 44, marginBottom: 12 } }, "👷"),
          React.createElement('div', { style: { fontSize: 16, fontWeight: 700 } }, "Henüz bakımcı eklenmedi"),
          React.createElement('div', { style: { fontSize: 13, marginTop: 6, color: "var(--text-dim)" } },
            "Yukarıdaki formdan yeni bakımcı ekleyebilirsiniz"
          )
        )
        : bakimcilar.map(b =>
          React.createElement('div', {
            key: b.id,
            style: {
              background: "var(--bg-panel)", borderRadius: 14,
              padding: "14px 16px", marginBottom: 10,
              border: "1px solid var(--border-soft)",
              borderLeft: "4px solid " + (b.renk || "#3b82f6")
            }
          },
            React.createElement('div', { style: { display: "flex", alignItems: "center", gap: 12 } },
              /* Avatar */
              React.createElement('div', {
                style: {
                  width: 44, height: 44, borderRadius: "50%",
                  background: b.renk || "#3b82f6",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 20, fontWeight: 900, color: "#fff", flexShrink: 0,
                  boxShadow: "0 2px 8px " + (b.renk || "#3b82f6") + "55"
                }
              }, (b.ad || "?")[0].toUpperCase()),

              /* Bilgi */
              React.createElement('div', { style: { flex: 1, minWidth: 0 } },
                React.createElement('div', {
                  style: { fontWeight: 700, fontSize: 15, color: "var(--text)" }
                }, b.ad),
                React.createElement('div', {
                  style: { fontSize: 12, color: "var(--text-muted)", marginTop: 3, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }
                },
                  b.tel && React.createElement('span', null, "📞 " + b.tel),
                  React.createElement('span', null,
                    b.sifre
                      ? (sifreGoster[b.id] ? ("🔓 " + b.sifre) : "🔒 Şifreli")
                      : "🔓 Şifresiz"
                  ),
                  b.sifre && React.createElement('button', {
                    onClick: () => togSifreGoster(b.id),
                    style: {
                      background: "none", border: "none", color: "var(--accent)",
                      cursor: "pointer", fontSize: 11, padding: 0, fontWeight: 600
                    }
                  }, sifreGoster[b.id] ? "Gizle" : "Göster")
                )
              ),

              /* Butonlar */
              React.createElement('div', { style: { display: "flex", gap: 6, flexShrink: 0, alignItems: "center" } },
                React.createElement('button', {
                  onClick: () => duzenle(b),
                  style: {
                    padding: "7px 12px", borderRadius: 8,
                    background: "var(--bg-elevated)", border: "none",
                    color: "var(--accent)", cursor: "pointer", fontWeight: 600, fontSize: 12
                  }
                }, "✏️"),

                silOnay === b.id
                  ? React.createElement('div', { style: { display: "flex", gap: 4, alignItems: "center" } },
                    React.createElement('span', { style: { fontSize: 11, color: "var(--ios-red)" } }, "Emin misin?"),
                    React.createElement('button', {
                      onClick: () => sil(b.id),
                      style: {
                        padding: "6px 10px", borderRadius: 8,
                        background: "var(--ios-red)", border: "none",
                        color: "#fff", cursor: "pointer", fontWeight: 700, fontSize: 12
                      }
                    }, "Evet"),
                    React.createElement('button', {
                      onClick: () => setSilOnay(null),
                      style: {
                        padding: "6px 10px", borderRadius: 8,
                        background: "var(--bg-elevated)", border: "none",
                        color: "var(--text-muted)", cursor: "pointer", fontWeight: 600, fontSize: 12
                      }
                    }, "Hayır")
                  )
                  : React.createElement('button', {
                    onClick: () => setSilOnay(b.id),
                    style: {
                      padding: "7px 12px", borderRadius: 8,
                      background: "rgba(255,59,48,0.1)", border: "none",
                      color: "var(--ios-red)", cursor: "pointer", fontWeight: 600, fontSize: 12
                    }
                  }, "🗑️")
              )
            )
          )
        )
    )
  );
}

export default BakimciYonetimPaneli
