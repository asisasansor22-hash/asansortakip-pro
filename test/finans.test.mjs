// Gelir-gider motoru testleri —  çalıştırma: npm test
import assert from 'node:assert/strict';
import {
  isoTarih, trTarih, donemAralik, aralikGunSayisi,
  kaynaklariBirlestir, sabitGiderleriUret, defteriNormalize,
  suz, toplamlar, kategoriDagilimi, aylikSeri, yillikTablo,
  gunlereGrupla, tahsilatDurumu, excelHareketSatirlari,
  giderKategoriTahmin, yuzdeYaz, paraYaz,
} from '../src/utils/finans.js';

let gecen = 0;
function test(ad, fn) {
  try { fn(); gecen++; console.log("  ✓ " + ad); }
  catch (e) { console.error("  ✗ " + ad + "\n    " + e.message); process.exitCode = 1; }
}

console.log("\nTarih yardımcıları");
test("tr ve iso tarihleri normalleştirir", function () {
  assert.equal(isoTarih("31.07.2026"), "2026-07-31");
  assert.equal(isoTarih("1.7.2026"), "2026-07-01");
  assert.equal(isoTarih("2026-07-31"), "2026-07-31");
  assert.equal(isoTarih(""), "");
  assert.equal(trTarih("2026-07-31"), "31.07.2026");
});

console.log("\nDönem aralıkları");
test("hafta pazartesi başlar pazar biter", function () {
  const a = donemAralik("hafta", "2026-07-29"); // Çarşamba
  assert.equal(a.bas, "2026-07-27");
  assert.equal(a.bit, "2026-08-02");
  assert.equal(aralikGunSayisi(a.bas, a.bit), 7);
});
test("pazar günü içinde bulunduğu haftaya düşer", function () {
  const a = donemAralik("hafta", "2026-08-02");
  assert.equal(a.bas, "2026-07-27");
  assert.equal(a.bit, "2026-08-02");
});
test("ay ve geçen ay sınırları doğru", function () {
  assert.deepEqual(donemAralik("ay", "2026-02-10").bas, "2026-02-01");
  assert.equal(donemAralik("ay", "2026-02-10").bit, "2026-02-28");
  assert.equal(donemAralik("gecenAy", "2026-01-15").bas, "2025-12-01");
  assert.equal(donemAralik("gecenAy", "2026-01-15").bit, "2025-12-31");
});
test("özel aralık ters girilse de düzeltilir", function () {
  const a = donemAralik("ozel", "2026-07-29", { bas: "2026-07-20", bit: "2026-07-10" });
  assert.equal(a.bas, "2026-07-10");
  assert.equal(a.bit, "2026-07-20");
});

console.log("\nKaynak aynalama");
const odemeler = [
  { id: 101, tarih: "2026-07-20", saat: "14:30", binaAd: "Yıldız Apt", ilce: "Kadıköy", alinanTutar: 2500, not: "Bakım sonrası tahsilat", aid: 7 },
  { id: 102, tarih: "2026-07-21", saat: "10:00", binaAd: "Mavi Sitesi", ilce: "Ataşehir", alinanTutar: 1800, not: "", aid: 9 },
];
const giderler = [{ id: 201, tarih: "20.07.2026", aciklama: "Fren balatası", tutar: 750, girisZamani: "20.07.2026 15:00" }];
const ekstra = [
  { id: 301, tarih: "2026-07-22", binaAd: "Yıldız Apt", binaId: 7, isAdi: "Buton değişimi", tutar: 900, odendi: true },
  { id: 302, tarih: "2026-07-23", binaAd: "Mavi Sitesi", binaId: 9, isAdi: "Kapı ayarı", tutar: 400, odendi: false },
];

test("tahsilat, gider ve ödenmiş ekstra iş deftere aktarılır", function () {
  const s = kaynaklariBirlestir([], { odemeler, giderler, ekstraIsler: ekstra });
  assert.equal(s.degisti, true);
  assert.equal(s.kayitlar.length, 4); // 302 ödenmediği için alınmaz
  const t = toplamlar(s.kayitlar);
  assert.equal(t.gelir, 2500 + 1800 + 900);
  assert.equal(t.gider, 750);
  assert.equal(t.net, 4450);
});

