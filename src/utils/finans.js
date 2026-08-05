// ═══════════════════════════════════════════════════════════
// GELİR-GİDER (KÂR/ZARAR) MOTORU — saf yardımcı fonksiyonlar
//
// Uygulamada para hareketi üç ayrı yerde tutuluyordu:
//   • sonOdemeler      → bakım tahsilatları (gelir)
//   • ekstraIsler      → ekstra iş tahsilatları (gelir)
//   • giderler         → haftalık gider listesi (her Cumartesi sıfırlanıyor)
// Bu modül hepsini tek bir kalıcı deftere (kayıtlar) aynalar; defter
// hiçbir zaman otomatik silinmez, böylece yıllık kâr/zarar çıkarılabilir.
// ═══════════════════════════════════════════════════════════

export const YONTEMLER = [
  { id: "nakit", ad: "Nakit", ikon: "💵" },
  { id: "havale", ad: "Havale / EFT", ikon: "🏦" },
  { id: "kart", ad: "Kredi Kartı", ikon: "💳" },
  { id: "cek", ad: "Çek", ikon: "🧾" },
  { id: "senet", ad: "Senet", ikon: "📜" },
  { id: "belirsiz", ad: "Belirtilmemiş", ikon: "❔" },
];

export const GELIR_KATEGORILERI = [
  { id: "bakim", ad: "Aylık Bakım", ikon: "🛗", renk: "#34C759" },
  { id: "ekstra", ad: "Ekstra İş / Onarım", ikon: "🔩", renk: "#30D158" },
  { id: "ariza", ad: "Arıza Müdahalesi", ikon: "⚠️", renk: "#5AC8FA" },
  { id: "montaj", ad: "Montaj / Revizyon", ikon: "🏗️", renk: "#007AFF" },
  { id: "muayene", ad: "Muayene / Belgelendirme", ikon: "🔍", renk: "#AF52DE" },
  { id: "parca_satis", ad: "Parça Satışı", ikon: "⚙️", renk: "#FFD60A" },
  { id: "diger_gelir", ad: "Diğer Gelir", ikon: "➕", renk: "#8E8E93" },
];

export const GIDER_KATEGORILERI = [
  { id: "yedek_parca", ad: "Yedek Parça / Malzeme", ikon: "⚙️", renk: "#FF3B30" },
  { id: "yakit", ad: "Yakıt / Ulaşım", ikon: "⛽", renk: "#FF9500" },
  { id: "maas", ad: "Maaş / Yevmiye", ikon: "👷", renk: "#FF2D55" },
  { id: "sgk_vergi", ad: "SGK / Vergi", ikon: "🏛️", renk: "#AF52DE" },
  { id: "kira", ad: "Kira", ikon: "🏢", renk: "#5856D6" },
  { id: "arac", ad: "Araç Bakım / Sigorta", ikon: "🚐", renk: "#FF6482" },
  { id: "ofis", ad: "Ofis / Telefon / İnternet", ikon: "🖨️", renk: "#64D2FF" },
  { id: "alet", ad: "Alet / Ekipman", ikon: "🧰", renk: "#FFD60A" },
  { id: "yemek", ad: "Yemek / Konaklama", ikon: "🍽️", renk: "#FF9F0A" },
  { id: "diger_gider", ad: "Diğer Gider", ikon: "➖", renk: "#8E8E93" },
];

export const AY_ADLARI = ["Ocak","Şubat","Mart","Nisan","Mayıs","Haziran","Temmuz","Ağustos","Eylül","Ekim","Kasım","Aralık"];
export const GUN_ADLARI = ["Pazar","Pazartesi","Salı","Çarşamba","Perşembe","Cuma","Cumartesi"];

const GELIR_HARITA = {};
GELIR_KATEGORILERI.forEach(function (k) { GELIR_HARITA[k.id] = k; });
const GIDER_HARITA = {};
GIDER_KATEGORILERI.forEach(function (k) { GIDER_HARITA[k.id] = k; });

export function kategoriler(tip) {
  return tip === "gelir" ? GELIR_KATEGORILERI : GIDER_KATEGORILERI;
}

export function kategoriBilgi(tip, id) {
  const harita = tip === "gelir" ? GELIR_HARITA : GIDER_HARITA;
  return harita[id] || { id: id || "diger", ad: id || "Diğer", ikon: tip === "gelir" ? "➕" : "➖", renk: "#8E8E93" };
}

