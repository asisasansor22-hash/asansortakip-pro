// PWA simgelerini public/simge.svg dosyasından üretir: npm run simgeler
// Simge tasarımı değişirse bu betiği yeniden çalıştırıp çıktıları işlemek yeterli.

import sharp from "sharp";
import { readFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const burada = path.dirname(fileURLToPath(import.meta.url));
const kaynak = readFileSync(path.join(burada, "..", "public", "simge.svg"));
const cikti = path.join(burada, "..", "public");

const boyutlar = [
  { ad: "pwa-192.png", en: 192 },
  { ad: "pwa-512.png", en: 512 },
  { ad: "apple-touch-icon.png", en: 180 },
];

for (const b of boyutlar) {
  await sharp(kaynak, { density: 384 }).resize(b.en, b.en).png().toFile(path.join(cikti, b.ad));
  console.log("üretildi:", b.ad, b.en + "×" + b.en);
}
