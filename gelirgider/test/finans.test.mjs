// Hesap motoru testleri — çalıştırma: npm test
// Çerçeve yok: motor saf fonksiyonlardan oluşuyor, düz Node yeterli.

import assert from 'node:assert/strict';
import {
  isoTarih, trTarih, sayiOku, paraYaz, yuzdeYaz,
  donemAralik, aralikGunSayisi, gunEkle, ayEkle,
  islemleriNormalize, islemSirala, suz, toplamlar,
  hesapBakiyeleri, toplamVarlik, kategoriDagilimi, aylikSeri, yillikTablo,
  gunlereGrupla, kisiDagilimi, butceDurumu,
  tekrarTarihleri, tekrarlarıUret, csvUret, islemCsvSatirlari,
} from '../src/finans.js';
import { veriNormalize, bosVeri, yedekMetni, yedektenOku } from '../src/depo.js';

let gecen = 0;
function test(ad, fn) {
  try { fn(); gecen++; console.log("  ✓ " + ad); }
  catch (e) { console.error("  ✗ " + ad + "\n    " + e.message); process.exitCode = 1; }
}

const KATEGORILER = [
  { id: "k1", ad: "Satış", tip: "gelir", ikon: "🧾", renk: "#16A34A" },
  { id: "k2", ad: "Kira", tip: "gider", ikon: "🏠", renk: "#5856D6" },
  { id: "k3", ad: "Yakıt", tip: "gider", ikon: "⛽", renk: "#EA580C" },
];
const HESAPLAR = [
  { id: "kasa", ad: "Kasa", tur: "nakit", acilisBakiye: 1000, aktif: true },
  { id: "banka", ad: "Banka", tur: "banka", acilisBakiye: 5000, aktif: true },
];

const ISLEMLER = islemleriNormalize([
  { id: "1", tip: "gelir", tarih: "2026-07-05", tutar: 3000, kategoriId: "k1", hesapId: "kasa", aciklama: "Fatura A", kisi: "Yılmaz Ltd", kdvOran: 20 },
  { id: "2", tip: "gider", tarih: "2026-07-10", tutar: 1200, kategoriId: "k2", hesapId: "banka", aciklama: "Temmuz kirası" },
  { id: "3", tip: "gider", tarih: "2026-07-10", tutar: 400, kategoriId: "k3", hesapId: "kasa", aciklama: "Motorin", kdvOran: 20 },
  { id: "4", tip: "transfer", tarih: "2026-07-12", tutar: 2000, hesapId: "kasa", hedefHesapId: "banka", aciklama: "Bankaya yatırma" },
  { id: "5", tip: "gelir", tarih: "2026-06-20", tutar: 800, kategoriId: "k1", hesapId: "kasa" },
  { id: "6", tip: "gider", tarih: "2026-07-15", tutar: 500, kategoriId: "k3", hesapId: "kasa", iptal: true },
]);

console.log("\nTarih ve sayı");
test("tarih biçimleri normalleşir", function () {
  assert.equal(isoTarih("31.07.2026"), "2026-07-31");
  assert.equal(isoTarih("2026-07-31"), "2026-07-31");
  assert.equal(trTarih("2026-07-31"), "31.07.2026");
  assert.equal(gunEkle("2026-02-28", 1), "2026-03-01");
  assert.equal(ayEkle("2026-01", -1), "2025-12");
});
test("Türkçe biçimli tutarlar okunur", function () {
  assert.equal(sayiOku("1.250,50"), 1250.5);
  assert.equal(sayiOku("1250,5"), 1250.5);
  assert.equal(sayiOku("1250.5"), 1250.5);
  assert.equal(sayiOku("1.250"), 1250);
  assert.equal(sayiOku("12.500.000"), 12500000);
  assert.equal(sayiOku("₺ 2.400,75"), 2400.75);
  assert.equal(sayiOku(""), 0);
  assert.equal(sayiOku("abc"), 0);
});
test("para ve yüzde Türkçe yazılır", function () {
  assert.equal(paraYaz(1250.5), "1.250,5 ₺");
  assert.equal(paraYaz(-4200, "$"), "-4.200 $");
  assert.equal(yuzdeYaz(57.34), "%57,3");
  assert.equal(yuzdeYaz(57.34, 0), "%57");
});

