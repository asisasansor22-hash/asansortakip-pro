// ═══════════════════════════════════════════════════════════
// HESAP MOTORU — saf fonksiyonlar, hiçbir yan etkisi yok.
// Uygulamanın tüm para mantığı burada; ekranlar yalnızca gösterir.
// ═══════════════════════════════════════════════════════════

export const AY_ADLARI = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
export const GUN_ADLARI = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];

export const HESAP_TURLERI = [
  { id: "nakit", ad: "Nakit Kasa", ikon: "💵" },
  { id: "banka", ad: "Banka Hesabı", ikon: "🏦" },
  { id: "kart", ad: "Kredi Kartı", ikon: "💳" },
  { id: "diger", ad: "Diğer", ikon: "📦" },
];

export const PERIYOTLAR = [
  { id: "aylik", ad: "Her ay" },
  { id: "haftalik", ad: "Her hafta" },
  { id: "yillik", ad: "Her yıl" },
];

// ── Tarih ────────────────────────────────────────────────────
// Tarihler her yerde ISO ("YYYY-AA-GG") metni olarak tutulur; Date nesnesi
// yalnızca hesap sırasında ve öğlen saatiyle kurulur (yaz saati kaymaları
// gün atlamasına yol açmasın diye).

export function bugunIso(d) {
  const t = d ? new Date(d) : new Date();
  return t.getFullYear() + "-" + String(t.getMonth() + 1).padStart(2, "0") + "-" + String(t.getDate()).padStart(2, "0");
}

export function tarihNesnesi(iso) {
  return new Date(String(iso) + "T12:00:00");
}

export function isoTarih(deger) {
  if (!deger) return "";
  if (deger instanceof Date) return isNaN(deger) ? "" : bugunIso(deger);
  const s = String(deger).trim();
  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return iso[1] + "-" + iso[2] + "-" + iso[3];
  const tr = s.match(/^(\d{1,2})[.\/](\d{1,2})[.\/](\d{4})/);
  if (tr) return tr[3] + "-" + tr[2].padStart(2, "0") + "-" + tr[1].padStart(2, "0");
  const d = new Date(s);
  return isNaN(d) ? "" : bugunIso(d);
}

export function trTarih(iso) {
  const p = String(iso || "").split("-");
  return p.length === 3 ? p[2] + "." + p[1] + "." + p[0] : String(iso || "");
}

export function gunAdi(iso) {
  const d = tarihNesnesi(iso);
  return isNaN(d) ? "" : GUN_ADLARI[d.getDay()];
}

export function ayAnahtar(iso) { return String(iso || "").slice(0, 7); }

export function ayEtiket(anahtar) {
  const p = String(anahtar || "").split("-");
  if (p.length < 2) return String(anahtar || "");
  return AY_ADLARI[parseInt(p[1], 10) - 1] + " " + p[0];
}

export function ayGunSayisi(yil, ay0) { return new Date(yil, ay0 + 1, 0).getDate(); }

export function ayEkle(anahtar, adet) {
  const p = String(anahtar).split("-");
  const d = new Date(parseInt(p[0], 10), parseInt(p[1], 10) - 1 + adet, 1);
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0");
}

export function gunEkle(iso, adet) {
  const d = tarihNesnesi(iso);
  d.setDate(d.getDate() + adet);
  return bugunIso(d);
}

// ── Biçimlendirme ────────────────────────────────────────────