export function yontemBilgi(id) {
  for (let i = 0; i < YONTEMLER.length; i++) if (YONTEMLER[i].id === id) return YONTEMLER[i];
  return YONTEMLER[YONTEMLER.length - 1];
}

// ── Tarih yardımcıları ───────────────────────────────────────
// Defterde tarih her zaman ISO ("YYYY-MM-DD") tutulur.

export function isoBugun(d) {
  const t = d ? new Date(d) : new Date();
  return t.getFullYear() + "-" + String(t.getMonth() + 1).padStart(2, "0") + "-" + String(t.getDate()).padStart(2, "0");
}

// "31.07.2026", "2026-07-31", Date → "2026-07-31"
export function isoTarih(deger) {
  if (!deger) return "";
  if (deger instanceof Date) return isNaN(deger) ? "" : isoBugun(deger);
  const s = String(deger).trim();
  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return iso[1] + "-" + iso[2] + "-" + iso[3];
  const tr = s.match(/^(\d{1,2})[.\/](\d{1,2})[.\/](\d{4})/);
  if (tr) return tr[3] + "-" + tr[2].padStart(2, "0") + "-" + tr[1].padStart(2, "0");
  const d = new Date(s);
  return isNaN(d) ? "" : isoBugun(d);
}

export function trTarih(iso) {
  const p = String(iso || "").split("-");
  return p.length === 3 ? p[2] + "." + p[1] + "." + p[0] : String(iso || "");
}

export function ayAnahtar(iso) {
  return String(iso || "").slice(0, 7);
}

export function ayEtiket(anahtar) {
  const p = String(anahtar || "").split("-");
  if (p.length < 2) return String(anahtar || "");
  return AY_ADLARI[parseInt(p[1], 10) - 1] + " " + p[0];
}

export function gunAdi(iso) {
  const d = new Date(iso + "T12:00:00");
  return isNaN(d) ? "" : GUN_ADLARI[d.getDay()];
}

export function ayGunSayisi(yil, ay0) {
  return new Date(yil, ay0 + 1, 0).getDate();
}

export function paraYaz(n) {
  const v = Math.round((Number(n) || 0) * 100) / 100;
  return v.toLocaleString("tr-TR", { minimumFractionDigits: 0, maximumFractionDigits: 2 }) + " ₺";
}

export function yuzdeYaz(n, basamak) {
  const v = Number(n) || 0;
  return "%" + v.toLocaleString("tr-TR", { minimumFractionDigits: 0, maximumFractionDigits: basamak === undefined ? 1 : basamak });
}

export function kisaPara(n) {
  const v = Math.abs(Number(n) || 0);
  const isaret = (Number(n) || 0) < 0 ? "-" : "";
  if (v >= 1000000) return isaret + (v / 1000000).toFixed(1).replace(".", ",") + "M";
  if (v >= 1000) return isaret + Math.round(v / 1000) + "B";
  return isaret + Math.round(v);
}

// ── Dönem aralıkları ─────────────────────────────────────────
// Her aralık { bas, bit } ISO tarih (dahil) olarak döner.

