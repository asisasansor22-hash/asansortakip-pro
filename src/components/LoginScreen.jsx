import React, { useState, useEffect } from 'react'
import { S } from '../utils/constants.js'
import { ASIS_LOGO_B64 } from '../utils/makbuz.js'
import { firebaseLogin, dbGetPublic } from '../firebase.js'
import { hashPassword, verifyPassword, isHashed } from '../utils/auth.js'

function LoginScreen({ onLogin, bakimcilar, firmaKayitAc, kayitliFirma }) {
  // Firma seçim state'leri
  const [firmaAdim, setFirmaAdim] = useState(kayitliFirma ? "login" : "firma"); // "firma" | "login"
  const [firmaKodu, setFirmaKodu] = useState(kayitliFirma || "");
  const [firmaHata, setFirmaHata] = useState("");
  const [firmaBilgi, setFirmaBilgi] = useState(null); // { ad, logo, ... }
  const [firmaYukleniyor, setFirmaYukleniyor] = useState(false);

  // Login state'leri (mevcut)
  const [sifre, setSifre] = useState("");
  const [hata, setHata] = useState("");
  const [sifreAcik, setSifreAcik] = useState(false);
  const [yukleniyor, setYukleniyor] = useState(false);

  // Bakımcı login
  const [bakimciSec, setBakimciSec] = useState(null);
  const [bakimciSifre, setBakimciSifre] = useState("");
  const [bakimciHata, setBakimciHata] = useState("");
  const [listAcik, setListAcik] = useState(false);

  // Kayıtlı firma varsa bilgisini yükle
  useEffect(function(){
    if(kayitliFirma && !firmaBilgi){
      firmaDogrula(kayitliFirma, true);
    }
  },[kayitliFirma]);

  // E-posta oluştur (firma kodu bazlı)
  function makeEmail(rol, bakimci) {
    var kod = firmaKodu || "default";
    if (rol === "yonetici") return "yonetici_" + kod + "@asansortakip.app";
    if (bakimci && bakimci.ad) {
      var safe = bakimci.ad.toLowerCase()
        .replace(/ş/g,"s").replace(/ç/g,"c").replace(/ğ/g,"g")
        .replace(/ı/g,"i").replace(/ö/g,"o").replace(/ü/g,"u")
        .replace(/[^a-z0-9]/g,"");
      return "bakimci_" + safe + "_" + kod + "@asansortakip.app";
    }
    return "bakimci_" + kod + "@asansortakip.app";
  }

  // Firma kodu doğrulama
  async function firmaDogrula(kod, sessiz) {
    if(!kod || !kod.trim()){ if(!sessiz) setFirmaHata("Firma kodu girin"); return; }
    var slug = kod.trim().toLowerCase();
    if(!sessiz) setFirmaYukleniyor(true);
    setFirmaHata("");
    try {
      var bilgi = await dbGetPublic("sirketler/" + slug + "/bilgi");
      if(bilgi && bilgi.ad) {
        setFirmaBilgi(bilgi);
        setFirmaKodu(slug);
        setFirmaAdim("login");
        // Firma bilgisini üst bileşene bildir
        onLogin("firma_secildi", null, slug, bilgi);
      } else {
        if(!sessiz) setFirmaHata("Bu firma kodu bulunamadı");
      }
    } catch(e) {
      if(!sessiz) setFirmaHata("Bağlantı hatası");
    }
    if(!sessiz) setFirmaYukleniyor(false);
  }

  // Yönetici giriş — şifre Firebase'den doğrulanır
  const yoneticiGiris = async () => {
    if(!sifre.trim()){ setHata("Şifre girin"); return; }
    setYukleniyor(true);
    setHata("");
    try {
      // Firebase'den yönetici hash'ini çek
      var slug = firmaKodu || kayitliFirma;
      var hash = await dbGetPublic("sirketler/" + slug + "/yonetici_sifre");
      if(!hash) {
        // Eski sistem: hardcoded fallback (migration süreci)
        setHata("Firma yapılandırması eksik");
        setYukleniyor(false);
        return;
      }
      // Şifreyi doğrula
      var gecerli = false;
      if(isHashed(hash)){
        gecerli = await verifyPassword(sifre, hash);
      } else {
        // Migration: henüz hash'lenmemiş eski şifre
        gecerli = (sifre === hash);
      }
      if(!gecerli){
        setHata("Şifre hatalı!");
        setSifre("");
        setYukleniyor(false);
        return;
      }
      // Firebase Auth ile giriş
      var res = await firebaseLogin(makeEmail("yonetici"), sifre);
      if(res.success){
        onLogin("yonetici", null, slug, firmaBilgi);
      } else {
        setHata("Giriş hatası: " + res.error);
      }
    } catch(e){
      setHata("Bağlantı hatası");
    }
    setYukleniyor(false);
  };

  // Bakımcı seçim
  const bakimciSec_ = async (b) => {
    setBakimciSec(b);
    setBakimciSifre("");
    setBakimciHata("");
    // Şifresi yoksa direkt giriş
    if (!b.sifre) {
      setYukleniyor(true);
      var pw = "bakimci_" + (b.id || "nosifre");
      var res = await firebaseLogin(makeEmail("bakimci", b), pw);
      setYukleniyor(false);
      if (res.success) {
        onLogin("bakimci", b, firmaKodu || kayitliFirma, firmaBilgi);
      } else {
        setBakimciHata("Giriş hatası");
      }
    }
  };

  // Bakımcı şifre giriş
  const bakimciGiris = async () => {
    if (!bakimciSec) return;
    setYukleniyor(true);
    setBakimciHata("");
    try {
      var gecerli = false;
      if(isHashed(bakimciSec.sifre)){
        gecerli = await verifyPassword(bakimciSifre, bakimciSec.sifre);
      } else {
        gecerli = (bakimciSifre === bakimciSec.sifre);
      }
      if(!gecerli){
        setBakimciHata("Şifre hatalı!");
        setBakimciSifre("");
        setYukleniyor(false);
        return;
      }
      var res = await firebaseLogin(makeEmail("bakimci", bakimciSec), bakimciSifre);
      if (res.success) {
        onLogin("bakimci", bakimciSec, firmaKodu || kayitliFirma, firmaBilgi);
      } else {
        setBakimciHata("Giriş hatası: " + res.error);
      }
    } catch(e){
      setBakimciHata("Bağlantı hatası");
    }
    setYukleniyor(false);
  };

  const hasBakimcilar = bakimcilar && bakimcilar.length > 0;
  var logo = (firmaBilgi && firmaBilgi.logo) || ASIS_LOGO_B64;
  var firmaAd = (firmaBilgi && firmaBilgi.ad) || "AsansörTakip";

  // ═══════════════════════════════════════════
  // ADIM 1: FİRMA KODU GİRİŞİ
  // ═══════════════════════════════════════════
  if(firmaAdim === "firma") {
    return (
      React.createElement('div', { className: "login-wrap ios-fade" },
        React.createElement('div', { style: { width: "100%", maxWidth: 380 } },

          /* Logo & Başlık */
          React.createElement('div', { style: { textAlign: "center", marginBottom: 44 } },
            React.createElement('div', { style: { fontSize: 48, marginBottom: 12 } }, "\uD83C\uDFE2"),
            React.createElement('div', { style: { fontWeight: 800, fontSize: 26, color: "var(--text)", marginBottom: 6, letterSpacing: -1 } }, "AsansörTakip Pro"),
            React.createElement('div', { style: { fontSize: 14, color: "var(--text-muted)" } }, "Firma kodunuzu girerek başlayın")
          ),

          firmaYukleniyor
            ? React.createElement('div', { style: { textAlign: "center", padding: 40 } },
                React.createElement('div', { style: { fontSize: 28, marginBottom: 12 } }, "\u23F3"),
                React.createElement('div', { style: { fontSize: 14, color: "var(--text-muted)" } }, "Firma doğrulanıyor...")
              )
            : React.createElement('div', { style: { display: "flex", flexDirection: "column", gap: 14 } },

              /* Firma kodu input */
              React.createElement('div', { className: "login-card", style: { padding: 20 } },
                React.createElement('div', { style: { fontSize: 13, color: "var(--text-muted)", marginBottom: 8, fontWeight: 600 } }, "Firma Kodu"),
                React.createElement('input', {
                  type: "text", value: firmaKodu,
                  onChange: function(e){ setFirmaKodu(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g,"")); setFirmaHata(""); },
                  onKeyDown: function(e){ if(e.key==="Enter") firmaDogrula(firmaKodu); },
                  placeholder: "ornek: asis-asansor", autoFocus: true,
                  style: { ...S.inp, fontSize: 18, textAlign: "center", letterSpacing: 1, fontWeight: 700 }
                }),
                firmaHata && React.createElement('div', {
                  style: { marginTop: 10, fontSize: 13, color: "var(--ios-red)", padding: "8px 12px", background: "rgba(255,59,48,0.1)", borderRadius: 10 }
                }, "\uD83D\uDEAB " + firmaHata),
                React.createElement('button', {
                  onClick: function(){ firmaDogrula(firmaKodu); },
                  style: { width: "100%", marginTop: 14, padding: "14px", background: "var(--accent)", border: "none", borderRadius: 14, color: "#fff", fontWeight: 700, fontSize: 16, cursor: "pointer" }
                }, "Giriş Yap")
              ),

              /* Yeni firma kayıt butonu */
              React.createElement('button', {
                onClick: firmaKayitAc,
                style: { padding: "14px", background: "none", border: "1px dashed var(--border)", borderRadius: 14, color: "var(--text-muted)", fontSize: 14, cursor: "pointer", textAlign: "center" }
              }, "\u2795 Yeni Firma Kaydı")
            )
        )
      )
    );
  }

  // ═══════════════════════════════════════════
  // ADIM 2: ROL SEÇİMİ + ŞİFRE (mevcut ekran)
  // ═══════════════════════════════════════════
  return (
    React.createElement('div', { className: "login-wrap ios-fade" },
      React.createElement('div', { style: { width: "100%", maxWidth: 380 } },

        /* Logo & Başlık */
        React.createElement('div', { style: { textAlign: "center", marginBottom: 44 } },
          typeof logo === "string" && logo.startsWith("data:")
            ? React.createElement('img', { src: logo, alt: firmaAd, className: "asis-logo-img", style: { height: "70px", objectFit: "contain", marginBottom: "8px" } })
            : React.createElement('div', { style: { fontSize: 48, marginBottom: 8 } }, "\uD83C\uDFE2"),
          React.createElement('div', { style: { fontWeight: 800, fontSize: 26, color: "var(--text)", marginBottom: 6, letterSpacing: -1 } }, firmaAd),
          React.createElement('div', { style: { fontSize: 13, color: "var(--text-muted)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 },
            onClick: function(){ setFirmaAdim("firma"); setFirmaBilgi(null); }
          },
            React.createElement('span', null, "\uD83C\uDFE2 " + (firmaKodu || kayitliFirma)),
            React.createElement('span', { style: { fontSize: 11, opacity: 0.7 } }, "(de\u011fi\u015ftir)")
          )
        ),

        yukleniyor
          ? React.createElement('div', { style: { textAlign: "center", padding: 40 } },
              React.createElement('div', { style: { fontSize: 28, marginBottom: 12 } }, "\u23F3"),
              React.createElement('div', { style: { fontSize: 14, color: "var(--text-muted)" } }, "Giriş yapılıyor...")
            )
          : React.createElement('div', { style: { display: "flex", flexDirection: "column", gap: 10 } },

          /* -- BAKIMCI BOLUMU -- */
          hasBakimcilar
            ? React.createElement('div', { style: { background: "var(--bg-panel)", border: "0.5px solid var(--border)", borderRadius: 20, overflow: "hidden", boxShadow: "var(--shadow-sm)" } },

              React.createElement('button', {
                onClick: () => { setListAcik(p => !p); setBakimciSec(null); setBakimciHata(""); setBakimciSifre(""); },
                style: { width: "100%", padding: "18px 20px", background: "none", border: "none", cursor: "pointer", textAlign: "left" }
              },
                React.createElement('div', { style: { display: "flex", alignItems: "center", gap: 14 } },
                  React.createElement('div', { style: { background: "rgba(52,199,89,0.15)", borderRadius: 14, width: 52, height: 52, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, flexShrink: 0 } }, "\uD83D\uDD27"),
                  React.createElement('div', { style: { flex: 1 } },
                    React.createElement('div', { style: { fontWeight: 700, fontSize: 17, color: "var(--text)", marginBottom: 2 } }, "Bakımcı Girişi"),
                    React.createElement('div', { style: { fontSize: 13, color: "var(--text-muted)" } }, bakimcilar.length + " bakımcı kayıtlı")
                  ),
                  React.createElement('div', { style: { color: "var(--text-dim)", fontSize: 18 } }, listAcik ? "\u2303" : "\u203A")
                )
              ),

              listAcik && React.createElement('div', { style: { borderTop: "0.5px solid var(--border-soft)", padding: "8px 12px 12px" } },

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
                      }, "\u2190")
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
                    }, "\uD83D\uDEAB " + bakimciHata)
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
                          React.createElement('div', { style: { fontSize: 12, color: "var(--text-muted)" } }, b.sifre ? "\uD83D\uDD12 Şifre gerekli" : "\uD83D\uDD13 Şifresiz giriş")
                        ),
                        React.createElement('div', { style: { color: "var(--text-dim)", fontSize: 16 } }, "\u203A")
                      )
                    )
                  )
              )
            )

            : React.createElement('button', {
              onClick: async () => {
                setYukleniyor(true);
                var res = await firebaseLogin(makeEmail("bakimci"), "bakimci_genel");
                setYukleniyor(false);
                if (res.success) onLogin("bakimci", null, firmaKodu || kayitliFirma, firmaBilgi);
              },
              style: { padding: "18px 20px", background: "var(--bg-panel)", border: "0.5px solid var(--border)", borderRadius: 20, cursor: "pointer", textAlign: "left", transition: "transform 0.15s, box-shadow 0.15s", boxShadow: "var(--shadow-sm)" }
            },
              React.createElement('div', { style: { display: "flex", alignItems: "center", gap: 14 } },
                React.createElement('div', { style: { background: "rgba(52,199,89,0.15)", borderRadius: 14, width: 52, height: 52, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, flexShrink: 0 } }, "\uD83D\uDD27"),
                React.createElement('div', { style: { flex: 1 } },
                  React.createElement('div', { style: { fontWeight: 700, fontSize: 17, color: "var(--text)", marginBottom: 2 } }, "Bakımcı Girişi"),
                  React.createElement('div', { style: { fontSize: 13, color: "var(--text-muted)" } }, "Atanan bakım ve arızaları gör")
                ),
                React.createElement('div', { style: { color: "var(--text-dim)", fontSize: 18 } }, "\u203A")
              )
            ),

          /* -- YONETICI KARTI -- */
          React.createElement('div', { className: "login-card" },
            React.createElement('button', {
              onClick: () => { setSifreAcik(!sifreAcik); setHata(""); setSifre(""); },
              style: { width: "100%", padding: "18px 20px", background: "none", border: "none", cursor: "pointer", textAlign: "left" }
            },
              React.createElement('div', { style: { display: "flex", alignItems: "center", gap: 14 } },
                React.createElement('div', { style: { background: "rgba(0,122,255,0.15)", borderRadius: 14, width: 52, height: 52, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, flexShrink: 0 } }, "\uD83D\uDC54"),
                React.createElement('div', { style: { flex: 1 } },
                  React.createElement('div', { style: { fontWeight: 700, fontSize: 17, color: "var(--text)", marginBottom: 2 } }, "Yönetici Girişi"),
                  React.createElement('div', { style: { fontSize: 13, color: "var(--text-muted)" } }, "Tam yönetim \u00B7 Şifre gerekli")
                ),
                React.createElement('div', { style: { color: "var(--text-dim)", fontSize: 18 } }, sifreAcik ? "\u2303" : "\uD83D\uDD12")
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
                }, "\uD83D\uDEAB " + hata)
              )
            )
          )
        )
      )
    )
  );
}

export default LoginScreen
