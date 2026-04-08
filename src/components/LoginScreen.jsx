import React, { useState } from 'react'
import { S } from '../utils/constants.js'
import { ASIS_LOGO_B64 } from '../utils/makbuz.js'

function LoginScreen({ onLogin, bakimcilar }) {
  const [sifre, setSifre] = useState("");
  const [hata, setHata] = useState("");
  const [sifreAcik, setSifreAcik] = useState(false);

  // Bireysel bakımcı login
  const [bakimciSec, setBakimciSec] = useState(null);   // seçili bakımcı obj
  const [bakimciSifre, setBakimciSifre] = useState("");
  const [bakimciHata, setBakimciHata] = useState("");
  const [listAcik, setListAcik] = useState(false);

  const yoneticiGiris = () => {
    if (sifre === "asis94") { onLogin("yonetici"); }
    else { setHata("Şifre hatalı!"); setSifre(""); }
  };

  const bakimciSec_ = (b) => {
    setBakimciSec(b);
    setBakimciSifre("");
    setBakimciHata("");
    // Şifresi yoksa direkt giriş
    if (!b.sifre) { onLogin("bakimci", b); }
  };

  const bakimciGiris = () => {
    if (!bakimciSec) return;
    if (bakimciSifre === bakimciSec.sifre) {
      onLogin("bakimci", bakimciSec);
    } else {
      setBakimciHata("Şifre hatalı!");
      setBakimciSifre("");
    }
  };

  const hasBakimcilar = bakimcilar && bakimcilar.length > 0;

  return (
    React.createElement('div', { className: "login-wrap ios-fade" },
      React.createElement('div', { style: { width: "100%", maxWidth: 380 } },

        /* Logo & Başlık */
        React.createElement('div', { style: { textAlign: "center", marginBottom: 44 } },
          React.createElement('img', { src: ASIS_LOGO_B64, alt: "Asis", className: "asis-logo-img", style: { height: "70px", objectFit: "contain", marginBottom: "8px" } }),
          React.createElement('div', { style: { fontWeight: 800, fontSize: 30, color: "var(--text)", marginBottom: 6, letterSpacing: -1 } }, "AsansörTakip"),
          React.createElement('div', { style: { fontSize: 14, color: "var(--text-muted)" } }, "Pro")
        ),

        React.createElement('div', { style: { display: "flex", flexDirection: "column", gap: 10 } },

          /* ── BAKIMCI BÖLÜMÜ ── */
          hasBakimcilar
            /* Kayıtlı bakımcılar varsa → liste göster */
            ? React.createElement('div', { style: { background: "var(--bg-panel)", border: "0.5px solid var(--border)", borderRadius: 20, overflow: "hidden", boxShadow: "var(--shadow-sm)" } },

              /* Başlık satırı */
              React.createElement('button', {
                onClick: () => { setListAcik(p => !p); setBakimciSec(null); setBakimciHata(""); setBakimciSifre(""); },
                style: { width: "100%", padding: "18px 20px", background: "none", border: "none", cursor: "pointer", textAlign: "left" }
              },
                React.createElement('div', { style: { display: "flex", alignItems: "center", gap: 14 } },
                  React.createElement('div', { style: { background: "rgba(52,199,89,0.15)", borderRadius: 14, width: 52, height: 52, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, flexShrink: 0 } }, "🔧"),
                  React.createElement('div', { style: { flex: 1 } },
                    React.createElement('div', { style: { fontWeight: 700, fontSize: 17, color: "var(--text)", marginBottom: 2 } }, "Bakımcı Girişi"),
                    React.createElement('div', { style: { fontSize: 13, color: "var(--text-muted)" } }, bakimcilar.length + " bakımcı kayıtlı")
                  ),
                  React.createElement('div', { style: { color: "var(--text-dim)", fontSize: 18 } }, listAcik ? "⌃" : "›")
                )
              ),

              /* Bakımcı Listesi */
              listAcik && React.createElement('div', { style: { borderTop: "0.5px solid var(--border-soft)", padding: "8px 12px 12px" } },

                /* Eğer bakımcı seçildiyse şifre alanı göster */
                bakimciSec && bakimciSec.sifre
                  ? React.createElement('div', { style: { padding: "8px 4px" } },
                    React.createElement('div', { style: { display: "flex", alignItems: "center", gap: 10, marginBottom: 12 } },
                      React.createElement('div', {
                        style: {
                          width: 36, height: 36, borderRadius: "50%",
                          background: bakimciSec.renk || "#3b82f6",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 16, fontWeight: 900, color: "#fff", flexShrink: 0
                        }
                      }, (bakimciSec.ad || "?")[0].toUpperCase()),
                      React.createElement('div', { style: { flex: 1 } },
                        React.createElement('div', { style: { fontWeight: 700, fontSize: 15, color: "var(--text)" } }, bakimciSec.ad),
                        React.createElement('div', { style: { fontSize: 12, color: "var(--text-muted)" } }, "Şifrenizi girin")
                      ),
                      React.createElement('button', {
                        onClick: () => { setBakimciSec(null); setBakimciHata(""); },
                        style: { background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: 18, padding: 4 }
                      }, "←")
                    ),
                    React.createElement('div', { style: { display: "flex", gap: 8 } },
                      React.createElement('input', {
                        type: "password", value: bakimciSifre,
                        onChange: e => { setBakimciSifre(e.target.value); setBakimciHata(""); },
                        onKeyDown: e => e.key === "Enter" && bakimciGiris(),
                        placeholder: "Şifre", autoFocus: true,
                        style: { ...S.inp, border: bakimciHata ? "1px solid var(--ios-red)" : "none", fontSize: 16 }
                      }),
                      React.createElement('button', {
                        onClick: bakimciGiris,
                        style: { padding: "12px 18px", background: "var(--ios-green)", border: "none", borderRadius: 12, color: "#fff", fontWeight: 700, fontSize: 15, cursor: "pointer", whiteSpace: "nowrap", minHeight: 44 }
                      }, "Giriş")
                    ),
                    bakimciHata && React.createElement('div', {
                      style: { marginTop: 10, fontSize: 13, color: "var(--ios-red)", padding: "8px 12px", background: "rgba(255,59,48,0.1)", borderRadius: 10 }
                    }, "🚫 " + bakimciHata)
                  )

                  /* Bakımcı seçim listesi */
                  : React.createElement('div', null,
                    bakimcilar.map(b =>
                      React.createElement('button', {
                        key: b.id,
                        onClick: () => bakimciSec_(b),
                        style: {
                          width: "100%", display: "flex", alignItems: "center", gap: 12,
                          padding: "10px 8px", background: "none", border: "none",
                          borderRadius: 10, cursor: "pointer", textAlign: "left",
                          marginBottom: 4, transition: "background 0.1s"
                        }
                      },
                        React.createElement('div', {
                          style: {
                            width: 36, height: 36, borderRadius: "50%",
                            background: b.renk || "#3b82f6",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: 16, fontWeight: 900, color: "#fff", flexShrink: 0,
                            boxShadow: "0 2px 6px " + (b.renk || "#3b82f6") + "55"
                          }
                        }, (b.ad || "?")[0].toUpperCase()),
                        React.createElement('div', { style: { flex: 1 } },
                          React.createElement('div', { style: { fontWeight: 700, fontSize: 14, color: "var(--text)" } }, b.ad),
                          React.createElement('div', { style: { fontSize: 12, color: "var(--text-muted)" } }, b.sifre ? "🔒 Şifre gerekli" : "🔓 Şifresiz giriş")
                        ),
                        React.createElement('div', { style: { color: "var(--text-dim)", fontSize: 16 } }, "›")
                      )
                    )
                  )
              )
            )

            /* Bakımcı listesi boşsa → eski tek buton */
            : React.createElement('button', {
              onClick: () => onLogin("bakimci", null),
              style: { padding: "18px 20px", background: "var(--bg-panel)", border: "0.5px solid var(--border)", borderRadius: 20, cursor: "pointer", textAlign: "left", transition: "transform 0.15s, box-shadow 0.15s", boxShadow: "var(--shadow-sm)" }
            },
              React.createElement('div', { style: { display: "flex", alignItems: "center", gap: 14 } },
                React.createElement('div', { style: { background: "rgba(52,199,89,0.15)", borderRadius: 14, width: 52, height: 52, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, flexShrink: 0 } }, "🔧"),
                React.createElement('div', { style: { flex: 1 } },
                  React.createElement('div', { style: { fontWeight: 700, fontSize: 17, color: "var(--text)", marginBottom: 2 } }, "Bakımcı Girişi"),
                  React.createElement('div', { style: { fontSize: 13, color: "var(--text-muted)" } }, "Atanan bakım ve arızaları gör")
                ),
                React.createElement('div', { style: { color: "var(--text-dim)", fontSize: 18 } }, "›")
              )
            ),

          /* ── YÖNETİCİ KARTI ── */
          React.createElement('div', { className: "login-card" },
            React.createElement('button', {
              onClick: () => { setSifreAcik(!sifreAcik); setHata(""); setSifre(""); },
              style: { width: "100%", padding: "18px 20px", background: "none", border: "none", cursor: "pointer", textAlign: "left" }
            },
              React.createElement('div', { style: { display: "flex", alignItems: "center", gap: 14 } },
                React.createElement('div', { style: { background: "rgba(0,122,255,0.15)", borderRadius: 14, width: 52, height: 52, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, flexShrink: 0 } }, "👔"),
                React.createElement('div', { style: { flex: 1 } },
                  React.createElement('div', { style: { fontWeight: 700, fontSize: 17, color: "var(--text)", marginBottom: 2 } }, "Yönetici Girişi"),
                  React.createElement('div', { style: { fontSize: 13, color: "var(--text-muted)" } }, "Tam yönetim · Şifre gerekli")
                ),
                React.createElement('div', { style: { color: "var(--text-dim)", fontSize: 18 } }, sifreAcik ? "⌃" : "🔒")
              )
            ),
            sifreAcik && (
              React.createElement('div', { style: { padding: "0 20px 20px", borderTop: "0.5px solid var(--border-soft)" } },
                React.createElement('div', { style: { paddingTop: 14, display: "flex", gap: 8 } },
                  React.createElement('input', {
                    type: "password", value: sifre,
                    onChange: e => { setSifre(e.target.value); setHata(""); },
                    onKeyDown: e => e.key === "Enter" && yoneticiGiris(),
                    placeholder: "Şifre", autoFocus: true,
                    style: { ...S.inp, border: hata ? "1px solid var(--ios-red)" : "none", fontSize: 16 }
                  }),
                  React.createElement('button', {
                    onClick: yoneticiGiris,
                    style: { padding: "12px 18px", background: "var(--accent)", border: "none", borderRadius: 12, color: "#fff", fontWeight: 700, fontSize: 15, cursor: "pointer", whiteSpace: "nowrap", minHeight: 44 }
                  }, "Giriş")
                ),
                hata && React.createElement('div', {
                  style: { marginTop: 10, fontSize: 13, color: "var(--ios-red)", padding: "8px 12px", background: "rgba(255,59,48,0.1)", borderRadius: 10 }
                }, "🚫 " + hata)
              )
            )
          )
        )
      )
    )
  );
}

export default LoginScreen