export function donemAralik(donem, bugunIso, ozel) {
  const bugun = bugunIso || isoBugun();
  const d = new Date(bugun + "T12:00:00");
  const yil = d.getFullYear();
  const ay = d.getMonth();

  if (donem === "bugun") return { bas: bugun, bit: bugun, etiket: gunAdi(bugun) + ", " + trTarih(bugun) };

  if (donem === "hafta") {
    const gun = d.getDay();
    const pazartesiFark = gun === 0 ? -6 : 1 - gun;
    const bas = new Date(d); bas.setDate(d.getDate() + pazartesiFark);
    const bit = new Date(bas); bit.setDate(bas.getDate() + 6);
    return { bas: isoBugun(bas), bit: isoBugun(bit), etiket: trTarih(isoBugun(bas)) + " – " + trTarih(isoBugun(bit)) };
  }

  if (donem === "ay") {
    const bas = yil + "-" + String(ay + 1).padStart(2, "0") + "-01";
    const bit = yil + "-" + String(ay + 1).padStart(2, "0") + "-" + String(ayGunSayisi(yil, ay)).padStart(2, "0");
    return { bas: bas, bit: bit, etiket: AY_ADLARI[ay] + " " + yil };
  }

  if (donem === "gecenAy") {
    const gy = ay === 0 ? yil - 1 : yil;
    const ga = ay === 0 ? 11 : ay - 1;
    const bas = gy + "-" + String(ga + 1).padStart(2, "0") + "-01";
    const bit = gy + "-" + String(ga + 1).padStart(2, "0") + "-" + String(ayGunSayisi(gy, ga)).padStart(2, "0");
    return { bas: bas, bit: bit, etiket: AY_ADLARI[ga] + " " + gy };
  }

  if (donem === "yil") return { bas: yil + "-01-01", bit: yil + "-12-31", etiket: yil + " Yılı" };

  if (donem === "ozel") {
    const bas = isoTarih(ozel && ozel.bas) || bugun;
    const bit = isoTarih(ozel && ozel.bit) || bugun;
    const sirali = bas <= bit ? { bas: bas, bit: bit } : { bas: bit, bit: bas };
    return { bas: sirali.bas, bit: sirali.bit, etiket: trTarih(sirali.bas) + " – " + trTarih(sirali.bit) };
  }

  return { bas: "0000-01-01", bit: "9999-12-31", etiket: "Tüm Zamanlar" };
}

export function aralikGunSayisi(bas, bit) {
  const a = new Date(bas + "T12:00:00");
  const b = new Date(bit + "T12:00:00");
  if (isNaN(a) || isNaN(b)) return 1;
  return Math.max(1, Math.round((b - a) / 86400000) + 1);
}

// ── Defter kaydı ─────────────────────────────────────────────

export function kayitNormalize(k) {
  if (!k || !k.id) return null;
  const tip = k.tip === "gelir" ? "gelir" : "gider";
  return {
    id: String(k.id),
    tip: tip,
    tarih: isoTarih(k.tarih) || isoBugun(),
    tutar: Math.abs(Number(k.tutar) || 0),
    kategori: k.kategori || (tip === "gelir" ? "diger_gelir" : "diger_gider"),
    aciklama: k.aciklama || "",
    yontem: k.yontem || "belirsiz",
    binaId: k.binaId === undefined || k.binaId === null || k.binaId === "" ? null : k.binaId,
    binaAd: k.binaAd || "",
    ilce: k.ilce || "",
    kaynak: k.kaynak || "manuel",
    belgeNo: k.belgeNo || "",
    kdvOran: Number(k.kdvOran) || 0,
    iptal: !!k.iptal,
    duzenlendi: !!k.duzenlendi,
    girisZamani: k.girisZamani || "",
    guncelleme: k.guncelleme || "",
  };
}

export function defteriNormalize(liste) {
  const cikti = [];
  (Array.isArray(liste) ? liste : []).forEach(function (k) {
    const n = kayitNormalize(k);
    if (n) cikti.push(n);
  });
  return cikti;
}

export function kdvHaric(kayit) {
  const oran = Number(kayit.kdvOran) || 0;
  if (oran <= 0) return kayit.tutar;
  return kayit.tutar / (1 + oran / 100);
}

export function kdvTutari(kayit) {
  return kayit.tutar - kdvHaric(kayit);
}

// ── Aynalama (mevcut modüllerden defteri besleme) ────────────
// Kaynak kayıtları sabit bir id öneki ile aynalanır; böylece aynı kayıt
// arşive taşınsa bile ikinci kez eklenmez.

function odemeKaydi(o) {
  if (!o || o.id === undefined || o.id === null) return null;
  const tutar = Number(o.alinanTutar) || 0;
  if (tutar <= 0) return null;
  const bakimci = o.not === "Bakım sonrası tahsilat";
  return {
    id: "t-" + o.id,
    tip: "gelir",
    tarih: isoTarih(o.tarih),
    tutar: tutar,
    kategori: "bakim",
    aciklama: (o.binaAd || o.ad || "Bina") + (bakimci ? " — bakım tahsilatı" : (o.not ? " — " + o.not : " — tahsilat")),
    yontem: "belirsiz",
    binaId: o.aid === undefined ? null : o.aid,
    binaAd: o.binaAd || o.ad || "",
    ilce: o.ilce || "",
    kaynak: "tahsilat",
    iptal: !!o.iptal,
    girisZamani: (o.tarih || "") + (o.saat ? " " + o.saat : ""),
  };
}

