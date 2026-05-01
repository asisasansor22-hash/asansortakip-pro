import React, { useEffect, useState } from 'react'
import { listTenants, dbSetRaw, dbGetRaw, dbDeleteRaw, setUserProfile, createTenantAdmin, setTenantPublic } from '../firebase.js'

function slugify(value){
  return String(value||"")
    .toLowerCase()
    .replace(/ğ/g,"g").replace(/ü/g,"u").replace(/ş/g,"s")
    .replace(/ı/g,"i").replace(/ö/g,"o").replace(/ç/g,"c")
    .replace(/[^a-z0-9]+/g,"-")
    .replace(/^-+|-+$/g,"")
    .replace(/-/g,"") || ("firma"+Date.now());
}

function emptyForm(){
  return {
    tenantId: "",
    ad: "",
    yetkili: "",
    tel: "",
    tel2: "",
    tel3: "",
    email: "",
    email2: "",
    adres: "",
    logoUrl: "",
    aylikUcret: "",
    bitis: "",
    yoneticiSifre: "",
    aktif: true
  };
}

// Şifre güvenli mi? Firebase Auth min 6 karakter zorunlu kılar.
function sifreGecerli(s) { return typeof s === "string" && s.length >= 6; }

function uniqueAdminEmail(slug){
  return "yonetici_" + slug + "_" + Date.now() + "@asistakip.app";
}

