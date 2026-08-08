// Beslenme gunlugu: cevrimdisi dayaniklilik.
//
// Bu dosyanin varlik sebebi: gunluk YALNIZCA bulutta duruyordu. Cevrimdisiyken
// bos aciliyor, girilen ogunler hicbir yere yazilmiyordu. Uygulamanin geri
// kalani (antrenman, program, olcum) cevrimdisi calisirken yenen yemek
// kayboluyordu.

import { mergeDiary } from "../src/data/merge.js";

let fail = 0;
const ok = (n, c, x = "") => { console.log((c ? "  ok  " : "  FAIL") + "  " + n + (c ? "" : "  " + x)); if (!c) fail++; };

const gun = "2026-08-08";
const D = (items, water = 0, extra = {}) => ({ goal: { kcal: 0, protein: 0 }, days: { [gun]: { items, water } }, recent: [], ...extra });
const adlar = (m, g = gun) => (m.days[g].items || []).map((i) => i.name).sort();

// --- Temel: iki taraftaki ogunler BIRLESIR ---
const m1 = mergeDiary(D([{ id: "a", name: "Yumurta" }]), D([{ id: "b", name: "Tavuk" }]));
ok("cevrimdisi eklenen ogun bulutunkiyle birlesiyor",
   adlar(m1).join(",") === "Tavuk,Yumurta", adlar(m1).join(","));

// --- Ayni ogen iki kez sayilmamali (id'ye gore tekil) ---
const ayni = { id: "x", name: "Muz", kcal: 90 };
ok("ayni oge iki kez sayilmiyor", mergeDiary(D([ayni]), D([ayni])).days[gun].items.length === 1);

// --- Bulutta olan BASKA gunler korunmali ---
const m2 = mergeDiary(D([{ id: "a", name: "Yumurta" }]),
  { days: { "2026-08-07": { items: [{ id: "c", name: "Pilav" }], water: 2 } } });
ok("buluttaki onceki gunler silinmiyor", !!m2.days["2026-08-07"], JSON.stringify(Object.keys(m2.days)));

// --- Su sayaci: buyuk olan kazanir (sayac yalniz artar) ---
ok("su sayaci: buyuk olan secilir", mergeDiary(D([], 3), D([], 5)).days[gun].water === 5);
ok("su sayaci: yerel buyukse yerel", mergeDiary(D([], 8), D([], 5)).days[gun].water === 8);

// --- Hedef: yerelde anlamli deger varsa o kazanir ---
ok("hedef yerelden gelir", mergeDiary(D([], 0, { goal: { kcal: 2500, protein: 180 } }), D([], 0, { goal: { kcal: 2000, protein: 100 } })).goal.kcal === 2500);
ok("yerel hedef bossa buluttan alinir", mergeDiary(D([]), D([], 0, { goal: { kcal: 2000, protein: 100 } })).goal.kcal === 2000);

// --- Bos/bozuk girdi cokmemeli ---
const bos = mergeDiary(null, null);
ok("null girdi guvenli", bos && bos.goal && bos.days && Array.isArray(bos.recent), JSON.stringify(bos));
ok("undefined girdi guvenli", !!mergeDiary(undefined, { days: null }));
// Firebase bos diziyi obje olarak saklar
ok("obje-bicimli items dizi gibi okunuyor",
   mergeDiary({ days: { [gun]: { items: { "0": { id: "a", name: "Yumurta" } } } } }, {}).days[gun].items.length === 1);

// --- recent: tekil ve sinirli ---
const cokRecent = { days: {}, recent: Array.from({ length: 30 }, (_, i) => ({ name: "y" + i })) };
ok("recent 20 ile sinirli", mergeDiary(cokRecent, cokRecent).recent.length === 20);
ok("recent ada gore tekil",
   mergeDiary({ days: {}, recent: [{ name: "Muz" }] }, { days: {}, recent: [{ name: "Muz" }] }).recent.length === 1);

// --- ONEMLI: birlestirme kaybetmemeli (yon bagimsiz) ---
const A = D([{ id: "a", name: "A" }], 2), B = D([{ id: "b", name: "B" }], 4);
ok("birlestirme yon bagimsiz (ogun kumesi)",
   adlar(mergeDiary(A, B)).join(",") === adlar(mergeDiary(B, A)).join(","));

console.log(fail ? "\n" + fail + " TEST BASARISIZ" : "\nhepsi gecti");
if (fail) process.exit(1);