// Eski gider defterinde kategori alanı yok; açıklamadan tahmin edilir.
// Kullanıcı deftere girdikten sonra değiştirirse (duzenlendi) tahmin ezilmez.
const KATEGORI_IPUCLARI = [
  { kategori: "yakit", kelimeler: ["motorin", "mazot", "benzin", "yakit", "akaryakit", "lpg", "hgs", "ogs", "otoyol", "kopru", "otopark", "taksi", "metro", "otobus"] },
  // sgk_vergi maaştan önce: "SGK primi" gibi kayıtlar "prim" ile maaşa düşmesin
  { kategori: "sgk_vergi", kelimeler: ["sgk", "vergi", "stopaj", "bagkur", "beyanname"] },
  { kategori: "maas", kelimeler: ["maas", "yevmiye", "avans", "prim", "ikramiye", "harclik"] },
  { kategori: "kira", kelimeler: ["kira", "aidat", "depozito"] },
  { kategori: "arac", kelimeler: ["lastik", "kasko", "trafik sigorta", "arac", "periyodik bakim", "yag degisim", "akü", "aku"] },
  { kategori: "ofis", kelimeler: ["kirtasiye", "telefon", "internet", "kargo", "matbaa", "muhasebe", "hosting", "abonelik"] },
  { kategori: "yemek", kelimeler: ["yemek", "kahvalti", "ogle", "cay", "su ", "market", "konaklama", "otel"] },
  { kategori: "alet", kelimeler: ["matkap", "alet", "takim", "ekipman", "avometre", "el feneri", "merdiven"] },
  { kategori: "yedek_parca", kelimeler: ["parca", "halat", "balata", "conta", "kontaktor", "buton", "role", "fren", "kablo", "yag", "rulman", "kayis", "karbon", "fotosel", "salter", "kart", "motor", "kapi", "ray", "zincir", "lamba", "ampul", "pil"] },
];

export function giderKategoriTahmin(aciklama) {
  const metin = String(aciklama || "")
    .toLocaleLowerCase("tr-TR")
    .replace(/ı/g, "i").replace(/İ/g, "i")
    .replace(/ş/g, "s").replace(/ğ/g, "g").replace(/ç/g, "c").replace(/ö/g, "o").replace(/ü/g, "u");
  if (!metin.trim()) return "diger_gider";
  for (let i = 0; i < KATEGORI_IPUCLARI.length; i++) {
    const ipucu = KATEGORI_IPUCLARI[i];
    for (let j = 0; j < ipucu.kelimeler.length; j++) {
      if (metin.indexOf(ipucu.kelimeler[j]) > -1) return ipucu.kategori;
    }
  }
  return "diger_gider";
}

function giderKaydi(g) {
  if (!g || g.id === undefined || g.id === null) return null;
  const tutar = Number(g.tutar) || 0;
  if (tutar <= 0) return null;
  return {
    id: "g-" + g.id,
    tip: "gider",
    tarih: isoTarih(g.tarih),
    tutar: tutar,
    kategori: g.kategori || giderKategoriTahmin(g.aciklama),
    aciklama: g.aciklama || "Gider",
    yontem: "belirsiz",
    kaynak: "gider",
    iptal: !!g.iptal,
    girisZamani: g.girisZamani || "",
  };
}

function ekstraKaydi(e) {
  if (!e || e.id === undefined || e.id === null) return null;
  // Ödenmemiş ekstra iş devir bakiyesine yazılır; tahsil edildiğinde
  // zaten ödeme kaydı doğar. Çift saymamak için sadece ödenenler alınır.
  if (!e.odendi) return null;
  const tutar = Number(e.tutar) || 0;
  if (tutar <= 0) return null;
  return {
    id: "e-" + e.id,
    tip: "gelir",
    tarih: isoTarih(e.tarih),
    tutar: tutar,
    kategori: "ekstra",
    aciklama: (e.binaAd || "Bina") + " — " + (e.isAdi || "ekstra iş"),
    yontem: "belirsiz",
    binaId: e.binaId === undefined ? null : e.binaId,
    binaAd: e.binaAd || "",
    ilce: e.ilce || "",
    kaynak: "ekstra",
    girisZamani: (e.tarih || "") + (e.saat ? " " + e.saat : ""),
  };
}

