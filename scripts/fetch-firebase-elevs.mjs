/**
 * Firebase'den güncel at_elevs verisini çekip elevators.js'i günceller.
 * Kullanım (proje kökünden):
 *   export FIREBASE_EMAIL=berat@asisasansor.com
 *   export FIREBASE_PASSWORD=sifreniz
 *   node scripts/fetch-firebase-elevs.mjs
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const ELEVATORS_FILE = path.join(ROOT, "src/data/elevators.js");

const FIREBASE_API_KEY = "AIzaSyAWU95hhLKUKc_bTX5fqlLjDyPtOJ8w5r4";
const FIREBASE_DB_URL = "https://asansortakipv3-default-rtdb.europe-west1.firebasedatabase.app";

const EMAIL = process.env.FIREBASE_EMAIL;
const PASSWORD = process.env.FIREBASE_PASSWORD;

if (!EMAIL || !PASSWORD) {
  console.error("Hata: FIREBASE_EMAIL ve FIREBASE_PASSWORD tanımlı değil.");
  console.error("  export FIREBASE_EMAIL=berat@asisasansor.com");
  console.error("  export FIREBASE_PASSWORD=sifreniz");
  process.exit(1);
}

// 1. Firebase Auth ile token al
console.log("Firebase'e giriş yapılıyor...");
const authRes = await fetch(
  `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`,
  {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD, returnSecureToken: true }),
  }
);

if (!authRes.ok) {
  const err = await authRes.json();
  console.error("Giriş başarısız:", err?.error?.message || authRes.status);
  process.exit(1);
}

const { idToken } = await authRes.json();
console.log("✓ Giriş başarılı.");

// 2. at_elevs verisini çek
console.log("Asansör listesi çekiliyor...");
const dbRes = await fetch(
  `${FIREBASE_DB_URL}/asansor/at_elevs.json?auth=${idToken}`
);

if (!dbRes.ok) {
  console.error("Veritabanı okuma hatası:", dbRes.status);
  process.exit(1);
}

const data = await dbRes.json();
if (!data) {
  console.error("at_elevs verisi boş döndü.");
  process.exit(1);
}

// Firebase'den gelen veri array veya object olabilir
const elevators = Array.isArray(data) ? data.filter(Boolean) : Object.values(data).filter(Boolean);
console.log(`✓ ${elevators.length} asansör çekildi.`);

// ID'ye göre sırala
elevators.sort((a, b) => (a.id || 0) - (b.id || 0));

// 3. elevators.js'i güncelle
const existingSrc = fs.readFileSync(ELEVATORS_FILE, "utf8");
const newContent = existingSrc.replace(
  /export const EXCEL_ELEVS = \[[\s\S]*?\];/,
  `export const EXCEL_ELEVS = ${JSON.stringify(elevators)};`
);

fs.writeFileSync(ELEVATORS_FILE, newContent, "utf8");
console.log(`✓ src/data/elevators.js güncellendi (${elevators.length} asansör).`);
console.log("Son 5 asansör:", elevators.slice(-5).map(e => `#${e.id} ${e.ad}`).join(", "));