test("ödenmemiş ekstra iş çift sayılmaz", function () {
  const s = kaynaklariBirlestir([], { ekstraIsler: ekstra });
  assert.equal(s.kayitlar.length, 1);
  assert.equal(s.kayitlar[0].id, "e-301");
});

test("aynı kayıt ikinci geçişte tekrar eklenmez", function () {
  const ilk = kaynaklariBirlestir([], { odemeler, giderler, ekstraIsler: ekstra });
  const ikinci = kaynaklariBirlestir(ilk.kayitlar, { odemeler, giderler, ekstraIsler: ekstra });
  assert.equal(ikinci.degisti, false);
  assert.equal(ikinci.kayitlar.length, 4);
});

test("arşive taşınan tahsilat kopyası çift kayıt üretmez", function () {
  const ilk = kaynaklariBirlestir([], { odemeler });
  // Ödemeler arşive alındı: canlı liste boşaldı, snapshot'ta duruyor
  const ikinci = kaynaklariBirlestir(ilk.kayitlar, { odemeler: [], odemeArsivleri: [odemeler] });
  assert.equal(ikinci.degisti, false);
  assert.equal(ikinci.kayitlar.length, 2);
});

test("haftalık sıfırlanan gider defteri kalıcı deftere korunur", function () {
  const ilk = kaynaklariBirlestir([], { giderler });
  const ikinci = kaynaklariBirlestir(ilk.kayitlar, { giderler: [], giderArsivleri: [giderler] });
  assert.equal(ikinci.kayitlar.length, 1);
  assert.equal(toplamlar(ikinci.kayitlar).gider, 750);
});

test("kaynaktaki iptal deftere yansır ve toplamdan düşer", function () {
  const ilk = kaynaklariBirlestir([], { odemeler });
  const iptalli = [Object.assign({}, odemeler[0], { iptal: true }), odemeler[1]];
  const ikinci = kaynaklariBirlestir(ilk.kayitlar, { odemeler: iptalli });
  assert.equal(ikinci.degisti, true);
  assert.equal(toplamlar(ikinci.kayitlar).gelir, 1800);
});

test("elle düzenlenen kategori kaynak tazelemesinde korunur", function () {
  const ilk = kaynaklariBirlestir([], { odemeler });
  const duzenli = ilk.kayitlar.map(function (k) {
    return k.id === "t-101" ? Object.assign({}, k, { kategori: "montaj", aciklama: "Revizyon ara ödemesi", duzenlendi: true }) : k;
  });
  const zamli = [Object.assign({}, odemeler[0], { alinanTutar: 3000 }), odemeler[1]];
  const s = kaynaklariBirlestir(duzenli, { odemeler: zamli });
  const kayit = s.kayitlar.find(function (k) { return k.id === "t-101"; });
  assert.equal(kayit.kategori, "montaj");            // kullanıcı seçimi korundu
  assert.equal(kayit.aciklama, "Revizyon ara ödemesi");
  assert.equal(kayit.tutar, 3000);                    // tutar kaynaktan tazelendi
});

test("tutarsız/sıfır kayıtlar aktarılmaz", function () {
  const s = kaynaklariBirlestir([], { odemeler: [{ id: 1, tarih: "2026-07-01", alinanTutar: 0 }], giderler: [{ id: 2, tarih: "2026-07-01", tutar: 0 }] });
  assert.equal(s.kayitlar.length, 0);
});