// Kaynak listelerini deftere işler. Defterdeki aynalı kayıtların tutar /
// tarih / iptal bilgisi kaynaktan tazelenir; kullanıcı elle düzenlediyse
// (duzenlendi=true) kategori ve açıklamaya dokunulmaz.
export function kaynaklariBirlestir(mevcut, kaynaklar) {
  const defter = defteriNormalize(mevcut);
  const harita = new Map();
  defter.forEach(function (k) { harita.set(k.id, k); });

  const buGecisteGorulen = new Set();
  let degisti = false;

  function isle(ham) {
    const aday = kayitNormalize(ham);
    if (!aday || !aday.tarih) return;
    if (buGecisteGorulen.has(aday.id)) return; // canlı kayıt arşiv kopyasını ezmesin
    buGecisteGorulen.add(aday.id);
    const eski = harita.get(aday.id);
    if (!eski) {
      harita.set(aday.id, aday);
      degisti = true;
      return;
    }
    const yeni = Object.assign({}, eski, {
      tarih: aday.tarih,
      tutar: aday.tutar,
      iptal: aday.iptal,
      binaId: eski.binaId === null ? aday.binaId : eski.binaId,
      binaAd: eski.binaAd || aday.binaAd,
      ilce: eski.ilce || aday.ilce,
    });
    if (!eski.duzenlendi) {
      yeni.kategori = aday.kategori;
      yeni.aciklama = aday.aciklama;
    }
    const farkli = yeni.tarih !== eski.tarih || yeni.tutar !== eski.tutar || yeni.iptal !== eski.iptal ||
      yeni.kategori !== eski.kategori || yeni.aciklama !== eski.aciklama ||
      yeni.binaId !== eski.binaId || yeni.binaAd !== eski.binaAd || yeni.ilce !== eski.ilce;
    if (farkli) {
      harita.set(aday.id, yeni);
      degisti = true;
    }
  }

  const k = kaynaklar || {};
  (k.odemeler || []).forEach(function (o) { isle(odemeKaydi(o)); });
  (k.odemeArsivleri || []).forEach(function (liste) { (liste || []).forEach(function (o) { isle(odemeKaydi(o)); }); });
  (k.giderler || []).forEach(function (g) { isle(giderKaydi(g)); });
  (k.giderArsivleri || []).forEach(function (liste) { (liste || []).forEach(function (g) { isle(giderKaydi(g)); }); });
  (k.ekstraIsler || []).forEach(function (e) { isle(ekstraKaydi(e)); });

  if (!degisti) return { kayitlar: defter, degisti: false };
  const kayitlar = Array.from(harita.values()).sort(function (a, b) {
    if (a.tarih === b.tarih) return String(b.id).localeCompare(String(a.id));
    return a.tarih < b.tarih ? 1 : -1;
  });
  return { kayitlar: kayitlar, degisti: true };
}

// ── Sabit (tekrarlayan) giderler ─────────────────────────────
// { id, ad, tutar, kategori, gun, baslangic:"YYYY-MM", bitis:"", aktif, yontem }

export function sabitGiderKayitId(sabit, ayAnahtari) {
  return "s-" + sabit.id + "-" + ayAnahtari;
}

function ayEkle(anahtar, adet) {
  const p = String(anahtar).split("-");
  const d = new Date(parseInt(p[0], 10), parseInt(p[1], 10) - 1 + adet, 1);
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0");
}

