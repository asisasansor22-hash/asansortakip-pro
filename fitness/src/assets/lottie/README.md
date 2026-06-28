# Lottie animasyon dosyaları

Birebir profesyonel kalitede (illüstrasyon tarzı) hareket animasyonları için
buraya `.json` Lottie dosyalarını koyun, sonra `src/data/lottieMap.js` içinde
import edip eşlemeye ekleyin.

## Nereden bulunur?

- **LottieFiles** (lottiefiles.com) — "workout", "exercise", "squat", "gym" araması.
  Ücretsiz olanların lisansını kontrol edin; bazıları atıf ister.
- **IconScout / Lordicon** — ücretli, yüksek kaliteli fitness animasyonları.
- **Kendi animatörünüz** — After Effects + Bodymovin eklentisiyle `.json` dışa aktarım.

## Eşleme örneği (`src/data/lottieMap.js`)

```js
import squat from "../assets/lottie/squat.json";
import benchpress from "../assets/lottie/benchpress.json";

export const LOTTIE_MAP = { squat, benchpress };
```

## Davranış

- `LOTTIE_MAP` içinde olan tip → Lottie oynatıcı (yüksek kalite) kullanılır.
- Olmayan tip → mevcut kaslı SVG figürüne otomatik düşer.

Yani dosyaları teker teker ekleyebilirsiniz; her eklenen hareket anında
Lottie kalitesine geçer, gerisi SVG ile çalışmaya devam eder.

## Hangi tipler var?

`squat`, `pushup`, `benchpress`, `curl`, `crunch`, `jumpingjack`, `lunge`,
`shoulderpress`, `deadlift`, `calfraise`, `pullup`, `plank`, `idle`

(Bir egzersizin hangi tipe bağlı olduğunu `src/data/exercises.js` içindeki
`anim` alanından görebilirsiniz.)