console.log("\nDönemler");
test("hafta pazartesi–pazar", function () {
  const a = donemAralik("hafta", "2026-07-29");
  assert.equal(a.bas, "2026-07-27");
  assert.equal(a.bit, "2026-08-02");
  assert.equal(aralikGunSayisi(a.bas, a.bit), 7);
});
test("pazar günü aynı haftaya düşer", function () {
  assert.equal(donemAralik("hafta", "2026-08-02").bas, "2026-07-27");
});
test("ay ve geçen ay sınırları", function () {
  assert.equal(donemAralik("ay", "2026-02-10").bit, "2026-02-28");
  assert.equal(donemAralik("gecenAy", "2026-01-15").bas, "2025-12-01");
  assert.equal(donemAralik("gecenAy", "2026-01-15").bit, "2025-12-31");
});
test("özel aralık ters girilse düzeltilir", function () {
  const a = donemAralik("ozel", "2026-07-29", { bas: "2026-07-20", bit: "2026-07-10" });
  assert.equal(a.bas, "2026-07-10");
  assert.equal(a.bit, "2026-07-20");
});

console.log("\nToplamlar ve süzme");
test("transfer ve iptal toplamlara girmez", function () {
  const t = toplamlar(suz(ISLEMLER, {}));
  assert.equal(t.gelir, 3800);
  assert.equal(t.gider, 1600);   // iptalli 500 hariç
  assert.equal(t.net, 2200);
  assert.equal(t.transferAdet, 1);
});
test("tarih aralığı kapsayıcı süzer", function () {
  const temmuz = suz(ISLEMLER, { bas: "2026-07-01", bit: "2026-07-31" });
  assert.equal(toplamlar(temmuz).gelir, 3000);
  assert.equal(toplamlar(temmuz).gider, 1600);
});
test("tip, kategori, hesap ve arama süzgeçleri", function () {
  assert.equal(suz(ISLEMLER, { tip: "gider" }).length, 2);
  assert.equal(suz(ISLEMLER, { kategoriId: "k3" }).length, 1);
  assert.equal(suz(ISLEMLER, { hesapId: "banka" }).length, 2); // kira + transferin hedefi
  assert.equal(suz(ISLEMLER, { arama: "motorin" }).length, 1);
  assert.equal(suz(ISLEMLER, { arama: "YILMAZ" }).length, 1);
  assert.equal(suz(ISLEMLER, { iptalleriGoster: true }).length, 6);
  assert.equal(suz(ISLEMLER, { transferGizle: true }).length, 4);
});
test("KDV hesaplanır", function () {
  const t = toplamlar(suz(ISLEMLER, {}));
  assert.equal(Math.round(t.kdvGelir), 500);   // 3000 içinde %20 KDV
  assert.equal(Math.round(t.kdvGider), 67);    // 400 içinde %20 KDV
  assert.equal(Math.round(t.kdvFark), 433);
});

console.log("\nHesap bakiyeleri");
test("gelir, gider ve transfer bakiyeye işler", function () {
  const b = hesapBakiyeleri(HESAPLAR, ISLEMLER);
  const kasa = b.find(function (h) { return h.id === "kasa"; });
  const banka = b.find(function (h) { return h.id === "banka"; });
  // Kasa: 1000 açılış + 3000 gelir + 800 gelir − 400 yakıt − 2000 transfer
  assert.equal(kasa.bakiye, 2400);
  // Banka: 5000 açılış − 1200 kira + 2000 transfer
  assert.equal(banka.bakiye, 5800);
  // İptalli gider hiçbir bakiyeye girmez
  assert.equal(toplamVarlik(HESAPLAR, ISLEMLER), 8200);
});
test("belirli tarihe kadarki bakiye alınabilir", function () {
  const b = hesapBakiyeleri(HESAPLAR, ISLEMLER, "2026-07-05");
  assert.equal(b.find(function (h) { return h.id === "kasa"; }).bakiye, 4800); // 1000 + 800 + 3000
});