export function paraYaz(n, simge) {
  const v = Math.round((Number(n) || 0) * 100) / 100;
  const s = v.toLocaleString("tr-TR", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  return s + " " + (simge === undefined ? "₺" : simge);
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

// "1.250,50" / "1250.5" / "1.250" → sayı
export function sayiOku(deger) {
  if (typeof deger === "number") return isFinite(deger) ? deger : 0;
  let s = String(deger || "").replace(/[^\d.,-]/g, "").trim();
  if (!s) return 0;
  const sonVirgul = s.lastIndexOf(",");
  const sonNokta = s.lastIndexOf(".");
  if (sonVirgul > -1 && sonNokta > -1) {
    // İkisi de varsa sonda olan ondalık ayırıcıdır, diğeri binlik
    if (sonVirgul > sonNokta) s = s.replace(/\./g, "").replace(",", ".");
    else s = s.replace(/,/g, "");
  } else if (sonVirgul > -1) {
    s = s.replace(/,/g, ".");
  } else if (/^-?\d{1,3}(\.\d{3})+$/.test(s)) {
    // "1.250" / "12.500.000" → nokta burada binlik ayırıcı
    s = s.replace(/\./g, "");
  }
  const n = parseFloat(s);
  return isNaN(n) ? 0 : Math.round(n * 100) / 100;
}

// ── Dönem aralıkları ─────────────────────────────────────────

export function donemAralik(donem, referans, ozel) {
  const bugun = referans || bugunIso();
  const d = tarihNesnesi(bugun);
  const yil = d.getFullYear();
  const ay = d.getMonth();

  if (donem === "bugun") return { bas: bugun, bit: bugun, etiket: gunAdi(bugun) + ", " + trTarih(bugun) };

  if (donem === "hafta") {
    const gun = d.getDay();
    const fark = gun === 0 ? -6 : 1 - gun;
    const bas = gunEkle(bugun, fark);
    return { bas: bas, bit: gunEkle(bas, 6), etiket: trTarih(bas) + " – " + trTarih(gunEkle(bas, 6)) };
  }

  if (donem === "ay" || donem === "gecenAy") {
    const kayma = donem === "gecenAy" ? -1 : 0;
    const t = new Date(yil, ay + kayma, 1);
    const y = t.getFullYear(), a = t.getMonth();
    const on = y + "-" + String(a + 1).padStart(2, "0");
    return { bas: on + "-01", bit: on + "-" + String(ayGunSayisi(y, a)).padStart(2, "0"), etiket: AY_ADLARI[a] + " " + y };
  }

  if (donem === "yil") return { bas: yil + "-01-01", bit: yil + "-12-31", etiket: yil + " Yılı" };

  if (donem === "ozel") {
    const bas = isoTarih(ozel && ozel.bas) || bugun;
    const bit = isoTarih(ozel && ozel.bit) || bugun;
    const s = bas <= bit ? { bas: bas, bit: bit } : { bas: bit, bit: bas };
    return { bas: s.bas, bit: s.bit, etiket: trTarih(s.bas) + " – " + trTarih(s.bit) };
  }

  return { bas: "0000-01-01", bit: "9999-12-31", etiket: "Tüm Zamanlar" };
}

export function aralikGunSayisi(bas, bit) {
  const a = tarihNesnesi(bas), b = tarihNesnesi(bit);
  if (isNaN(a) || isNaN(b)) return 1;
  return Math.max(1, Math.round((b - a) / 86400000) + 1);
}

// ── İşlem kaydı ──────────────────────────────────────────────
// tip: "gelir" | "gider" | "transfer"
// transfer toplamlara girmez, yalnızca hesap bakiyelerini etkiler.

export function islemNormalize(k) {
  if (!k || k.id === undefined || k.id === null) return null;
  const tip = k.tip === "gelir" ? "gelir" : k.tip === "transfer" ? "transfer" : "gider";
  return {
    id: String(k.id),
    tip: tip,
    tarih: isoTarih(k.tarih) || bugunIso(),
    tutar: Math.round(Math.abs(Number(k.tutar) || 0) * 100) / 100,
    kategoriId: tip === "transfer" ? "" : String(k.kategoriId || ""),
    hesapId: String(k.hesapId || ""),
    hedefHesapId: tip === "transfer" ? String(k.hedefHesapId || "") : "",
    aciklama: k.aciklama || "",
    kisi: k.kisi || "",
    belgeNo: k.belgeNo || "",
    kdvOran: Number(k.kdvOran) || 0,
    iptal: !!k.iptal,
    kaynak: k.kaynak || "manuel",
    girisZamani: k.girisZamani || "",
    guncelleme: k.guncelleme || "",
  };
}

export function islemleriNormalize(liste) {
  const cikti = [];
  (Array.isArray(liste) ? liste : []).forEach(function (k) {
    const n = islemNormalize(k);
    if (n) cikti.push(n);
  });
  return cikti;
}

export function islemSirala(liste) {
  return liste.slice().sort(function (a, b) {
    if (a.tarih === b.tarih) return String(b.id).localeCompare(String(a.id));
    return a.tarih < b.tarih ? 1 : -1;
  });
}

export function kdvHaric(k) {
  const oran = Number(k.kdvOran) || 0;
  return oran > 0 ? k.tutar / (1 + oran / 100) : k.tutar;
}

export function kdvTutari(k) { return k.tutar - kdvHaric(k); }

// ── Süzme ────────────────────────────────────────────────────

export function suz(islemler, filtre) {
  const f = filtre || {};
  const arama = (f.arama || "").toLocaleLowerCase("tr-TR").trim();
  const kategoriAdi = f.kategoriAdi || function () { return ""; };
  const hesapAdi = f.hesapAdi || function () { return ""; };
  return (islemler || []).filter(function (k) {
    if (k.iptal && !f.iptalleriGoster) return false;
    if (f.transferGizle && k.tip === "transfer") return false;
    if (f.bas && k.tarih < f.bas) return false;
    if (f.bit && k.tarih > f.bit) return false;
    if (f.tip && f.tip !== "hepsi" && k.tip !== f.tip) return false;
    if (f.kategoriId && f.kategoriId !== "hepsi" && k.kategoriId !== f.kategoriId) return false;
    if (f.hesapId && f.hesapId !== "hepsi" && k.hesapId !== f.hesapId && k.hedefHesapId !== f.hesapId) return false;
    if (arama) {
      const metin = (k.aciklama + " " + k.kisi + " " + k.belgeNo + " " + kategoriAdi(k.kategoriId) + " " + hesapAdi(k.hesapId))
        .toLocaleLowerCase("tr-TR");
      if (metin.indexOf(arama) === -1) return false;
    }
    return true;
  });
}

// ── Toplamlar ────────────────────────────────────────────────

export function toplamlar(islemler) {
  let gelir = 0, gider = 0, gelirAdet = 0, giderAdet = 0, kdvGelir = 0, kdvGider = 0, transferAdet = 0;
  (islemler || []).forEach(function (k) {
    if (k.iptal) return;
    if (k.tip === "gelir") { gelir += k.tutar; gelirAdet++; kdvGelir += kdvTutari(k); }
    else if (k.tip === "gider") { gider += k.tutar; giderAdet++; kdvGider += kdvTutari(k); }
    else transferAdet++;
  });
  const net = gelir - gider;
  return {
    gelir: gelir, gider: gider, net: net,
    marj: gelir > 0 ? (net / gelir) * 100 : 0,
    giderOrani: gelir > 0 ? (gider / gelir) * 100 : 0,
    gelirAdet: gelirAdet, giderAdet: giderAdet, transferAdet: transferAdet,
    adet: gelirAdet + giderAdet + transferAdet,
    kdvGelir: kdvGelir, kdvGider: kdvGider, kdvFark: kdvGelir - kdvGider,
  };
}

// Hesap bakiyeleri: açılış + gelen − giden (transferler dahil), iptaller hariç
export function hesapBakiyeleri(hesaplar, islemler, bitTarih) {
  const bakiye = {};
  (hesaplar || []).forEach(function (h) { bakiye[String(h.id)] = Number(h.acilisBakiye) || 0; });
  (islemler || []).forEach(function (k) {
    if (k.iptal) return;
    if (bitTarih && k.tarih > bitTarih) return;
    const kaynak = String(k.hesapId);
    if (k.tip === "gelir") { if (kaynak in bakiye) bakiye[kaynak] += k.tutar; }
    else if (k.tip === "gider") { if (kaynak in bakiye) bakiye[kaynak] -= k.tutar; }
    else {
      const hedef = String(k.hedefHesapId);
      if (kaynak in bakiye) bakiye[kaynak] -= k.tutar;
      if (hedef in bakiye) bakiye[hedef] += k.tutar;
    }
  });
  return (hesaplar || []).map(function (h) {
    return Object.assign({}, h, { bakiye: bakiye[String(h.id)] || 0 });
  });
}

export function toplamVarlik(hesaplar, islemler, bitTarih) {
  return hesapBakiyeleri(hesaplar, islemler, bitTarih).reduce(function (s, h) { return s + h.bakiye; }, 0);
}

export function kategoriDagilimi(islemler, tip, kategoriler) {
  const bilgi = {};
  (kategoriler || []).forEach(function (k) { bilgi[String(k.id)] = k; });
  const harita = {};
  let toplam = 0;
  (islemler || []).forEach(function (k) {
    if (k.iptal || k.tip !== tip) return;
    const anahtar = k.kategoriId || "yok";
    if (!harita[anahtar]) harita[anahtar] = { tutar: 0, adet: 0 };
    harita[anahtar].tutar += k.tutar;
    harita[anahtar].adet++;
    toplam += k.tutar;
  });
  return Object.keys(harita).map(function (id) {
    const k = bilgi[id];
    return {
      id: id,
      ad: k ? k.ad : "Kategorisiz",
      ikon: k ? k.ikon : "❔",
      renk: k ? k.renk : "#8E8E93",
      tutar: harita[id].tutar,
      adet: harita[id].adet,
      yuzde: toplam > 0 ? (harita[id].tutar / toplam) * 100 : 0,
    };
  }).sort(function (a, b) { return b.tutar - a.tutar; });
}

export function aylikSeri(islemler, ayAdedi, referans) {
  const bugun = referans || bugunIso();
  const adet = ayAdedi || 12;
  const seri = [];
  const indeks = {};
  let anahtar = ayEkle(bugun.slice(0, 7), -(adet - 1));
  for (let i = 0; i < adet; i++) {
    const kayit = {
      ay: anahtar, etiket: ayEtiket(anahtar),
      kisa: AY_ADLARI[parseInt(anahtar.slice(5, 7), 10) - 1].slice(0, 3),
      gelir: 0, gider: 0, net: 0,
    };
    indeks[anahtar] = kayit;
    seri.push(kayit);
    anahtar = ayEkle(anahtar, 1);
  }
  (islemler || []).forEach(function (k) {
    if (k.iptal || k.tip === "transfer") return;
    const hedef = indeks[ayAnahtar(k.tarih)];
    if (!hedef) return;
    if (k.tip === "gelir") hedef.gelir += k.tutar; else hedef.gider += k.tutar;
  });
  seri.forEach(function (s) { s.net = s.gelir - s.gider; });
  return seri;
}

export function yillikTablo(islemler, yil) {
  const satirlar = [];
  for (let ay = 0; ay < 12; ay++) {
    satirlar.push({ ay: ay, etiket: AY_ADLARI[ay], anahtar: yil + "-" + String(ay + 1).padStart(2, "0"), gelir: 0, gider: 0, net: 0, marj: 0 });
  }
  (islemler || []).forEach(function (k) {
    if (k.iptal || k.tip === "transfer" || String(k.tarih).slice(0, 4) !== String(yil)) return;
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

export function gunlereGrupla(islemler) {
  const harita = {};
  (islemler || []).forEach(function (k) {
    if (!harita[k.tarih]) harita[k.tarih] = { tarih: k.tarih, islemler: [], gelir: 0, gider: 0 };
    harita[k.tarih].islemler.push(k);
    if (!k.iptal) {
      if (k.tip === "gelir") harita[k.tarih].gelir += k.tutar;
      else if (k.tip === "gider") harita[k.tarih].gider += k.tutar;
    }
  });
  return Object.keys(harita).sort().reverse().map(function (t) {
    const g = harita[t];
    g.net = g.gelir - g.gider;
    g.islemler = islemSirala(g.islemler);
    return g;
  });
}

export function kisiDagilimi(islemler) {
  const harita = {};
  (islemler || []).forEach(function (k) {
    if (k.iptal || k.tip === "transfer" || !k.kisi) return;
    const ad = k.kisi.trim();
    if (!harita[ad]) harita[ad] = { ad: ad, gelir: 0, gider: 0, adet: 0 };
    if (k.tip === "gelir") harita[ad].gelir += k.tutar; else harita[ad].gider += k.tutar;
    harita[ad].adet++;
  });
  return Object.keys(harita).map(function (a) {
    const k = harita[a];
    k.net = k.gelir - k.gider;
    return k;
  }).sort(function (x, y) { return (y.gelir + y.gider) - (x.gelir + x.gider); });
}

// ── Bütçe ────────────────────────────────────────────────────
// butceler: [{ kategoriId, aylikLimit }]

export function butceDurumu(butceler, islemler, ayAnahtari, kategoriler) {
  const bilgi = {};
  (kategoriler || []).forEach(function (k) { bilgi[String(k.id)] = k; });
  const harcama = {};
  (islemler || []).forEach(function (k) {
    if (k.iptal || k.tip !== "gider" || ayAnahtar(k.tarih) !== ayAnahtari) return;
    harcama[k.kategoriId] = (harcama[k.kategoriId] || 0) + k.tutar;
  });
  return (butceler || []).filter(function (b) { return Number(b.aylikLimit) > 0; }).map(function (b) {
    const k = bilgi[String(b.kategoriId)];
    const limit = Number(b.aylikLimit) || 0;
    const harcanan = harcama[String(b.kategoriId)] || 0;
    const oran = limit > 0 ? (harcanan / limit) * 100 : 0;
    return {
      kategoriId: String(b.kategoriId),
      ad: k ? k.ad : "Kategorisiz",
      ikon: k ? k.ikon : "❔",
      renk: k ? k.renk : "#8E8E93",
      limit: limit,
      harcanan: harcanan,
      kalan: limit - harcanan,
      oran: oran,
      durum: oran >= 100 ? "asildi" : oran >= 80 ? "yaklasti" : "iyi",
    };
  }).sort(function (a, b) { return b.oran - a.oran; });
}

// ── Tekrarlayan işlemler ─────────────────────────────────────
// { id, tip, ad, tutar, kategoriId, hesapId, periyot, gun, baslangic, bitis, aktif }
// gun: aylık → ayın günü (1-28), haftalık → 0-6 (Pazar-Cumartesi), yıllık → "AA-GG"

export function tekrarlayanKayitId(tekrar, anahtar) { return "r-" + tekrar.id + "-" + anahtar; }

// Bir tekrarın başlangıçtan bugüne kadarki tarihlerini üretir.
export function tekrarTarihleri(tekrar, referans) {
  const bugun = referans || bugunIso();
  const tarihler = [];
  const baslangic = isoTarih(tekrar.baslangic) || bugun;
  const bitis = tekrar.bitis ? isoTarih(tekrar.bitis) : "";
  const son = bitis && bitis < bugun ? bitis : bugun;
  let guvenlik = 0;

  if (tekrar.periyot === "haftalik") {
    const hedefGun = Math.min(Math.max(parseInt(tekrar.gun, 10) || 1, 0), 6);
    let t = baslangic;
    // Başlangıçtan sonraki ilk hedef güne kay
    while (tarihNesnesi(t).getDay() !== hedefGun && guvenlik++ < 7) t = gunEkle(t, 1);
    guvenlik = 0;
    while (t <= son && guvenlik++ < 520) { tarihler.push(t); t = gunEkle(t, 7); }
    return tarihler;
  }

  if (tekrar.periyot === "yillik") {
    const p = String(tekrar.gun || "01-01").split("-");
    const ay = Math.min(Math.max(parseInt(p[0], 10) || 1, 1), 12);
    const gun = Math.min(Math.max(parseInt(p[1], 10) || 1, 1), 28);
    let yil = parseInt(baslangic.slice(0, 4), 10);
    while (guvenlik++ < 60) {
      const t = yil + "-" + String(ay).padStart(2, "0") + "-" + String(gun).padStart(2, "0");
      if (t > son) break;
      if (t >= baslangic) tarihler.push(t);
      yil++;
    }
    return tarihler;
  }

  // aylık
  let anahtar = baslangic.slice(0, 7);
  while (guvenlik++ < 240) {
    const yil = parseInt(anahtar.slice(0, 4), 10);
    const ay0 = parseInt(anahtar.slice(5, 7), 10) - 1;
    const gun = Math.min(Math.max(parseInt(tekrar.gun, 10) || 1, 1), ayGunSayisi(yil, ay0));
    const t = anahtar + "-" + String(gun).padStart(2, "0");
    if (t > son) break;
    if (t >= baslangic) tarihler.push(t);
    anahtar = ayEkle(anahtar, 1);
  }
  return tarihler;
}

// Eksik tekrar kayıtlarını üretir. Gelecek tarihli kayıt üretilmez;
// daha önce üretilmiş (veya kullanıcı silmiş olsa da id'si duran) kayıt tekrarlanmaz.
export function tekrarlarıUret(tekrarlar, mevcutIslemler, referans) {
  const bugun = referans || bugunIso();
  const varOlan = new Set((mevcutIslemler || []).map(function (k) { return String(k.id); }));
  const yeniler = [];
  (tekrarlar || []).forEach(function (t) {
    if (!t || t.aktif === false) return;
    const tutar = Number(t.tutar) || 0;
    if (tutar <= 0) return;
    tekrarTarihleri(t, bugun).forEach(function (tarih) {
      const id = tekrarlayanKayitId(t, tarih);
      if (varOlan.has(id)) return;
      yeniler.push(islemNormalize({
        id: id,
        tip: t.tip === "gelir" ? "gelir" : "gider",
        tarih: tarih,
        tutar: tutar,
        kategoriId: t.kategoriId,
        hesapId: t.hesapId,
        aciklama: (t.ad || "Tekrarlayan") + " — " + ayEtiket(tarih.slice(0, 7)),
        kaynak: "tekrar",
        girisZamani: new Date().toLocaleString("tr-TR"),
      }));
    });
  });
  return yeniler;
}

// ── Dışa aktarma ─────────────────────────────────────────────

function csvHucre(deger) {
  const s = deger === undefined || deger === null ? "" : String(deger);
  return /[";\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

// Excel'in Türkçe yerel ayarıyla sorunsuz açılması için ; ayırıcı ve BOM.
export function csvUret(satirlar) {
  return "﻿" + satirlar.map(function (s) { return s.map(csvHucre).join(";"); }).join("\r\n");
}

export function islemCsvSatirlari(islemler, kategoriAdi, hesapAdi) {
  const satirlar = [["Tarih", "Gün", "Tür", "Kategori", "Hesap", "Açıklama", "Kişi/Firma", "Belge No", "Gelir", "Gider", "KDV %", "Durum"]];
  (islemler || []).forEach(function (k) {
    satirlar.push([
      trTarih(k.tarih), gunAdi(k.tarih),
      k.tip === "gelir" ? "Gelir" : k.tip === "gider" ? "Gider" : "Transfer",
      k.tip === "transfer" ? "" : kategoriAdi(k.kategoriId),
      hesapAdi(k.hesapId) + (k.tip === "transfer" ? " → " + hesapAdi(k.hedefHesapId) : ""),
      k.aciklama, k.kisi, k.belgeNo,
      k.tip === "gelir" && !k.iptal ? String(k.tutar).replace(".", ",") : "",
      k.tip === "gider" && !k.iptal ? String(k.tutar).replace(".", ",") : "",
      k.kdvOran || "",
      k.iptal ? "İPTAL" : "Geçerli",
    ]);
  });
  const t = toplamlar(islemler);
  satirlar.push([]);
  satirlar.push(["TOPLAM", "", "", "", "", "", "", "", String(t.gelir).replace(".", ","), String(t.gider).replace(".", ","), "", ""]);
  satirlar.push(["NET", "", "", "", "", "", "", "", String(t.net).replace(".", ","), "", "", yuzdeYaz(t.marj)]);
  return satirlar;
}

export function yillikCsvSatirlari(islemler, yil) {
  const satirlar = [[yil + " YILI KÂR / ZARAR"], [], ["Ay", "Gelir", "Gider", "Net", "Marj %"]];
  let gelir = 0, gider = 0;
  yillikTablo(islemler, yil).forEach(function (s) {
    satirlar.push([s.etiket, String(s.gelir).replace(".", ","), String(s.gider).replace(".", ","), String(s.net).replace(".", ","), s.marj.toFixed(1).replace(".", ",")]);
    gelir += s.gelir; gider += s.gider;
  });
  satirlar.push([]);
  satirlar.push(["TOPLAM", String(gelir).replace(".", ","), String(gider).replace(".", ","), String(gelir - gider).replace(".", ","),
    (gelir > 0 ? ((gelir - gider) / gelir * 100).toFixed(1) : "0").replace(".", ",")]);
  return satirlar;
}