// Başlangıç ayından bugüne kadar eksik olan sabit gider kayıtlarını üretir.
// Gelecek aylar için kayıt üretilmez; ayın günü henüz gelmediyse de beklenir.
export function sabitGiderleriUret(sabitler, mevcutKayitlar, bugunIso) {
  const bugun = bugunIso || isoBugun();
  const buAy = bugun.slice(0, 7);
  const varOlan = new Set((mevcutKayitlar || []).map(function (k) { return String(k.id); }));
  const yeniler = [];

  (sabitler || []).forEach(function (s) {
    if (!s || s.aktif === false) return;
    const tutar = Number(s.tutar) || 0;
    if (tutar <= 0) return;
    let ay = String(s.baslangic || buAy).slice(0, 7);
    if (!/^\d{4}-\d{2}$/.test(ay)) ay = buAy;
    const bitis = s.bitis && /^\d{4}-\d{2}$/.test(s.bitis) ? s.bitis : null;
    let guvenlik = 0;
    while (ay <= buAy && guvenlik < 240) {
      guvenlik++;
      if (bitis && ay > bitis) break;
      const yil = parseInt(ay.slice(0, 4), 10);
      const ay0 = parseInt(ay.slice(5, 7), 10) - 1;
      const gun = Math.min(Math.max(parseInt(s.gun, 10) || 1, 1), ayGunSayisi(yil, ay0));
      const tarih = ay + "-" + String(gun).padStart(2, "0");
      if (tarih <= bugun) {
        const id = sabitGiderKayitId(s, ay);
        if (!varOlan.has(id)) {
          yeniler.push(kayitNormalize({
            id: id,
            tip: "gider",
            tarih: tarih,
            tutar: tutar,
            kategori: s.kategori || "diger_gider",
            aciklama: (s.ad || "Sabit gider") + " — " + ayEtiket(ay),
            yontem: s.yontem || "belirsiz",
            kaynak: "sabit",
            girisZamani: new Date().toLocaleString("tr-TR"),
          }));
        }
      }
      ay = ayEkle(ay, 1);
    }
  });

  return yeniler;
}

// ── Süzme & toplama ──────────────────────────────────────────

export function suz(kayitlar, filtre) {
  const f = filtre || {};
  const arama = (f.arama || "").toLocaleLowerCase("tr-TR").trim();
  return (kayitlar || []).filter(function (k) {
    if (k.iptal && !f.iptalleriGoster) return false;
    if (f.bas && k.tarih < f.bas) return false;
    if (f.bit && k.tarih > f.bit) return false;
    if (f.tip && f.tip !== "hepsi" && k.tip !== f.tip) return false;
    if (f.kategori && f.kategori !== "hepsi" && k.kategori !== f.kategori) return false;
    if (f.yontem && f.yontem !== "hepsi" && k.yontem !== f.yontem) return false;
    if (f.binaId !== undefined && f.binaId !== null && f.binaId !== "" && String(k.binaId) !== String(f.binaId)) return false;
    if (arama) {
      const metin = (k.aciklama + " " + k.binaAd + " " + k.ilce + " " + k.belgeNo + " " +
        kategoriBilgi(k.tip, k.kategori).ad).toLocaleLowerCase("tr-TR");
      if (metin.indexOf(arama) === -1) return false;
    }
    return true;
  });
}

export function toplamlar(kayitlar) {
  let gelir = 0, gider = 0, gelirAdet = 0, giderAdet = 0, kdvGelir = 0, kdvGider = 0;
  (kayitlar || []).forEach(function (k) {
    if (k.iptal) return;
    if (k.tip === "gelir") { gelir += k.tutar; gelirAdet++; kdvGelir += kdvTutari(k); }
    else { gider += k.tutar; giderAdet++; kdvGider += kdvTutari(k); }
  });
  const net = gelir - gider;
  return {
    gelir: gelir,
    gider: gider,
    net: net,
    marj: gelir > 0 ? (net / gelir) * 100 : 0,
    giderOrani: gelir > 0 ? (gider / gelir) * 100 : 0,
    gelirAdet: gelirAdet,
    giderAdet: giderAdet,
    adet: gelirAdet + giderAdet,
    kdvGelir: kdvGelir,
    kdvGider: kdvGider,
    kdvFark: kdvGelir - kdvGider,
  };
}

export function kategoriDagilimi(kayitlar, tip) {
  const harita = {};
  let toplam = 0;
  (kayitlar || []).forEach(function (k) {
    if (k.iptal || k.tip !== tip) return;
    if (!harita[k.kategori]) harita[k.kategori] = { kategori: k.kategori, tutar: 0, adet: 0 };
    harita[k.kategori].tutar += k.tutar;
    harita[k.kategori].adet++;
    toplam += k.tutar;
  });
  return Object.keys(harita).map(function (id) {
    const bilgi = kategoriBilgi(tip, id);
    return {
      id: id,
      ad: bilgi.ad,
      ikon: bilgi.ikon,
      renk: bilgi.renk,
      tutar: harita[id].tutar,
      adet: harita[id].adet,
      yuzde: toplam > 0 ? (harita[id].tutar / toplam) * 100 : 0,
    };
  }).sort(function (a, b) { return b.tutar - a.tutar; });
}

