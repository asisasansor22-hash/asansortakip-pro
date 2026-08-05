import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { readFileSync, writeFileSync } from 'fs'
import path from 'path'

// Her derlemede değişen kimlik: servis çalışanı eski önbelleği bununla atar.
const DERLEME_ID = String(Date.now())

// public/sw.js olduğu gibi kopyalanır ve içerik hash'li dosya adlarını bilemez.
// Bu eklenti, derleme bittikten sonra sw.js içindeki yer tutucuları gerçek
// dosya listesiyle doldurur. Liste dist/index.html'den okunur: açılış için
// gereken dosyalar tanımı gereği orada yazar.
function pwaVarliklari() {
  let cikti = 'dist'
  return {
    name: 'pwa-varliklari',
    configResolved(c) { cikti = path.resolve(c.root || process.cwd(), c.build.outDir) },
    closeBundle() {
      // Bilerek try/catch yok: sessizce boş önbellek listesi üretmek,
      // bir daha güncellenemeyen bir uygulama yayınlamak demek.
      const yol = (f) => path.join(cikti, f)
      const html = readFileSync(yol('index.html'), 'utf8')
      const varliklar = [...html.matchAll(/(?:src|href)="(\/assets\/[^"]+)"/g)].map((m) => m[1])
      if (!varliklar.length) throw new Error('pwa-varliklari: index.html içinde /assets/ bağlantısı yok')

      const KABUK = [...varliklar, '/index.html', '/manifest.webmanifest', '/simge.svg', '/pwa-192.png', '/pwa-512.png', '/apple-touch-icon.png']

      const swYolu = yol('sw.js')
      let sw = readFileSync(swYolu, 'utf8')
      if (!sw.includes('/*__KABUK__*/') || !sw.includes('/*__DERLEME__*/')) {
        throw new Error('pwa-varliklari: sw.js içinde yer tutucular bulunamadı')
      }
      sw = sw.replace('/*__KABUK__*/[]', JSON.stringify(KABUK)).replace('/*__DERLEME__*/""', JSON.stringify(DERLEME_ID))
      writeFileSync(swYolu, sw)
    },
  }
}

export default defineConfig({
  plugins: [react(), pwaVarliklari()],
})