console.log("\nDağılım ve seriler");
test("kategori dağılımı sıralı ve yüzdeli", function () {
  const d = kategoriDagilimi(suz(ISLEMLER, {}), "gider", KATEGORILER);
  assert.equal(d[0].ad, "Kira");
  assert.equal(d[0].tutar, 1200);
  assert.equal(Math.round(d.reduce(function (s, x) { return s + x.yuzde; }, 0)), 100);
});
test("aylık seri son 12 ayı kapsar", function () {
  const s = aylikSeri(ISLEMLER, 12, "2026-07-29");
  assert.equal(s.length, 12);
  assert.equal(s[11].ay, "2026-07");
  assert.equal(s[11].gelir, 3000);
  assert.equal(s[11].net, 1400);
  assert.equal(s[10].gelir, 800);
});
test("yıllık tablo aylara dağıtır", function () {
  const t = yillikTablo(ISLEMLER, 2026);
  assert.equal(t[6].gelir, 3000);
  assert.equal(t[5].gelir, 800);
  assert.equal(t[0].net, 0);
});
test("günlere gruplama yeniden eskiye", function () {
  const g = gunlereGrupla(suz(ISLEMLER, {}));
  assert.equal(g[0].tarih, "2026-07-12");
  assert.equal(g[1].tarih, "2026-07-10");
  assert.equal(g[1].gider, 1600);
});
test("kişi dağılımı", function () {
  const k = kisiDagilimi(ISLEMLER);
  assert.equal(k.length, 1);
  assert.equal(k[0].ad, "Yılmaz Ltd");
  assert.equal(k[0].gelir, 3000);
});

console.log("\nBütçe");
test("bütçe durumu ve aşım", function () {
  const b = butceDurumu([{ kategoriId: "k2", aylikLimit: 1000 }, { kategoriId: "k3", aylikLimit: 1000 }], ISLEMLER, "2026-07", KATEGORILER);
  const kira = b.find(function (x) { return x.kategoriId === "k2"; });
  const yakit = b.find(function (x) { return x.kategoriId === "k3"; });
  assert.equal(kira.harcanan, 1200);
  assert.equal(kira.durum, "asildi");
  assert.equal(kira.kalan, -200);
  assert.equal(yakit.harcanan, 400);   // iptalli 500 sayılmaz
  assert.equal(yakit.durum, "iyi");
});
test("limitsiz bütçe satırı gösterilmez", function () {
  assert.equal(butceDurumu([{ kategoriId: "k2", aylikLimit: 0 }], ISLEMLER, "2026-07", KATEGORILER).length, 0);
});

console.log("\nTekrarlayan işlemler");
const AYLIK = { id: "t1", tip: "gider", ad: "Kira", tutar: 12000, kategoriId: "k2", hesapId: "banka", periyot: "aylik", gun: 5, baslangic: "2026-05-01", bitis: "", aktif: true };