console.log("\nKategori tahmini ve biçimlendirme");
test("eski gider açıklamalarından kategori tahmin edilir", function () {
  assert.equal(giderKategoriTahmin("Motorin"), "yakit");
  assert.equal(giderKategoriTahmin("MAZOT alındı"), "yakit");
  assert.equal(giderKategoriTahmin("Fren balatası (2 adet)"), "yedek_parca");
  assert.equal(giderKategoriTahmin("Ahmet ustaya avans"), "maas");
  assert.equal(giderKategoriTahmin("SGK primi"), "sgk_vergi");
  assert.equal(giderKategoriTahmin("Ofis kirası"), "kira");
  assert.equal(giderKategoriTahmin("öğle yemeği"), "yemek");
  assert.equal(giderKategoriTahmin("çeşitli"), "diger_gider");
  assert.equal(giderKategoriTahmin(""), "diger_gider");
});
test("tahmin edilen kategori aynalanan gider kaydına yazılır", function () {
  const s = kaynaklariBirlestir([], { giderler: [{ id: 9, tarih: "2026-07-01", aciklama: "Motorin", tutar: 100 }] });
  assert.equal(s.kayitlar[0].kategori, "yakit");
});
test("para ve yüzde Türkçe biçimlenir", function () {
  assert.equal(paraYaz(1250.5), "1.250,5 ₺");
  assert.equal(paraYaz(-42000), "-42.000 ₺");
  assert.equal(yuzdeYaz(57.34), "%57,3");
  assert.equal(yuzdeYaz(57.34, 0), "%57");
});

console.log("\nSabit giderler");
const sabit = [{ id: 55, ad: "Ofis kirası", tutar: 12000, kategori: "kira", gun: 5, baslangic: "2026-05", bitis: "", aktif: true }];

test("başlangıçtan bugüne eksik aylar üretilir, gelecek ay üretilmez", function () {
  const uretilen = sabitGiderleriUret(sabit, [], "2026-07-29");
  assert.equal(uretilen.length, 3); // Mayıs, Haziran, Temmuz
  assert.deepEqual(uretilen.map(function (k) { return k.tarih; }), ["2026-05-05", "2026-06-05", "2026-07-05"]);
  assert.equal(uretilen[0].kaynak, "sabit");
  assert.equal(uretilen[0].tutar, 12000);
});

test("ayın günü henüz gelmediyse o ay üretilmez", function () {
  const uretilen = sabitGiderleriUret(sabit, [], "2026-07-03");
  assert.deepEqual(uretilen.map(function (k) { return k.tarih; }), ["2026-05-05", "2026-06-05"]);
});

test("üretilmiş aylar tekrar üretilmez", function () {
  const ilk = sabitGiderleriUret(sabit, [], "2026-07-29");
  const ikinci = sabitGiderleriUret(sabit, ilk, "2026-07-29");
  assert.equal(ikinci.length, 0);
});

test("bitiş ayı ve pasiflik dikkate alınır", function () {
  const biten = [Object.assign({}, sabit[0], { bitis: "2026-06" })];
  assert.equal(sabitGiderleriUret(biten, [], "2026-07-29").length, 2);
  const pasif = [Object.assign({}, sabit[0], { aktif: false })];
  assert.equal(sabitGiderleriUret(pasif, [], "2026-07-29").length, 0);
});

test("kısa aylarda gün taşması engellenir", function () {
  const s = [{ id: 9, ad: "SGK", tutar: 5000, kategori: "sgk_vergi", gun: 31, baslangic: "2026-02", aktif: true }];
  const uretilen = sabitGiderleriUret(s, [], "2026-03-31");
  assert.equal(uretilen[0].tarih, "2026-02-28");
});

console.log("\nSüzme ve toplamlar");
const defter = defteriNormalize([
  { id: "m-1", tip: "gelir", tarih: "2026-07-05", tutar: 1000, kategori: "bakim", yontem: "nakit", aciklama: "Temmuz bakım" },
  { id: "m-2", tip: "gelir", tarih: "2026-07-15", tutar: 2000, kategori: "montaj", yontem: "havale", aciklama: "Revizyon" },
  { id: "m-3", tip: "gider", tarih: "2026-07-15", tutar: 500, kategori: "yakit", yontem: "kart", aciklama: "Motorin" },
  { id: "m-4", tip: "gider", tarih: "2026-06-10", tutar: 800, kategori: "kira", yontem: "havale", aciklama: "Haziran kira" },
  { id: "m-5", tip: "gelir", tarih: "2026-07-20", tutar: 400, kategori: "bakim", yontem: "nakit", aciklama: "İptal edilen", iptal: true },
]);

