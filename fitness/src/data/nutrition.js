// Hazır beslenme / diyet programları.

export const NUTRITION_PLANS = [
  {
    id: "kilo-verme",
    name: "Kilo Verme (Cut)",
    emoji: "🔥",
    desc: "Kalori açığıyla yağ yakımını hedefleyen, yüksek proteinli denge.",
    kcal: "~1800 kcal",
    macros: { protein: "150 g", carb: "150 g", fat: "55 g" },
    meals: [
      { title: "Kahvaltı", items: "3 yumurta + 1 dilim tam buğday ekmek + domates/salatalık" },
      { title: "Ara Öğün", items: "1 avuç badem + yeşil çay" },
      { title: "Öğle", items: "150 g ızgara tavuk + bol salata + 4 yk bulgur" },
      { title: "Ara Öğün", items: "200 g yoğurt + tarçın" },
      { title: "Akşam", items: "Izgara balık/hindi + buharda sebze" },
    ],
  },
  {
    id: "kas-kazanma",
    name: "Kas Kazanma (Bulk)",
    emoji: "💪",
    desc: "Kalori fazlasıyla temiz kas kütlesi artışı.",
    kcal: "~2900 kcal",
    macros: { protein: "180 g", carb: "330 g", fat: "85 g" },
    meals: [
      { title: "Kahvaltı", items: "Yulaf 80 g + 1 muz + 1 ölçek protein + fıstık ezmesi" },
      { title: "Ara Öğün", items: "Tam buğday sandviç + hindi füme + ayran" },
      { title: "Öğle", items: "200 g tavuk/kırmızı et + 1 su bardağı pilav + salata" },
      { title: "Antrenman Sonrası", items: "Protein shake + 1 muz" },
      { title: "Akşam", items: "200 g balık/et + patates + sebze" },
    ],
  },
  {
    id: "dengeli",
    name: "Dengeli & Sağlıklı",
    emoji: "🥗",
    desc: "Kilo korumak ve genel sağlık için sürdürülebilir denge.",
    kcal: "~2200 kcal",
    macros: { protein: "130 g", carb: "240 g", fat: "70 g" },
    meals: [
      { title: "Kahvaltı", items: "Menemen + 1 dilim ekmek + zeytin" },
      { title: "Ara Öğün", items: "1 meyve + 1 avuç ceviz" },
      { title: "Öğle", items: "Etli/zeytinyağlı sebze yemeği + bulgur + cacık" },
      { title: "Ara Öğün", items: "Yoğurt + meyve" },
      { title: "Akşam", items: "Izgara protein + bol salata + 1 dilim ekmek" },
    ],
  },
];

export function getNutritionPlan(id) {
  return NUTRITION_PLANS.find(function (n) { return n.id === id; }) || null;
}
