# FitProgram — Antrenman & Beslenme Uygulaması

Asansör takip projesinden bağımsız, kendi başına çalışan bir spor/fitness uygulaması.
React + Vite + Firebase ile yazıldı.

## Özellikler

- 🗺️ **Bölge bölge egzersizler** — Göğüs, sırt, omuz, kol, bacak, karın, kardiyo
- 🎬 **Animasyonlu hareketler** — Her egzersiz, saf SVG + CSS ile eklemli (kalça/diz/omuz/dirsek) bir figürle canlandırılır. Görsel/video dosyası gerektirmez.
- 👥 **Çoklu kullanıcı** — Firebase Auth (e-posta/şifre). Her kullanıcının verisi `/fitness/users/{uid}` altında.
- 📝 **Kendi programını oluştur** — Program ekle, hareketleri kendin seç, bulutta saklansın.
- 📋 **Hazır programlar** — Full Body, Push/Pull/Legs, Evde Ekipmansız, Yağ Yakım. Tek tıkla kopyala.
- 🥗 **Beslenme programları** — Kilo verme, kas kazanma, dengeli; makro hedefleri ve öğün düzeniyle.

## Çalıştırma

```bash
cd fitness
npm install
npm run dev      # geliştirme
npm run build    # üretim derlemesi (dist/)
```

## Yapı

```
fitness/
├─ src/
│  ├─ data/
│  │  ├─ exercises.js     # bölgeler + egzersiz veritabanı (anim tipleriyle)
│  │  ├─ programs.js      # hazır antrenman programları
│  │  └─ nutrition.js     # beslenme planları
│  ├─ components/
│  │  ├─ ExerciseAnimation.jsx  # ⭐ eklemli SVG figür iskeleti
│  │  ├─ ExerciseCard.jsx
│  │  ├─ BodyRegions.jsx        # bölge → hareket listesi
│  │  ├─ ExerciseDetail.jsx
│  │  ├─ ProgramBuilder.jsx     # "Programlarım"
│  │  ├─ ReadyPrograms.jsx
│  │  ├─ Nutrition.jsx
│  │  └─ Login.jsx
│  ├─ firebase.js
│  ├─ App.jsx
│  └─ index.css           # tema + tüm animasyon keyframe'leri
└─ index.html
```

## Animasyonlar nasıl çalışıyor?

`ExerciseAnimation.jsx` bir yan-görünüm iskelet çizer; her uzuv sabit bir eklem
noktası etrafında döner (`transform-origin`, viewBox koordinatlarında). Hareketin
kendisi `index.css` içindeki `.fig-<tip>` keyframe'leriyle tanımlıdır
(squat, pushup, benchpress, curl, crunch, jumpingjack, lunge, shoulderpress,
deadlift, calfraise, pullup, plank). Yeni hareket eklemek için: yeni bir `anim`
tipi seç, `index.css`'e keyframe ekle — başka asset gerekmez.

> Not: Animasyon açıları kabaca ayarlandı; `index.css`'teki `@keyframes` derece
> değerleriyle oynayarak ince ayar yapılabilir.