test("aylık tekrar geçmiş ayları tamamlar, geleceği üretmez", function () {
  const t = tekrarTarihleri(AYLIK, "2026-07-29");
  assert.deepEqual(t, ["2026-05-05", "2026-06-05", "2026-07-05"]);
  assert.deepEqual(tekrarTarihleri(AYLIK, "2026-07-03"), ["2026-05-05", "2026-06-05"]);
});
test("kısa ayda gün taşması engellenir", function () {
  const t = tekrarTarihleri({ id: "t2", periyot: "aylik", gun: 31, baslangic: "2026-02-01" }, "2026-03-31");
  assert.equal(t[0], "2026-02-28");
});
test("haftalık ve yıllık tekrar", function () {
  const h = tekrarTarihleri({ id: "t3", periyot: "haftalik", gun: 1, baslangic: "2026-07-01" }, "2026-07-29");
  assert.deepEqual(h, ["2026-07-06", "2026-07-13", "2026-07-20", "2026-07-27"]);
  const y = tekrarTarihleri({ id: "t4", periyot: "yillik", gun: "03-15", baslangic: "2024-01-01" }, "2026-07-29");
  assert.deepEqual(y, ["2024-03-15", "2025-03-15", "2026-03-15"]);
});
test("bitiş tarihi ve pasiflik dikkate alınır", function () {
  assert.equal(tekrarTarihleri(Object.assign({}, AYLIK, { bitis: "2026-06-30" }), "2026-07-29").length, 2);
  assert.equal(tekrarlarıUret([Object.assign({}, AYLIK, { aktif: false })], [], "2026-07-29").length, 0);
});
test("üretilen kayıtlar ikinci kez üretilmez", function () {
  const ilk = tekrarlarıUret([AYLIK], [], "2026-07-29");
  assert.equal(ilk.length, 3);
  assert.equal(ilk[0].kaynak, "tekrar");
  assert.equal(ilk[0].tutar, 12000);
  assert.equal(tekrarlarıUret([AYLIK], ilk, "2026-07-29").length, 0);
});

console.log("\nDışa aktarma ve depo");
test("CSV noktalı virgülle ve BOM ile üretilir", function () {
  const csv = csvUret(islemCsvSatirlari(suz(ISLEMLER, {}), function (id) { return (KATEGORILER.find(function (k) { return k.id === id; }) || {}).ad || ""; }, function (id) { return (HESAPLAR.find(function (h) { return h.id === id; }) || {}).ad || ""; }));
  assert.ok(csv.startsWith("﻿"), "BOM ile başlamalı");
  assert.ok(csv.indexOf("Tarih;Gün;Tür") > -1);
  assert.ok(csv.indexOf("Kasa → Banka") > -1, "transfer hesapları yazılmalı");
  assert.ok(csv.indexOf("TOPLAM") > -1);
});
test("noktalı virgül içeren metin tırnaklanır", function () {
  const csv = csvUret([["a;b", "c"]]);
  assert.ok(csv.indexOf('"a;b";c') > -1);
});
test("boş veri iskeleti tutarlı", function () {
  const v = bosVeri();
  assert.ok(v.hesaplar.length >= 1);
  assert.ok(v.kategoriler.some(function (k) { return k.tip === "gelir"; }));
  assert.ok(v.kategoriler.some(function (k) { return k.tip === "gider"; }));
  assert.equal(v.islemler.length, 0);
});
test("bozuk/eksik veri normalleştirilir", function () {
  const v = veriNormalize({ islemler: [{ id: 5, tip: "gelir", tarih: "01.07.2026", tutar: "250" }], hesaplar: null, ayarlar: { tema: "acik" } });
  assert.equal(v.islemler[0].tarih, "2026-07-01");
  assert.equal(v.islemler[0].tutar, 250);
  assert.ok(v.hesaplar.length >= 1, "hesap yoksa varsayılan gelir");
  assert.equal(v.ayarlar.tema, "acik");
  assert.equal(v.ayarlar.paraSimgesi, "₺");
});
test("yedek yazılıp geri okunur", function () {
  const v = bosVeri();
  v.islemler = islemleriNormalize([{ id: "9", tip: "gider", tarih: "2026-07-01", tutar: 99, kategoriId: "gid0", hesapId: "kasa" }]);
  const geri = yedektenOku(yedekMetni(v));
  assert.equal(geri.islemler.length, 1);
  assert.equal(geri.islemler[0].tutar, 99);
});
test("yabancı dosya reddedilir", function () {
  assert.throws(function () { yedektenOku('{"foo":1}'); }, /yedeği değil|tanınmadı/);
});
test("sıralama yeniden eskiye", function () {
  const s = islemSirala(ISLEMLER);
  assert.equal(s[0].tarih, "2026-07-15");
  assert.equal(s[s.length - 1].tarih, "2026-06-20");
});

console.log("\n" + gecen + " test geçti" + (process.exitCode ? " — HATA VAR" : "") + "\n");
