# Asis Asansör Web Sitesi - MacBook Erişim ve Kurulum Rehberi

Bu dosya, Asis Asansör Next.js sitesini başka bir bilgisayardan görüntülemek veya MacBook Pro'ya taşıyıp çalıştırmak için hazırlandı.

## 1. Windows bilgisayardaki siteye MacBook'tan erişmek

Windows bilgisayar açık olmalı ve MacBook Pro aynı Wi-Fi ağına bağlı olmalı.

Windows bilgisayarda şu komutu çalıştır:

```powershell
cd "C:\Users\Asis Asansör\.codex\worktrees\1175\AsansörTakip Pro v5\asisasansor-next"
npm run dev:lan
```

MacBook Pro'da tarayıcıdan aç:

```text
http://192.168.1.5:3000
```

Not: Açılmazsa Windows Güvenlik Duvarı Node.js için izin isteyebilir. İzin verildiğinde MacBook'tan görünür.

## 2. Siteyi MacBook Pro'ya taşıyıp çalıştırmak

MacBook'ta Node.js LTS kurulu olmalı:

```text
https://nodejs.org
```

ZIP dosyasını MacBook'a aktar, aç ve Terminal'de proje klasörüne gir:

```bash
cd /path/to/asisasansor-next
npm install
npm run dev
```

MacBook'ta aç:

```text
http://localhost:3000
```

## 3. Üretim modunda çalıştırmak

```bash
npm install
npm run build
npm run start
```

MacBook'ta aç:

```text
http://localhost:3000
```

## 4. Önemli dosyalar

- `app/page.jsx`: Ana sayfa
- `app/hizmetler/page.jsx`: Hizmetler sayfası
- `app/blog/page.jsx`: Blog liste sayfası
- `app/blog/[slug]/page.jsx`: SEO uyumlu blog detay sayfaları
- `components/MotionGraphic.jsx`: Servis döngüsü grafiği
- `components/ServiceCycleStatus.jsx`: Online/offline saat kuralı
- `components/PremiumElevatorShowcase.jsx`: Ana sayfadaki render ve animasyon sahnesi
- `lib/siteData.js`: Telefon, adres, hizmetler ve blog içerikleri
- `public/asis-logo.webp`: Logo
- `public/elevator-real.jpg`: Asansör görseli

## 5. Servis döngüsü saat kuralı

Servis döngüsü şu kurala göre görünür:

- Pazar: OFFLINE
- Cumartesi 14:00 sonrası: OFFLINE
- Hafta içi 18:00 sonrası: OFFLINE
- Diğer saatlerde: ONLINE

