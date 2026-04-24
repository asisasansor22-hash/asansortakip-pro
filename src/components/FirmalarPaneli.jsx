import React, { useEffect, useState } from 'react'
import { listTenants, dbSetRaw, dbGetRaw, setUserProfile, auth, firebaseLogin } from '../firebase.js'

// Süper-admin (Asis) için firma yönetim paneli.
// - Kiracı firma ekle / aboneliğini güncelle / askıya al
// - Kiracı firma yöneticisi için Firebase Auth hesabı + /users/{uid} kaydı oluştur
// Not: Bu panel yalnızca süper-admin tarafından görülmeli (App.jsx'te isSuper kontrolü var).
function FirmalarPaneli({ currentTenantId }) {
  const [firmalar, setFirmalar] = useState([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [form, setForm] = useState({ tenantId: "", ad: "", adres: "", tel: "", email: "", iban: "", whatsappImza: "", aylikUcret: "", bitis: "", yoneticiSifre: "" });
  const [mesaj, setMesaj] = useState("");

  async function yukle() {
    setYukleniyor(true);
    var list = await listTenants();
    setFirmalar(list);
    setYukleniyor(false);
  }

  useEffect(function(){ yukle(); }, []);

  async function kaydet() {
    setMesaj("");
    var slug = (form.tenantId || "").trim().toLowerCase()
      .replace(/ş/g,"s").replace(/ç/g,"c").replace(/ğ/g,"g")
      .replace(/ı/g,"i").replace(/ö/g,"o").replace(/ü/g,"u")
      .replace(/[^a-z0-9]/g,"");
    if (!slug) { setMesaj("Firma kodu (tenantId) zorunlu."); return; }
    if (!form.ad) { setMesaj("Firma adı zorunlu."); return; }
    if (!form.yoneticiSifre || form.yoneticiSifre.length < 6) { setMesaj("Yönetici şifresi en az 6 karakter olmalı."); return; }

    var existing = await dbGetRaw("tenants/" + slug + "/config");
    if (existing) { setMesaj("Bu firma kodu zaten mevcut."); return; }

    // 1) Config
    await dbSetRaw("tenants/" + slug + "/config", {
      ad: form.ad, adres: form.adres, tel: form.tel, email: form.email,
      iban: form.iban, whatsappImza: form.whatsappImza || ""
    });
    // 2) Abonelik
    await dbSetRaw("tenants/" + slug + "/subscription", {
      status: "active",
      aylikUcret: Number(form.aylikUcret) || 0,
      baslangic: new Date().toISOString().slice(0,10),
      bitis: form.bitis || "",
      sonOdeme: ""
    });
    // 3) Yönetici Firebase Auth hesabı
    var email = "yonetici_" + slug + "@asistakip.app";
    var res = await firebaseLogin(email, form.yoneticiSifre);
    if (res.success && res.user) {
      await setUserProfile(res.user.uid, { tenantId: slug, role: "yonetici", ad: form.ad + " Yöneticisi" });
      setMesaj("✅ Firma oluşturuldu. Kod: " + slug + " · Yönetici e-posta: " + email);
    } else {
      setMesaj("Firma oluşturuldu ama yönetici hesabı kurulamadı: " + (res.error || "bilinmeyen"));
    }
    setForm({ tenantId: "", ad: "", adres: "", tel: "", email: "", iban: "", whatsappImza: "", aylikUcret: "", bitis: "", yoneticiSifre: "" });
    yukle();
  }

  async function aboneliktDegistir(tid, yeniDurum) {
    var sub = await dbGetRaw("tenants/" + tid + "/subscription") || {};
    sub.status = yeniDurum;
    await dbSetRaw("tenants/" + tid + "/subscription", sub);
    yukle();
  }

  async function aboneligiUzat(tid) {
    var tarih = prompt("Yeni bitiş tarihi (YYYY-AA-GG):");
    if (!tarih) return;
    var sub = await dbGetRaw("tenants/" + tid + "/subscription") || {};
    sub.bitis = tarih;
    sub.status = "active";
    await dbSetRaw("tenants/" + tid + "/subscription", sub);
    yukle();
  }

  var inp = { padding: "10px 12px", background: "var(--bg-panel)", border: "1px solid var(--border)", borderRadius: 10, color: "var(--text)", fontSize: 14, width: "100%", boxSizing: "border-box" };
  var lbl = { fontSize: 12, color: "var(--text-muted)", marginBottom: 4, fontWeight: 600 };

  return React.createElement('div', { style: { display: "flex", flexDirection: "column", gap: 18 } },
    React.createElement('div', { style: { fontSize: 22, fontWeight: 800, color: "var(--text)" } }, "🏭 Firma Yönetimi"),
    React.createElement('div', { style: { fontSize: 13, color: "var(--text-muted)" } }, "Kiracı firmaları buradan ekler, aboneliklerini yönetirsiniz."),

    /* Yeni firma formu */
    React.createElement('div', { style: { background: "var(--bg-panel)", border: "1px solid var(--border)", borderRadius: 16, padding: 16, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px,1fr))", gap: 10 } },
      React.createElement('div', null, React.createElement('div', { style: lbl }, "Firma Kodu *"), React.createElement('input', { style: inp, value: form.tenantId, onChange: e => setForm(f => ({ ...f, tenantId: e.target.value })), placeholder: "ör. mavi" })),
      React.createElement('div', null, React.createElement('div', { style: lbl }, "Firma Adı *"), React.createElement('input', { style: inp, value: form.ad, onChange: e => setForm(f => ({ ...f, ad: e.target.value })), placeholder: "Mavi Asansör" })),
      React.createElement('div', null, React.createElement('div', { style: lbl }, "Adres"), React.createElement('input', { style: inp, value: form.adres, onChange: e => setForm(f => ({ ...f, adres: e.target.value })) })),
      React.createElement('div', null, React.createElement('div', { style: lbl }, "Telefon"), React.createElement('input', { style: inp, value: form.tel, onChange: e => setForm(f => ({ ...f, tel: e.target.value })) })),
      React.createElement('div', null, React.createElement('div', { style: lbl }, "E-posta"), React.createElement('input', { style: inp, value: form.email, onChange: e => setForm(f => ({ ...f, email: e.target.value })) })),
      React.createElement('div', null, React.createElement('div', { style: lbl }, "IBAN"), React.createElement('input', { style: inp, value: form.iban, onChange: e => setForm(f => ({ ...f, iban: e.target.value })) })),
      React.createElement('div', { style: { gridColumn: "1/-1" } }, React.createElement('div', { style: lbl }, "WhatsApp İmzası"), React.createElement('input', { style: inp, value: form.whatsappImza, onChange: e => setForm(f => ({ ...f, whatsappImza: e.target.value })), placeholder: "— Mavi Asansör" })),
      React.createElement('div', null, React.createElement('div', { style: lbl }, "Aylık Ücret (₺)"), React.createElement('input', { type: "number", style: inp, value: form.aylikUcret, onChange: e => setForm(f => ({ ...f, aylikUcret: e.target.value })) })),
      React.createElement('div', null, React.createElement('div', { style: lbl }, "Abonelik Bitiş"), React.createElement('input', { type: "date", style: inp, value: form.bitis, onChange: e => setForm(f => ({ ...f, bitis: e.target.value })) })),
      React.createElement('div', null, React.createElement('div', { style: lbl }, "Yönetici Şifresi * (min 6)"), React.createElement('input', { type: "text", style: inp, value: form.yoneticiSifre, onChange: e => setForm(f => ({ ...f, yoneticiSifre: e.target.value })) })),
      React.createElement('div', { style: { gridColumn: "1/-1", display: "flex", gap: 10, alignItems: "center" } },
        React.createElement('button', { onClick: kaydet, style: { padding: "12px 20px", background: "var(--accent)", color: "#fff", border: "none", borderRadius: 10, fontWeight: 700, cursor: "pointer" } }, "Firma Ekle"),
        mesaj && React.createElement('div', { style: { fontSize: 13, color: mesaj[0] === "✅" ? "var(--ios-green)" : "var(--ios-red)" } }, mesaj)
      )
    ),

    /* Firma listesi */
    React.createElement('div', { style: { display: "flex", flexDirection: "column", gap: 10 } },
      yukleniyor
        ? React.createElement('div', { style: { padding: 20, textAlign: "center", color: "var(--text-muted)" } }, "Yükleniyor...")
        : firmalar.length === 0
          ? React.createElement('div', { style: { padding: 20, textAlign: "center", color: "var(--text-muted)" } }, "Henüz firma yok.")
          : firmalar.map(function(t){
              var sub = t.subscription || {};
              var durum = sub.status || "unknown";
              var bitis = sub.bitis || "-";
              var aktif = durum === "active";
              return React.createElement('div', {
                key: t.id,
                style: { background: "var(--bg-panel)", border: "1px solid var(--border)", borderRadius: 14, padding: 14, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }
              },
                React.createElement('div', null,
                  React.createElement('div', { style: { fontWeight: 800, fontSize: 16, color: "var(--text)" } }, (t.config && t.config.ad) || t.id),
                  React.createElement('div', { style: { fontSize: 12, color: "var(--text-muted)", marginTop: 2 } }, "Kod: " + t.id + " · Bitiş: " + bitis + " · ₺" + (sub.aylikUcret || 0) + "/ay")
                ),
                React.createElement('div', { style: { display: "flex", gap: 8, alignItems: "center" } },
                  React.createElement('span', {
                    style: { fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: aktif ? "rgba(52,199,89,0.15)" : "rgba(255,59,48,0.15)", color: aktif ? "var(--ios-green)" : "var(--ios-red)" }
                  }, aktif ? "AKTİF" : durum.toUpperCase()),
                  React.createElement('button', { onClick: () => aboneligiUzat(t.id), style: { padding: "6px 10px", background: "transparent", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text)", cursor: "pointer", fontSize: 12 } }, "Uzat"),
                  aktif
                    ? React.createElement('button', { onClick: () => aboneliktDegistir(t.id, "suspended"), style: { padding: "6px 10px", background: "transparent", border: "1px solid var(--ios-orange)", borderRadius: 8, color: "var(--ios-orange)", cursor: "pointer", fontSize: 12 } }, "Askıya Al")
                    : React.createElement('button', { onClick: () => aboneliktDegistir(t.id, "active"), style: { padding: "6px 10px", background: "transparent", border: "1px solid var(--ios-green)", borderRadius: 8, color: "var(--ios-green)", cursor: "pointer", fontSize: 12 } }, "Etkinleştir")
                )
              );
            })
    )
  );
}

export default FirmalarPaneli
