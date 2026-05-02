/**
 * Yandex Geocoder ile 181 asansörün adresini koordinata çevirir.
 * Kullanım: YANDEX_API_KEY=xxx node scripts/geocode-elevators.mjs
 *
 * Çıktı:
 *   - scripts/geocode-results.json  → ham sonuçlar (resume için)
 *   - src/data/elevators.js         → lat/lng eklenmiş final dosya
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const API_KEY = process.env.YANDEX_API_KEY;
if (!API_KEY) {
  console.error("Hata: YANDEX_API_KEY env değişkeni tanımlı değil.");
  console.error("  export YANDEX_API_KEY=senin_apin_buraya");
  process.exit(1);
}

const RESULTS_FILE = path.join(__dirname, "geocode-results.json");
const ELEVATORS_FILE = path.join(ROOT, "src/data/elevators.js");

// İstanbul koordinat sınırları
const IST = { latMin: 40.5, latMax: 41.6, lngMin: 28.0, lngMax: 30.0 };

function isValidIstanbul(lat, lng) {
  return (
    Number.isFinite(lat) && Number.isFinite(lng) &&
    lat >= IST.latMin && lat <= IST.latMax &&
    lng >= IST.lngMin && lng <= IST.lngMax
  );
}

function buildQuery(e) {
  const parts = [];
  if (e.adres && e.adres.trim() && !e.adres.toLowerCase().includes("istanbul")) {
    parts.push(e.adres.trim());
  }
  if (e.semt && e.semt.trim()) parts.push(e.semt.trim());
  if (e.ilce && e.ilce.trim()) parts.push(e.ilce.trim());
  parts.push("İstanbul");
  return parts.join(", ");
}

async function geocode(query) {
  const url = new URL("https://geocode-maps.yandex.ru/1.x/");
  url.searchParams.set("apikey", API_KEY);
  url.searchParams.set("geocode", query);
  url.searchParams.set("format", "json");
  url.searchParams.set("lang", "tr_TR");
  url.searchParams.set("results", "1");
  url.searchParams.set("ll", "28.9784,41.0082"); // İstanbul merkezi
  url.searchParams.set("spn", "1.5,1.0");        // arama alanı (bbox)
  url.searchParams.set("rspn", "1");              // bbox'a kısıtla

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();

  const members = data?.response?.GeoObjectCollection?.featureMember;
  if (!members || members.length === 0) return null;

  const pos = members[0]?.GeoObject?.Point?.pos; // "lng lat"
  if (!pos) return null;

  const [lngStr, latStr] = pos.split(" ");
  const lat = parseFloat(latStr);
  const lng = parseFloat(lngStr);

  if (!isValidIstanbul(lat, lng)) return null;

  const precision = members[0]?.GeoObject?.metaDataProperty?.GeocoderMetaData?.precision;
  return { lat, lng, precision };
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// Asansörleri elevators.js'den oku
const elevSrc = fs.readFileSync(ELEVATORS_FILE, "utf8");
const match = elevSrc.match(/export const EXCEL_ELEVS = (\[[\s\S]*?\]);/);
if (!match) {
  console.error("EXCEL_ELEVS bulunamadı.");
  process.exit(1);
}
const elevators = JSON.parse(match[1]);

// Önceki sonuçları yükle (resume)
let results = {};
if (fs.existsSync(RESULTS_FILE)) {
  results = JSON.parse(fs.readFileSync(RESULTS_FILE, "utf8"));
  console.log(`Resume: ${Object.keys(results).length} önceki sonuç yüklendi.`);
}

const todo = elevators.filter((e) => !(String(e.id) in results));
console.log(`Toplam: ${elevators.length}, Bekleyen: ${todo.length}`);

let ok = 0, fail = 0;

for (let i = 0; i < todo.length; i++) {
  const e = todo[i];
  const query = buildQuery(e);
  process.stdout.write(`[${i + 1}/${todo.length}] #${e.id} ${e.ad} → "${query}" ... `);

  try {
    const coord = await geocode(query);
    if (coord) {
      results[String(e.id)] = { lat: coord.lat, lng: coord.lng, precision: coord.precision };
      process.stdout.write(`✓ ${coord.lat.toFixed(5)}, ${coord.lng.toFixed(5)} (${coord.precision})\n`);
      ok++;
    } else {
      results[String(e.id)] = { lat: null, lng: null, error: "no-result" };
      process.stdout.write(`✗ sonuç yok\n`);
      fail++;
    }
  } catch (err) {
    results[String(e.id)] = { lat: null, lng: null, error: err.message };
    process.stdout.write(`✗ hata: ${err.message}\n`);
    fail++;
  }

  // Her 10 asansörde bir ara kayıt
  if ((i + 1) % 10 === 0) {
    fs.writeFileSync(RESULTS_FILE, JSON.stringify(results, null, 2));
  }

  // Rate limit: 100ms bekleme (saniyede ~10 istek)
  await sleep(100);
}

// Son kayıt
fs.writeFileSync(RESULTS_FILE, JSON.stringify(results, null, 2));
console.log(`\nGeocoding tamamlandı: ${ok} başarılı, ${fail} başarısız`);

// elevators.js'e koordinatları yaz
const updated = elevators.map((e) => {
  const r = results[String(e.id)];
  if (r && r.lat !== null && r.lng !== null) {
    return { ...e, lat: r.lat, lng: r.lng };
  }
  return e;
});

const withCoords = updated.filter((e) => e.lat && e.lng && e.lat !== 0).length;
console.log(`Koordinat yazılacak: ${withCoords}/${elevators.length}`);

// Dosyayı güncelle
const newContent = elevSrc.replace(
  /export const EXCEL_ELEVS = \[[\s\S]*?\];/,
  `export const EXCEL_ELEVS = ${JSON.stringify(updated)};`
);
fs.writeFileSync(ELEVATORS_FILE, newContent, "utf8");
console.log("✓ src/data/elevators.js güncellendi.");

// Başarısızları raporla
const failed = elevators.filter((e) => {
  const r = results[String(e.id)];
  return !r || r.lat === null;
});
if (failed.length > 0) {
  console.log(`\nKoordinat bulunamayan ${failed.length} asansör:`);
  failed.forEach((e) => {
    const r = results[String(e.id)];
    console.log(`  #${e.id} ${e.ad} | ${buildQuery(e)} → ${r?.error || "?"}`);
  });
}
