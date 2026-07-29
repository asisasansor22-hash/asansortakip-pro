// ═══════════════════════════════════════════════════════════
// VERİ DEPOSU — tarayıcının localStorage'ı.
//
// Uygulama tamamen bağımsız: hiçbir sunucuya bağlanmaz, veri yalnızca
// cihazda durur. Yedekleme/geri yükleme JSON dosyasıyla yapılır.
// ═══════════════════════════════════════════════════════════

import { bugunIso, islemleriNormalize } from './finans.js'

const ANAHTAR = "gg_veri_v1";
export const SURUM = 1;

export const VARSAYILAN_GELIR_KATEGORILERI = [
  { ad: "Satış", ikon: "🧾", renk: "#34C759" },
  { ad: "Hizmet / İşçilik", ikon: "🛠️", renk: "#30D158" },
  { ad: "Kira Geliri", ikon: "🏢", renk: "#5AC8FA" },
  { ad: "Faiz / Yatırım", ikon: "📈", renk: "#007AFF" },
  { ad: "Diğer Gelir", ikon: "➕", renk: "#8E8E93" },
];

export const VARSAYILAN_GIDER_KATEGORILERI = [
  { ad: "Malzeme / Alım", ikon: "📦", renk: "#FF3B30" },
  { ad: "Maaş / Yevmiye", ikon: "👷", renk: "#FF2D55" },
  { ad: "Kira", ikon: "🏠", renk: "#5856D6" },
  { ad: "Vergi / SGK", ikon: "🏛️", renk: "#AF52DE" },
  { ad: "Yakıt / Ulaşım", ikon: "⛽", renk: "#FF9500" },
  { ad: "Fatura / Abonelik", ikon: "🧾", renk: "#64D2FF" },
  { ad: "Yemek", ikon: "🍽️", renk: "#FF9F0A" },
  { ad: "Araç", ikon: "🚐", renk: "#FF6482" },
  { ad: "Ekipman", ikon: "🧰", renk: "#FFD60A" },
  { ad: "Diğer Gider", ikon: "➖", renk: "#8E8E93" },
];

function kimlik(onek) {
  return onek + "-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 7);
}

export function yeniKimlik(onek) { return kimlik(onek || "k"); }

export function bosVeri() {
  const kategoriler = [];
  VARSAYILAN_GELIR_KATEGORILERI.forEach(function (k, i) {
    kategoriler.push({ id: "gel" + i, ad: k.ad, tip: "gelir", ikon: k.ikon, renk: k.renk });
  });
  VARSAYILAN_GIDER_KATEGORILERI.forEach(function (k, i) {
    kategoriler.push({ id: "gid" + i, ad: k.ad, tip: "gider", ikon: k.ikon, renk: k.renk });
  });
  return {
    surum: SURUM,
    hesaplar: [
      { id: "kasa", ad: "Nakit Kasa", tur: "nakit", acilisBakiye: 0, renk: "#34C759", aktif: true },
      { id: "banka", ad: "Banka", tur: "banka", acilisBakiye: 0, renk: "#007AFF", aktif: true },
    ],
    kategoriler: kategoriler,
    islemler: [],
    tekrarlar: [],
    butceler: [],
    ayarlar: { paraSimgesi: "₺", tema: "koyu", isim: "", sonKayit: "" },
  };
}

// Eksik alanları tamamlar; eski/bozuk yedeklerin uygulamayı çökertmesini önler.
export function veriNormalize(ham) {
  const bos = bosVeri();
  const v = ham && typeof ham === "object" ? ham : {};
  const hesaplar = Array.isArray(v.hesaplar) && v.hesaplar.length ? v.hesaplar : bos.hesaplar;
  const kategoriler = Array.isArray(v.kategoriler) && v.kategoriler.length ? v.kategoriler : bos.kategoriler;
  return {
    surum: SURUM,
    hesaplar: hesaplar.map(function (h, i) {
      return {
        id: String(h.id === undefined || h.id === null || h.id === "" ? "h" + i : h.id),
        ad: h.ad || "Hesap",
        tur: h.tur || "diger",
        acilisBakiye: Number(h.acilisBakiye) || 0,
        renk: h.renk || "#007AFF",
        aktif: h.aktif === false ? false : true,
      };
    }),
    kategoriler: kategoriler.map(function (k, i) {
      return {
        id: String(k.id === undefined || k.id === null || k.id === "" ? "k" + i : k.id),
        ad: k.ad || "Kategori",
        tip: k.tip === "gelir" ? "gelir" : "gider",
        ikon: k.ikon || (k.tip === "gelir" ? "➕" : "➖"),
        renk: k.renk || "#8E8E93",
      };
    }),
    islemler: islemleriNormalize(v.islemler),
    tekrarlar: (Array.isArray(v.tekrarlar) ? v.tekrarlar : []).map(function (t, i) {
      return {
        id: String(t.id === undefined || t.id === null || t.id === "" ? "t" + i : t.id),
        tip: t.tip === "gelir" ? "gelir" : "gider",
        ad: t.ad || "Tekrarlayan",
        tutar: Number(t.tutar) || 0,
        kategoriId: String(t.kategoriId || ""),
        hesapId: String(t.hesapId || ""),
        periyot: t.periyot === "haftalik" || t.periyot === "yillik" ? t.periyot : "aylik",
        gun: t.gun === undefined ? 1 : t.gun,
        baslangic: t.baslangic || bugunIso().slice(0, 7) + "-01",
        bitis: t.bitis || "",
        aktif: t.aktif === false ? false : true,
      };
    }),
    butceler: (Array.isArray(v.butceler) ? v.butceler : []).map(function (b) {
      return { kategoriId: String(b.kategoriId || ""), aylikLimit: Number(b.aylikLimit) || 0 };
    }).filter(function (b) { return b.kategoriId; }),
    ayarlar: Object.assign({}, bos.ayarlar, v.ayarlar || {}),
  };
}

export function veriYukle() {
  try {
    const ham = localStorage.getItem(ANAHTAR);
    if (!ham) return bosVeri();
    return veriNormalize(JSON.parse(ham));
  } catch (e) {
    console.warn("Veri okunamadı, boş defterle başlanıyor.", e);
    return bosVeri();
  }
}

// Yazma başarısız olursa (özel sekme, dolu depo) sessiz kalmaz: çağıran
// tarafa false döner ve arayüz kullanıcıyı uyarabilir.
export function veriKaydet(veri) {
  try {
    localStorage.setItem(ANAHTAR, JSON.stringify(veri));
    return true;
  } catch (e) {
    console.error("Veri kaydedilemedi", e);
    return false;
  }
}

export function veriSil() {
  try { localStorage.removeItem(ANAHTAR); } catch (e) {}
}

export function yedekMetni(veri) {
  return JSON.stringify({ uygulama: "GelirGider", surum: SURUM, tarih: new Date().toISOString(), veri: veri }, null, 2);
}

// Hem yedek zarfını ({uygulama, veri}) hem de doğrudan veri nesnesini kabul eder.
export function yedektenOku(metin) {
  const cozulen = JSON.parse(metin);
  const govde = cozulen && cozulen.veri ? cozulen.veri : cozulen;
  if (!govde || typeof govde !== "object") throw new Error("Dosya tanınmadı");
  if (!Array.isArray(govde.islemler) && !Array.isArray(govde.hesaplar)) throw new Error("Bu dosya bir GelirGider yedeği değil");
  return veriNormalize(govde);
}

export function dosyaIndir(adi, icerik, tur) {
  const blob = new Blob([icerik], { type: (tur || "application/json") + ";charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = adi;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
}