test("iptalli kayıt toplamlara girmez", function () {
  const t = toplamlar(defter);
  assert.equal(t.gelir, 3000);
  assert.equal(t.gider, 1300);
  assert.equal(t.net, 1700);
  assert.equal(Math.round(t.marj), 57);
  assert.equal(t.adet, 4);
});

test("tarih aralığı süzmesi kapsayıcıdır", function () {
  const temmuz = suz(defter, { bas: "2026-07-01", bit: "2026-07-31" });
  assert.equal(temmuz.length, 3); // iptalli hariç
  assert.equal(toplamlar(temmuz).gider, 500);
});

test("tip, kategori, yöntem ve arama süzgeçleri", function () {
  assert.equal(suz(defter, { tip: "gider" }).length, 2);
  assert.equal(suz(defter, { kategori: "bakim" }).length, 1);
  assert.equal(suz(defter, { yontem: "havale" }).length, 2);
  assert.equal(suz(defter, { arama: "revizyon" }).length, 1);
  assert.equal(suz(defter, { arama: "MOTORİN" }).length, 1);
  assert.equal(suz(defter, { iptalleriGoster: true }).length, 5);
});

test("kategori dağılımı yüzdeleri toplamı 100", function () {
  const d = kategoriDagilimi(defter, "gelir");
  assert.equal(d.length, 2);
  assert.equal(d[0].id, "montaj"); // büyükten küçüğe
  assert.equal(Math.round(d.reduce(function (s, x) { return s + x.yuzde; }, 0)), 100);
});

test("aylık seri son 12 ayı kapsar", function () {
  const seri = aylikSeri(defter, 12, "2026-07-29");
  assert.equal(seri.length, 12);
  assert.equal(seri[11].ay, "2026-07");
  assert.equal(seri[11].gelir, 3000);
  assert.equal(seri[11].net, 2500);
  assert.equal(seri[10].gider, 800); // Haziran
});

test("yıllık tablo ay bazında dağıtır", function () {
  const tablo = yillikTablo(defter, 2026);
  assert.equal(tablo.length, 12);
  assert.equal(tablo[6].gelir, 3000); // Temmuz
  assert.equal(tablo[5].gider, 800);  // Haziran
  assert.equal(tablo[0].net, 0);
});

test("günlere gruplama yeniden eskiye sıralar", function () {
  const g = gunlereGrupla(suz(defter, {}));
  assert.equal(g[0].tarih, "2026-07-15");
  assert.equal(g[0].gelir, 2000);
  assert.equal(g[0].gider, 500);
  assert.equal(g[g.length - 1].tarih, "2026-06-10");
});

test("tahsilat durumu hedef ve alacağı hesaplar", function () {
  const elevs = [{ id: 7, ad: "A", aylikUcret: 2000, bakiyeDevir: 500 }, { id: 9, ad: "B", aylikUcret: 1500, bakiyeDevir: -200 }];
  const d = tahsilatDurumu(defter, elevs, "2026-07-29");
  assert.equal(d.hedef, 3500);
  assert.equal(d.tahsil, 1000); // yalnızca "bakim" kategorisi, iptalli hariç
  assert.equal(d.kalan, 2500);
  assert.equal(d.alacak, 500);  // negatif devir alacak sayılmaz
});

test("excel satırları başlık ve toplam içerir", function () {
  const satirlar = excelHareketSatirlari(suz(defter, {}), { donem: "Temmuz 2026" });
  assert.equal(satirlar[0][0], "GELİR-GİDER DEFTERİ");
  const toplam = satirlar[satirlar.length - 2];
  assert.equal(toplam[0], "TOPLAM");
  assert.equal(toplam[9], 3000);
  assert.equal(toplam[10], 1300);
  assert.equal(satirlar[satirlar.length - 1][9], 1700);
});

console.log("\n" + gecen + " test geçti" + (process.exitCode ? " — hatalar var" : "") + "\n");