export function yontemDagilimi(kayitlar) {
  const harita = {};
  (kayitlar || []).forEach(function (k) {
    if (k.iptal) return;
    if (!harita[k.yontem]) harita[k.yontem] = { id: k.yontem, gelir: 0, gider: 0 };
    if (k.tip === "gelir") harita[k.yontem].gelir += k.tutar;
    else harita[k.yontem].gider += k.tutar;
  });
  return Object.keys(harita).map(function (id) {
    const b = yontemBilgi(id);
    return Object.assign({ ad: b.ad, ikon: b.ikon, net: harita[id].gelir - harita[id].gider }, harita[id]);
  }).sort(function (a, b) { return (b.gelir + b.gider) - (a.gelir + a.gider); });
}

// Son N ayın gelir/gider serisi (grafik için, eskiden yeniye)
export function aylikSeri(kayitlar, ayAdedi, bugunIso) {
  const bugun = bugunIso || isoBugun();
  const adet = ayAdedi || 12;
  const seri = [];
  const indeks = {};
  let anahtar = ayEkle(bugun.slice(0, 7), -(adet - 1));
  for (let i = 0; i < adet; i++) {
    const kayit = { ay: anahtar, etiket: ayEtiket(anahtar), kisa: AY_ADLARI[parseInt(anahtar.slice(5, 7), 10) - 1].slice(0, 3), gelir: 0, gider: 0, net: 0 };
    indeks[anahtar] = kayit;
    seri.push(kayit);
    anahtar = ayEkle(anahtar, 1);
  }
  (kayitlar || []).forEach(function (k) {
    if (k.iptal) return;
    const hedef = indeks[ayAnahtar(k.tarih)];
    if (!hedef) return;
    if (k.tip === "gelir") hedef.gelir += k.tutar; else hedef.gider += k.tutar;
  });
  seri.forEach(function (s) { s.net = s.gelir - s.gider; });
  return seri;
}

// Bir yılın 12 ayı için tablo (rapor sekmesi)
export function yillikTablo(kayitlar, yil) {
  const satirlar = [];
  for (let ay = 0; ay < 12; ay++) {
    satirlar.push({ ay: ay, etiket: AY_ADLARI[ay], anahtar: yil + "-" + String(ay + 1).padStart(2, "0"), gelir: 0, gider: 0, net: 0, marj: 0 });
  }
  (kayitlar || []).forEach(function (k) {
    if (k.iptal || String(k.tarih).slice(0, 4) !== String(yil)) return;
    const ay = parseInt(String(k.tarih).slice(5, 7), 10) - 1;
    if (ay < 0 || ay > 11) return;
    if (k.tip === "gelir") satirlar[ay].gelir += k.tutar; else satirlar[ay].gider += k.tutar;
  });
  satirlar.forEach(function (s) {
    s.net = s.gelir - s.gider;
    s.marj = s.gelir > 0 ? (s.net / s.gelir) * 100 : 0;
  });
  return satirlar;
}

export function gunlereGrupla(kayitlar) {
  const harita = {};
  (kayitlar || []).forEach(function (k) {
    if (!harita[k.tarih]) harita[k.tarih] = { tarih: k.tarih, kayitlar: [], gelir: 0, gider: 0 };
    harita[k.tarih].kayitlar.push(k);
    if (!k.iptal) {
      if (k.tip === "gelir") harita[k.tarih].gelir += k.tutar;
      else harita[k.tarih].gider += k.tutar;
    }
  });
  return Object.keys(harita).sort().reverse().map(function (t) {
    const g = harita[t];
    g.net = g.gelir - g.gider;
    g.kayitlar.sort(function (a, b) { return String(b.id).localeCompare(String(a.id)); });
    return g;
  });
}

export function binalaraGorePerformans(kayitlar, elevs) {
  const adlar = {};
  (elevs || []).forEach(function (e) { adlar[String(e.id)] = e.ad || ""; });
  const harita = {};
  (kayitlar || []).forEach(function (k) {
    if (k.iptal || k.binaId === null || k.binaId === undefined) return;
    const anahtar = String(k.binaId);
    if (!harita[anahtar]) harita[anahtar] = { binaId: k.binaId, ad: adlar[anahtar] || k.binaAd || "Bilinmeyen", ilce: k.ilce || "", gelir: 0, gider: 0, adet: 0 };
    if (k.tip === "gelir") harita[anahtar].gelir += k.tutar; else harita[anahtar].gider += k.tutar;
    harita[anahtar].adet++;
    if (!harita[anahtar].ilce && k.ilce) harita[anahtar].ilce = k.ilce;
  });
  return Object.keys(harita).map(function (a) {
    const b = harita[a];
    b.net = b.gelir - b.gider;
    return b;
  }).sort(function (x, y) { return y.net - x.net; });
}

