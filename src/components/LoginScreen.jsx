import React, { useState } from 'react'
import { S } from '../utils/constants.js'
import { ASIS_LOGO_B64 } from '../utils/makbuz.js'
import { firebaseLogin, getTenantId, makeBakimciEmail } from '../firebase.js'

function fbHata(e) {
  if (!e) return "Giriş başarısız";
  var msg = typeof e === "string" ? e : (e.message || "");
  if (msg.indexOf("wrong-password") >= 0 || msg.indexOf("invalid-credential") >= 0) return "Şifre hatalı!";
  if (msg.indexOf("user-not-found") >= 0) return "Kullanıcı bulunamadı";
  if (msg.indexOf("too-many-requests") >= 0) return "Çok fazla hatalı giriş. Lütfen bekleyin.";
  return "Giriş hatası";
}

function LoginScreen({ onLogin, bakimcilar, tenantPublic, onFarkliFirma }) {
  const tenantId = getTenantId() || "asis";
  const isAsis = tenantId === "asis";
  const [sifre, setSifre] = useState("");
  const [hata, setHata] = useState("");
  const [sifreAcik, setSifreAcik] = useState(false);
  const [yukleniyor, setYukleniyor] = useState(false);

  const [bakimciSec, setBakimciSec] = useState(null);
  const [bakimciSifre, setBakimciSifre] = useState("");
  const [bakimciHata, setBakimciHata] = useState("");
  const [listAcik, setListAcik] = useState(false);

  // tenantPublic: { ad, adminEmail } veya null (pre-login yüklemesinden gelir)
  // tenantConfig (eski ad) yerine tenantPublic kullanılır — hassas alan içermez.
  const adminEmail = (tenantPublic && tenantPublic.adminEmail) || null;

  function makeYoneticiEmail() {
    if (isAsis) return "yonetici@asistakip.app";
    return adminEmail || ("yonetici_" + tenantId + "@asistakip.app");
  }

  const yoneticiGiris = async () => {
    // Diğer firmalar: adminEmail yüklenmediyse bekle
    if (!isAsis && !adminEmail) {
      setHata("Firma bilgileri henüz yüklenmedi, 1-2 saniye sonra tekrar deneyin.");
      return;
    }
    setYukleniyor(true);
    setHata("");
    // Şifreyi doğrudan Firebase Auth'a gönder — yerel karşılaştırma yapılmaz
    var res = await firebaseLogin(makeYoneticiEmail(), sifre, { noCreate: true });
    setYukleniyor(false);
    if (res.success) {
      onLogin("yonetici");
    } else {
      setHata(fbHata(res.error));
      setSifre("");
    }
  };

  const bakimciSec_ = async (b) => {
    setBakimciSec(b);
    setBakimciSifre("");
    setBakimciHata("");
    if (!b.hasSifre) {
      setYukleniyor(true);
      var email = makeBakimciEmail(tenantId, b.ad);
      var pw = "bakimci_" + (b.id || "nosifre");
      var res = await firebaseLogin(email, pw);
      setYukleniyor(false);
      if (res.success) {
        onLogin("bakimci", b);
      } else {
        setBakimciHata(fbHata(res.error));
        setBakimciSec(null);
      }
    }
  };

  const bakimciGiris = async () => {
    if (!bakimciSec) return;
    setYukleniyor(true);
    setBakimciHata("");
    var email = makeBakimciEmail(tenantId, bakimciSec.ad);
    var res = await firebaseLogin(email, bakimciSifre);
    setYukleniyor(false);
    if (res.success) {
      onLogin("bakimci", bakimciSec);
    } else {
      setBakimciHata(fbHata(res.error));
      setBakimciSifre("");
    }
  };

  const hasBakimcilar = bakimcilar && bakimcilar.length > 0;

  return (
    React.createElement('div', { className: "login-wrap ios-fade" },
      React.createElement('div', { style: { width: "100%", maxWidth: 380 } },

        React.createElement('div', { style: { textAlign: "center", marginBottom: 44 } },
          React.createElement('img', { src: ASIS_LOGO_B64, alt: "Asis", className: "asis-logo-img", style: { height: "70px", objectFit: "contain", marginBottom: "8px" } }),
          React.createElement('div', { style: { fontWeight: 800, fontSize: 30, color: "var(--text)", marginBottom: 6, letterSpacing: -1 } }, "AsansörTakip"),
          React.createElement('div', { style: { fontSize: 14, color: "var(--text-muted)" } }, "Pro"),
          tenantPublic && tenantPublic.ad && React.createElement('div', {
            style: { marginTop: 14, fontSize: 13, fontWeight: 700, color: "var(--accent)", padding: "6px 14px", background: "rgba(0,122,255,0.10)", borderRadius: 10, display: "inline-block" }
          }, tenantPublic.ad)
        ),

        yukleniyor
          ? React.createElement('div', { style: { textAlign: "center", padding: 40 } },
              React.createElement('div', { style: { fontSize: 28, marginBottom: 12 } }, "⏳"),
              React.createElement('div', { style: { fontSize: 14, color: "var(--text-muted)" } }, "Giriş yapılıyor...")
            )
          : React.createElement('div', { style: { display: "flex", flexDirection: "column", gap: 10 } },

          /* -- BAKIMCI BÖLÜMÜ -- */
          hasBakimcilar
            ? React.createElement('div', { style: { background: "var(--bg-panel)", border: "0.5px solid var(--border)", borderRadius: 20, overflow: "hidden", boxShadow: "var(--shadow-sm)" } },

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

              listAcik && React.createElement('div', { style: { borderTop: "0.5px solid var(--border-soft)", padding: "8px 12px 12px" } },

                bakimciSec && bakimciSec.hasSifre
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
                          React.createElement('div', { style: { fontSize: 12, color: "var(--text-muted)" } }, b.hasSifre ? "🔒 Şifre gerekli" : "🔓 Şifresiz giriş")
                        ),
                        React.createElement('div', { style: { color: "var(--text-dim)", fontSize: 16 } }, "›")
                      )
                    )
                  )
              )
            )

            : React.createElement('button', {
              onClick: async () => {
                setYukleniyor(true);
                var email = makeBakimciEmail(tenantId, "genel");
                var res = await firebaseLogin(email, "bakimci_genel_" + tenantId);
                setYukleniyor(false);
                if (res.success) onLogin("bakimci", null);
              },
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

          /* -- YÖNETİCİ KARTI -- */
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
          ),

          /* -- FARKLI FİRMA -- */
          onFarkliFirma && React.createElement('button', {
            onClick: onFarkliFirma,
            style: { marginTop: 16, padding: "8px 12px", background: "transparent", border: "none", color: "var(--text-muted)", fontSize: 12, cursor: "pointer", textDecoration: "underline" }
          }, "Farklı firma kodu gir")
        )
      )
    )
  );
}

export default LoginScreen
