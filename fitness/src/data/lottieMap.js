// Egzersiz animasyon tipi -> profesyonel Lottie animasyonu (animationData).
//
// BİREBİR KALİTE (1b) İÇİN KULLANIM:
//   1. Lisanslı bir Lottie dosyası (.json) edin (ör. LottieFiles ücretsiz/satın alma,
//      ya da kendi animatörünüzün ürettiği dosya).
//   2. Dosyayı ./src/assets/lottie/ içine koyun (ör. squat.json).
//   3. Aşağıda import edip eşlemeye ekleyin.
//
// Örnek:
//   import squat from "../assets/lottie/squat.json";
//   import benchpress from "../assets/lottie/benchpress.json";
//   export const LOTTIE_MAP = { squat, benchpress };
//
// Eşlemede OLMAYAN her tip, otomatik olarak mevcut kaslı SVG figürüne düşer.
// Yani dosyaları teker teker ekledikçe figür o hareketlerde Lottie kalitesine geçer,
// gerisi çalışmaya devam eder.

export const LOTTIE_MAP = {};

export function getLottie(type) {
  return LOTTIE_MAP[type] || null;
}
