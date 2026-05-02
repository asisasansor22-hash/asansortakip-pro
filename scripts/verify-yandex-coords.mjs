#!/usr/bin/env node
// 185 asansörün Firebase'deki koordinatlarını Yandex Geocoder ile doğrular.
//
// Kullanım:
//   YANDEX_API_KEY=xxxxxxxx node scripts/verify-yandex-coords.mjs \
//     --input=./elevs-slim.json --output=./verify-report.json
//
// Yandex Geocoder API key alma: https://developer.tech.yandex.ru/services/
// (HTTP Geocoder seçin — JS API anahtarı değil)

import fs from "node:fs";
import path from "node:path";

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, "").split("=");
    return [k, v ?? true];
  })
);

const API_KEY = process.env.YANDEX_API_KEY;
if (!API_KEY) {
  console.error("HATA: YANDEX_API_KEY environment variable gerekli.");
  process.exit(1);
}

const INPUT = args.input || "./elevs-slim.json";
const OUTPUT = args.output || "./verify-report.json";
const SLEEP_MS = Number(args.sleep || 250); // rate limit (Yandex free: 25k/gün, ~10 req/sn)
const THRESHOLD_M = Number(args.threshold || 200); // sapma uyarı eşiği (metre)

const elevs = JSON.parse(fs.readFileSync(INPUT, "utf8"));
console.log(`Yüklendi: ${elevs.length} kayıt`);

// Haversine — iki koordinat arası metre cinsinden mesafe
function distanceMeters(a, b) {
  const R = 6371000;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}

function buildQuery(e) {
  // İl + ilçe + semt + adres birleşik sorgu
  const parts = ["İstanbul", e.ilce, e.semt, e.adres].filter(Boolean);
  return parts.join(", ");
}

async function geocode(query) {
  const url = new URL("https://geocode-maps.yandex.ru/1.x/");
  url.searchParams.set("apikey", API_KEY);
  url.searchParams.set("geocode", query);
  url.searchParams.set("format", "json");
  url.searchParams.set("lang", "tr_TR");
  url.searchParams.set("results", "1");
  url.searchParams.set("bbox", "28.0,40.8~30.0,41.4"); // İstanbul bbox — sapmaları azaltır
  url.searchParams.set("rspn", "1");

  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
  const data = await res.json();
  const member =
    data?.response?.GeoObjectCollection?.featureMember?.[0]?.GeoObject;
  if (!member) return null;
  const [lng, lat] = member.Point.pos.split(" ").map(Number);
  const meta = member.metaDataProperty?.GeocoderMetaData || {};
  return {
    lat,
    lng,
    yandexAddress: meta.text,
    precision: meta.precision, // exact, number, near, range, street, other
    kind: meta.kind, // house, street, locality, ...
  };
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const report = [];
let i = 0;
for (const e of elevs) {
  i++;
  const query = buildQuery(e);
  const current = { lat: e.lat, lng: e.lng };
  let yandex = null;
  let error = null;
  try {
    yandex = await geocode(query);
  } catch (err) {
    error = err.message;
  }

  const row = {
    id: e.id,
    ad: e.ad,
    ilce: e.ilce,
    semt: e.semt,
    adres: e.adres,
    current,
    query,
    yandex,
    error,
    distanceM: yandex ? Math.round(distanceMeters(current, yandex)) : null,
  };
  row.flag =
    error
      ? "error"
      : !yandex
      ? "no-result"
      : yandex.precision === "exact"
      ? row.distanceM > THRESHOLD_M
        ? "mismatch-exact"
        : "ok-exact"
      : yandex.precision === "number"
      ? row.distanceM > THRESHOLD_M
        ? "mismatch-number"
        : "ok-number"
      : "low-precision";

  report.push(row);
  if (i % 10 === 0 || i === elevs.length) {
    console.log(
      `[${i}/${elevs.length}] id=${e.id} ${e.ad} → ${row.flag} ${
        row.distanceM ?? "-"
      }m`
    );
  }
  await sleep(SLEEP_MS);
}

fs.writeFileSync(OUTPUT, JSON.stringify(report, null, 2));

// Özet
const summary = report.reduce((acc, r) => {
  acc[r.flag] = (acc[r.flag] || 0) + 1;
  return acc;
}, {});
console.log("\n=== ÖZET ===");
for (const [k, v] of Object.entries(summary).sort()) {
  console.log(`  ${k}: ${v}`);
}
console.log(`\nRapor yazıldı: ${path.resolve(OUTPUT)}`);
console.log(
  `Sapma >${THRESHOLD_M}m olanları gözden geçirin (mismatch-* etiketli).`
);
