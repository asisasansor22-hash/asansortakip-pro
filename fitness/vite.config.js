import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { readFileSync, writeFileSync } from 'fs'
import path from 'path'

// Her build'de değişen sürüm kimliği — otomatik güncelleme tespiti için.
const BUILD_ID = String(Date.now())

// public/sw.js aynen kopyalanır ve içerik hash'lerini (index-a1b2c3.js) bilemez.
// Bu eklenti, derleme bittikten sonra dist/sw.js içindeki yer tutucuları gerçek
// dosya listesiyle doldurur ve dist/version.json'ı yazar.
//
// Önbelleğe alınacak liste dist/index.html'den okunur: tarayıcının açılış için
// ihtiyaç duyduğu şey tanımı gereği orada yazar. Böylece tembel yüklenen
// yığınlar (barkod tarayıcının ~443 KB'lık zxing paketleri) kendiliğinden
// dışarıda kalır — izin/yasak listesi tutmaya gerek yok, yığınlama değişse
// bile doğru kalır.
function pwaAssets() {
  let outDir = 'dist'
  return {
    name: 'pwa-assets',
    configResolved(c) { outDir = path.resolve(c.root || process.cwd(), c.build.outDir) },
    closeBundle() {
      // BİLEREK try/catch YOK. Sessizce boş bir önbellek listesi ya da eksik
      // version.json üretmek, bir daha asla güncellenemeyen bir uygulama
      // yayınlamak demektir — bunu üretimde değil, burada öğrenmek gerekir.
      const p = (f) => path.join(outDir, f)

      const html = readFileSync(p('index.html'), 'utf8')
      const assets = [...html.matchAll(/(?:src|href)="(\/assets\/[^"]+)"/g)].map((m) => m[1])
      if (!assets.length) throw new Error('pwa-assets: index.html içinde /assets/ bağlantısı bulunamadı')

      // "/" YOK: index.html ile aynı bayt akışı, iki kez indirilmesin.
      // "/version.json" YOK: güncelleme sinyali, asla önbelleğe alınmamalı.
      const SHELL = [
        ...assets,
        '/index.html',
        '/manifest.webmanifest',
        '/pwa-192.png',
        '/pwa-512.png',
        '/apple-touch-icon.png',
      ]

      const swPath = p('sw.js')
      let sw = readFileSync(swPath, 'utf8')
      if (!sw.includes('/*__SHELL__*/') || !sw.includes('/*__BUILD_ID__*/')) {
        throw new Error('pwa-assets: sw.js içinde yer tutucular bulunamadı')
      }
      sw = sw
        .replace('/*__SHELL__*/[]', JSON.stringify(SHELL))
        .replace('/*__BUILD_ID__*/""', JSON.stringify(BUILD_ID))
      writeFileSync(swPath, sw)

      writeFileSync(p('version.json'), JSON.stringify({ v: BUILD_ID }))
    },
  }
}

export default defineConfig({
  define: { __BUILD_ID__: JSON.stringify(BUILD_ID) },
  plugins: [react(), pwaAssets()],
})