// Bu ayın bakım hedefi ve tahsilat açığı
export function tahsilatDurumu(kayitlar, elevs, bugunIso) {
  const aralik = donemAralik("ay", bugunIso);
  const hedef = (elevs || []).reduce(function (s, e) { return s + (Number(e.aylikUcret) || 0); }, 0);
  const tahsil = (kayitlar || []).reduce(function (s, k) {
    if (k.iptal || k.tip !== "gelir") return s;
    if (k.tarih < aralik.bas || k.tarih > aralik.bit) return s;
    if (k.kategori !== "bakim") return s;
    return s + k.tutar;
  }, 0);
  const alacak = (elevs || []).reduce(function (s, e) { return s + Math.max(0, Number(e.bakiyeDevir) || 0); }, 0);
  return {
    hedef: hedef,
    tahsil: tahsil,
    kalan: Math.max(0, hedef - tahsil),
    oran: hedef > 0 ? Math.min(100, (tahsil / hedef) * 100) : 0,
    alacak: alacak,
    etiket: aralik.etiket,
  };
}

// ── Excel çıktıları ──────────────────────────────────────────

export function excelHareketSatirlari(kayitlar, baslikBilgi) {
  const satirlar = [];
  satirlar.push(["GELİR-GİDER DEFTERİ"]);
  satirlar.push(["Dönem:", (baslikBilgi && baslikBilgi.donem) || "Tüm Zamanlar"]);
  satirlar.push(["Rapor Tarihi:", new Date().toLocaleString("tr-TR")]);
  satirlar.push([]);
  satirlar.push(["Tarih", "Gün", "Tür", "Kategori", "Açıklama", "Bina", "İlçe", "Ödeme Yöntemi", "Belge No", "Gelir (₺)", "Gider (₺)", "KDV Oranı (%)", "Durum"]);
  (kayitlar || []).forEach(function (k) {
    satirlar.push([
      trTarih(k.tarih),
      gunAdi(k.tarih),
      k.tip === "gelir" ? "Gelir" : "Gider",
      kategoriBilgi(k.tip, k.kategori).ad,
      k.aciklama,
      k.binaAd,
      k.ilce,
      yontemBilgi(k.yontem).ad,
      k.belgeNo,
      k.tip === "gelir" && !k.iptal ? k.tutar : "",
      k.tip === "gider" && !k.iptal ? k.tutar : "",
      k.kdvOran || "",
      k.iptal ? "İPTAL" : "Geçerli",
    ]);
  });
  const t = toplamlar(kayitlar);
  satirlar.push([]);
  satirlar.push(["TOPLAM", "", "", "", "", "", "", "", "", t.gelir, t.gider, "", ""]);
  satirlar.push(["NET KÂR/ZARAR", "", "", "", "", "", "", "", "", t.net, "", "", "%" + t.marj.toFixed(1)]);
  return satirlar;
}

export function excelYillikSatirlar(kayitlar, yil) {
  const tablo = yillikTablo(kayitlar, yil);
  const satirlar = [];
  satirlar.push([yil + " YILI KÂR / ZARAR TABLOSU"]);
  satirlar.push(["Rapor Tarihi:", new Date().toLocaleString("tr-TR")]);
  satirlar.push([]);
  satirlar.push(["Ay", "Gelir (₺)", "Gider (₺)", "Net (₺)", "Kâr Marjı (%)"]);
  let gelir = 0, gider = 0;
  tablo.forEach(function (s) {
    satirlar.push([s.etiket, s.gelir, s.gider, s.net, Number(s.marj.toFixed(1))]);
    gelir += s.gelir; gider += s.gider;
  });
  satirlar.push([]);
  satirlar.push(["YIL TOPLAMI", gelir, gider, gelir - gider, gelir > 0 ? Number((((gelir - gider) / gelir) * 100).toFixed(1)) : 0]);
  return satirlar;
}
