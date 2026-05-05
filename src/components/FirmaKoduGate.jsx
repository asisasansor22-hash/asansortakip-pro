import React, { useState } from 'react'
import { S } from '../utils/constants.js'
import { ASIS_LOGO_B64 } from '../utils/makbuz.js'
import { setTenantId, getTenantPublic } from '../firebase.js'

// İlk açılışta firma kodu sorar, doğrulanınca localStorage'a yazıp üst bileşene haber verir.
// Kod localStorage'da olduğu sürece bu ekran tekrar gösterilmez.
function FirmaKoduGate({ onReady }) {
  const [kod, setKod] = useState("");
  const [yukleniyor, setYukleniyor] = useState(false);
  const [hata, setHata] = useState("");

  async function dogrula() {
    var slug = (kod || "").trim().toLowerCase()
      .replace(/ş/g,"s").replace(/ç/g,"c").replace(/ğ/g,"g")
      .replace(/ı/g,"i").replace(/ö/g,"o").replace(/ü/g,"u")
      .replace(/[^a-z0-9]/g,"");
    if (!slug) { setHata("Firma kodu giriniz"); return; }
    setYukleniyor(true);
    setHata("");
    try {
      var pub = await getTenantPublic(slug);
      if ((!pub || !pub.ad) && slug === "asis") {
        pub = { ad: "Asis", adminEmail: "yonetici@asistakip.app", plan: "kurumsal", bakimcilar: [] };
      }
      if (!pub || !pub.ad) {
        setYukleniyor(false);
        setHata("Firma bulunamadı. Kodu kontrol edin.");
        return;
      }
      setTenantId(slug);
      setYukleniyor(false);
      onReady(slug, pub);
    } catch (e) {
      setYukleniyor(false);
      setHata("Bağlantı hatası. İnternetinizi kontrol edin.");
    }
  }

  return React.createElement('div', { className: "login-wrap ios-fade" },
    React.createElement('div', { style: { width: "100%", maxWidth: 380 } },
      React.createElement('div', { style: { textAlign: "center", marginBottom: 44 } },
        React.createElement('img', { src: ASIS_LOGO_B64, alt: "Asis", className: "asis-logo-img", style: { height: "70px", objectFit: "contain", marginBottom: 8 } }),
        React.createElement('div', { style: { fontWeight: 800, fontSize: 30, color: "var(--text)", marginBottom: 6, letterSpacing: -1 } }, "AsansörTakip"),
        React.createElement('div', { style: { fontSize: 14, color: "var(--text-muted)" } }, "Pro")
      ),
      React.createElement('div', { className: "login-card", style: { padding: 20 } },
        React.createElement('div', { style: { fontWeight: 700, fontSize: 17, color: "var(--text)", marginBottom: 4 } }, "Firma Kodu"),
        React.createElement('div', { style: { fontSize: 13, color: "var(--text-muted)", marginBottom: 14 } }, "Firmanızın kodunu girin. Bu cihazda tekrar sorulmayacak."),
        React.createElement('div', { style: { display: "flex", gap: 8 } },
          React.createElement('input', {
            type: "text", value: kod, autoFocus: true,
            onChange: e => { setKod(e.target.value); setHata(""); },
            onKeyDown: e => e.key === "Enter" && dogrula(),
            placeholder: "ör. asis",
            style: { ...S.inp, border: hata ? "1px solid var(--ios-red)" : "none", fontSize: 16, textTransform: "lowercase" }
          }),
          React.createElement('button', {
            onClick: dogrula, disabled: yukleniyor,
            style: { padding: "12px 18px", background: "var(--accent)", border: "none", borderRadius: 12, color: "#fff", fontWeight: 700, fontSize: 15, cursor: "pointer", whiteSpace: "nowrap", minHeight: 44, opacity: yukleniyor ? 0.6 : 1 }
          }, yukleniyor ? "..." : "Devam")
        ),
        hata && React.createElement('div', {
          style: { marginTop: 10, fontSize: 13, color: "var(--ios-red)", padding: "8px 12px", background: "rgba(255,59,48,0.1)", borderRadius: 10 }
        }, "\uD83D\uDEAB " + hata)
      )
    )
  );
}

export default FirmaKoduGate