function FirmalarPaneli({ currentTenantId }) {
  const [firmalar, setFirmalar] = useState([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [form, setForm] = useState(emptyForm());
  const [editId, setEditId] = useState(null);
  const [mesaj, setMesaj] = useState("");

  async function yukle() {
    setYukleniyor(true);
    var list = await listTenants();
    setFirmalar(list);
    setYukleniyor(false);
  }

  useEffect(function(){ yukle(); }, []);

  function F(key, value){
    setForm(function(prev){ return Object.assign({}, prev, { [key]: value }); });
  }

  function formuTemizle(){
    setEditId(null);
    setForm(emptyForm());
  }

  async function adminHesabiKur(slug, sifre, eskiUid){
    var email = uniqueAdminEmail(slug);
    // İkincil auth instance kullan — süper-admin oturumu korunsun ki
    // setUserProfile çağrıları rules tarafından kabul edilsin.
    var res = await createTenantAdmin(email, sifre);
    if (!res.success || !res.user) {
      return { success: false, error: res.error || "yonetici hesabi olusturulamadi" };
    }
    if (eskiUid && eskiUid !== res.user.uid) {
      await setUserProfile(eskiUid, { tenantId: slug, role: "yonetici", active: false, replacedAt: new Date().toISOString() });
    }
    await setUserProfile(res.user.uid, {
      tenantId: slug,
      role: "yonetici",
      ad: (form.ad || slug) + " Yoneticisi",
      active: true,
      updatedAt: new Date().toISOString()
    });
    return { success: true, email: email, uid: res.user.uid };
  }

  async function kaydet() {
    setMesaj("");
    var slug = editId || slugify(form.tenantId || form.ad);
    if (!slug) { setMesaj("Firma kodu zorunlu."); return; }
    if (!form.ad.trim()) { setMesaj("Firma adi zorunlu."); return; }
    if (!editId && (!form.yoneticiSifre || form.yoneticiSifre.length < 6)) {
      setMesaj("Yonetici sifresi en az 6 karakter olmali.");
      return;
    }

    var existing = await dbGetRaw("tenants/" + slug + "/config");
    if (!editId && existing) { setMesaj("Bu firma kodu zaten mevcut."); return; }
    existing = existing || {};

    var adminEmail = existing.adminEmail || ("yonetici_" + slug + "@asistakip.app");
    var adminUid = existing.adminUid || "";
    if (form.yoneticiSifre) {
      var admin = await adminHesabiKur(slug, form.yoneticiSifre, existing.adminUid);
      if (!admin.success) {
        setMesaj("Yonetici hesabi kurulamadı: " + admin.error);
        return;
      }
      adminEmail = admin.email;
      adminUid = admin.uid;
    }

    // Gizli olmayan ve login öncesi gereken alanlar public yolda saklanır.
    // Şifre, adminUid gibi hassas alanlar config'de kalır ve auth gerektirir.
    await setTenantPublic(slug, {
      ad: form.ad.trim(),
      adminEmail: adminEmail
    });
    await dbSetRaw("tenants/" + slug + "/config", {
      ad: form.ad.trim(),
      yetkili: (form.yetkili||"").trim(),
      tel: (form.tel||"").trim(),
      tel2: (form.tel2||"").trim(),
      tel3: (form.tel3||"").trim(),
      email: (form.email||"").trim(),
      email2: (form.email2||"").trim(),
      adres: (form.adres||"").trim(),
      logoUrl: (form.logoUrl||"").trim(),
      adminEmail: adminEmail,
      adminUid: adminUid,
      updatedAt: new Date().toISOString()
    });
    await dbSetRaw("tenants/" + slug + "/subscription", {
      status: form.aktif === false ? "suspended" : "active",
      aylikUcret: Number(form.aylikUcret) || 0,
      baslangic: (existing.baslangic || new Date().toISOString().slice(0,10)),
      bitis: form.bitis || "",
      sonOdeme: ""
    });

    setMesaj(editId ? "Firma guncellendi." : "Firma olusturuldu. Kod: " + slug);
    formuTemizle();
    yukle();
  }

  function duzenle(t){
    var cfg = t.config || {};
    var sub = t.subscription || {};
    setEditId(t.id);
    setForm({
      tenantId: t.id,
      ad: cfg.ad || "",
      yetkili: cfg.yetkili || "",
      tel: cfg.tel || "",
      tel2: cfg.tel2 || "",
      tel3: cfg.tel3 || "",
      email: cfg.email || "",
      email2: cfg.email2 || "",
      adres: cfg.adres || "",
      logoUrl: cfg.logoUrl || "",
      aylikUcret: sub.aylikUcret || "",
      bitis: sub.bitis || "",
      yoneticiSifre: "",
      aktif: (sub.status || "active") === "active"
    });
    setMesaj("");
  }

  async function durumDegistir(tid, yeniDurum) {
    var sub = await dbGetRaw("tenants/" + tid + "/subscription") || {};
    sub.status = yeniDurum;
    sub.updatedAt = new Date().toISOString();
    await dbSetRaw("tenants/" + tid + "/subscription", sub);
    yukle();
  }

  async function firmaSil(tid) {
    if (tid === "asis" || tid === currentTenantId) return;
    if (!window.confirm("Firma listeden silinsin mi? Asansor verileri yedek olarak veritabaninda kalir.")) return;
    var cfg = await dbGetRaw("tenants/" + tid + "/config") || {};
    if (cfg.adminUid) {
      await setUserProfile(cfg.adminUid, { tenantId: tid, role: "yonetici", active: false, deletedAt: new Date().toISOString() });
    }
    await dbDeleteRaw("tenants/" + tid + "/config");
    await dbSetRaw("tenants/" + tid + "/subscription", { status: "deleted", updatedAt: new Date().toISOString() });
    yukle();
  }

  var inp = { padding: "10px 12px", background: "var(--bg-panel)", border: "1px solid var(--border)", borderRadius: 10, color: "var(--text)", fontSize: 14, width: "100%", boxSizing: "border-box" };
  var lbl = { fontSize: 12, color: "var(--text-muted)", marginBottom: 4, fontWeight: 600 };

  return React.createElement('div', { style: { display: "flex", flexDirection: "column", gap: 18 } },
    React.createElement('div', { style: { fontSize: 22, fontWeight: 800, color: "var(--text)" } }, "Firma Yonetimi"),
    React.createElement('div', { style: { fontSize: 13, color: "var(--text-muted)" } }, "Asis ana yonetici olarak firmalari buradan ekler, siler ve yonetici sifrelerini degistirir."),

    React.createElement('div', { style: { background: "var(--bg-panel)", border: "1px solid var(--border)", borderRadius: 16, padding: 16, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px,1fr))", gap: 10 } },
      !editId && React.createElement('div', null, React.createElement('div', { style: lbl }, "Firma Kodu"), React.createElement('input', { style: inp, value: form.tenantId, onChange: e => F("tenantId", e.target.value), placeholder: "or. onkas" })),
      React.createElement('div', null, React.createElement('div', { style: lbl }, "Firma Adi *"), React.createElement('input', { style: inp, value: form.ad, onChange: e => F("ad", e.target.value), placeholder: "Onkas Asansor" })),
      React.createElement('div', null, React.createElement('div', { style: lbl }, "Yetkili Ismi"), React.createElement('input', { style: inp, value: form.yetkili, onChange: e => F("yetkili", e.target.value) })),
      React.createElement('div', null, React.createElement('div', { style: lbl }, "Telefon 1"), React.createElement('input', { style: inp, value: form.tel, onChange: e => F("tel", e.target.value), placeholder: "0212 000 00 00" })),
      React.createElement('div', null, React.createElement('div', { style: lbl }, "Telefon 2 (Cep)"), React.createElement('input', { style: inp, value: form.tel2, onChange: e => F("tel2", e.target.value), placeholder: "0532 000 00 00" })),
      React.createElement('div', null, React.createElement('div', { style: lbl }, "Telefon 3 (Cep)"), React.createElement('input', { style: inp, value: form.tel3, onChange: e => F("tel3", e.target.value), placeholder: "0543 000 00 00" })),
      React.createElement('div', null, React.createElement('div', { style: lbl }, "E-posta 1"), React.createElement('input', { style: inp, value: form.email, onChange: e => F("email", e.target.value) })),
      React.createElement('div', null, React.createElement('div', { style: lbl }, "E-posta 2"), React.createElement('input', { style: inp, value: form.email2, onChange: e => F("email2", e.target.value) })),
      React.createElement('div', { style: { gridColumn: "1/-1" } }, React.createElement('div', { style: lbl }, "Firma Adresi (Teklif belgelerinde gorunur)"), React.createElement('input', { style: inp, value: form.adres, onChange: e => F("adres", e.target.value), placeholder: "Mahalle, Sokak No, Ilce / Sehir" })),
      React.createElement('div', { style: { gridColumn: "1/-1" } },
        React.createElement('div', { style: lbl }, "Logo URL (Teklif baslik gorseli — PNG/JPG, bos birakilabilir)"),
        React.createElement('input', { style: inp, value: form.logoUrl, onChange: e => F("logoUrl", e.target.value), placeholder: "https://..." }),
        form.logoUrl && React.createElement('img', { src: form.logoUrl, alt: "logo onizleme", style: { marginTop: 8, maxHeight: 60, maxWidth: 300, borderRadius: 6, border: "1px solid var(--border)", display: "block" }, onError: function(e){ e.target.style.display="none"; } })
      ),
      React.createElement('div', null, React.createElement('div', { style: lbl }, editId ? "Yeni Sifre (degistirmek icin doldur)" : "Yonetici Giris Sifresi *"), React.createElement('input', { type: "password", style: inp, value: form.yoneticiSifre, onChange: e => F("yoneticiSifre", e.target.value), placeholder: "en az 6 karakter" })),
      React.createElement('div', null, React.createElement('div', { style: lbl }, "Abonelik Bitis"), React.createElement('input', { type: "date", style: inp, value: form.bitis, onChange: e => F("bitis", e.target.value) })),
      React.createElement('div', null, React.createElement('div', { style: lbl }, "Aylik Ucret"), React.createElement('input', { type: "number", style: inp, value: form.aylikUcret, onChange: e => F("aylikUcret", e.target.value) })),
      React.createElement('label', { style: { display: "flex", alignItems: "center", gap: 8, color: "var(--text-muted)", fontSize: 13, paddingTop: 22 } },
        React.createElement('input', { type: "checkbox", checked: form.aktif !== false, onChange: e => F("aktif", e.target.checked) }),
        "Aktif firma"
      ),
      React.createElement('div', { style: { gridColumn: "1/-1", display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" } },
        editId && React.createElement('button', { onClick: formuTemizle, style: { padding: "12px 20px", background: "transparent", color: "var(--text)", border: "1px solid var(--border)", borderRadius: 10, fontWeight: 700, cursor: "pointer" } }, "Iptal"),
        React.createElement('button', { onClick: kaydet, style: { padding: "12px 20px", background: "var(--accent)", color: "#fff", border: "none", borderRadius: 10, fontWeight: 700, cursor: "pointer" } }, editId ? "Firmayi Guncelle" : "Firma Ekle"),
        mesaj && React.createElement('div', { style: { fontSize: 13, color: mesaj.indexOf("kurulamadi") >= 0 || mesaj.indexOf("zorunlu") >= 0 || mesaj.indexOf("olmali") >= 0 ? "var(--ios-red)" : "var(--ios-green)" } }, mesaj)
      )
    ),

    React.createElement('div', { style: { display: "flex", flexDirection: "column", gap: 10 } },
      yukleniyor
        ? React.createElement('div', { style: { padding: 20, textAlign: "center", color: "var(--text-muted)" } }, "Yukleniyor...")
        : firmalar.length === 0
          ? React.createElement('div', { style: { padding: 20, textAlign: "center", color: "var(--text-muted)" } }, "Henuz firma yok.")
          : firmalar.map(function(t){
              var cfg = t.config || {};
              var sub = t.subscription || {};
              var durum = sub.status || "unknown";
              var aktif = durum === "active";
              return React.createElement('div', {
                key: t.id,
                style: { background: "var(--bg-panel)", border: "1px solid var(--border)", borderRadius: 14, padding: 14, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }
              },
                React.createElement('div', null,
                  React.createElement('div', { style: { fontWeight: 800, fontSize: 16, color: "var(--text)" } }, cfg.ad || t.id),
                  React.createElement('div', { style: { fontSize: 12, color: "var(--text-muted)", marginTop: 2 } }, "Kod: " + t.id + " · Bitis: " + (sub.bitis || "-") + " · " + (sub.aylikUcret || 0) + " TL/ay"),
                  cfg.yetkili && React.createElement('div', { style: { fontSize: 12, color: "var(--text-muted)", marginTop: 2 } }, "Yetkili: " + cfg.yetkili),
                  cfg.tel && React.createElement('div', { style: { fontSize: 12, color: "var(--text-muted)", marginTop: 2 } }, "Tel: " + cfg.tel)
                ),
                React.createElement('div', { style: { display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" } },
                  React.createElement('span', {
                    style: { fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: aktif ? "rgba(52,199,89,0.15)" : "rgba(255,59,48,0.15)", color: aktif ? "var(--ios-green)" : "var(--ios-red)" }
                  }, aktif ? "AKTIF" : durum.toUpperCase()),
                  React.createElement('button', { onClick: () => duzenle(t), style: { padding: "6px 10px", background: "transparent", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text)", cursor: "pointer", fontSize: 12 } }, "Duzenle"),
                  aktif
                    ? React.createElement('button', { onClick: () => durumDegistir(t.id, "suspended"), style: { padding: "6px 10px", background: "transparent", border: "1px solid var(--ios-orange)", borderRadius: 8, color: "var(--ios-orange)", cursor: "pointer", fontSize: 12 } }, "Askıya Al")
                    : React.createElement('button', { onClick: () => durumDegistir(t.id, "active"), style: { padding: "6px 10px", background: "transparent", border: "1px solid var(--ios-green)", borderRadius: 8, color: "var(--ios-green)", cursor: "pointer", fontSize: 12 } }, "Aktif Et"),
                  t.id !== "asis" && React.createElement('button', { onClick: () => firmaSil(t.id), style: { padding: "6px 10px", background: "transparent", border: "1px solid var(--ios-red)", borderRadius: 8, color: "var(--ios-red)", cursor: "pointer", fontSize: 12 } }, "Sil")
                )
              );
            })
    )
  );
}

export default FirmalarPaneli
