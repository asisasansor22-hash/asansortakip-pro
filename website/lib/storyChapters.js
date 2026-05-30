import { contact } from "@/lib/siteData";

// Each chapter is a full-viewport scene. palette colors are normalized RGB
// (0..1) consumed by the Three.js shader. Palettes are LIGHT and airy
// (soft blues/teals on near-white); copy is factual and professional.
export const chapters = [
  {
    id: "kapak",
    index: "",
    hero: true,
    kicker: "İstanbul Avrupa Yakası · 7 Yıllık Deneyim",
    title: ["Profesyonel asansör", "bakım ve servis hizmetleri"],
    lead: "Asis Asansör; bakım, montaj, revizyon ve arıza servisini tek elden, kayıtlı ve garantili olarak yürütür.",
    actions: [
      { href: `tel:${contact.phoneLinks[0]}`, label: "Servis Çağır", primary: true },
      { href: "/hizmetler", label: "Hizmetler" }
    ],
    hint: "Hizmetlerimiz için kaydırın",
    palette: { a: [0.95, 0.97, 1.0], b: [0.84, 0.91, 0.99], accent: [0.26, 0.52, 0.84] }
  },
  {
    id: "bakim",
    index: "01",
    kicker: "Bakım",
    title: ["Periyodik", "asansör bakımı"],
    lead: "Aylık bakımda kapı, fren, halat, kuyu, makine dairesi ve kumanda sistemi düzenli olarak kontrol edilir ve raporlanır.",
    bullets: ["Aylık periyodik kontrol", "Güvenlik ekipmanı testi", "Bakım sonrası raporlama"],
    actions: [{ href: "/hizmetler", label: "Hizmeti İncele" }],
    palette: { a: [0.94, 0.98, 0.98], b: [0.82, 0.94, 0.94], accent: [0.16, 0.6, 0.62] }
  },
  {
    id: "montaj",
    index: "02",
    kicker: "Montaj",
    title: ["Anahtar teslim", "asansör montajı"],
    lead: "Binanın kullanım yoğunluğu, kapasitesi ve mimari koşullarına uygun sistem seçilir; montaj süreci proje ve testlerle yönetilir.",
    bullets: ["Keşif ve kapasite planı", "Proje ve malzeme seçimi", "Test ve teslim süreci"],
    actions: [{ href: "/hizmetler", label: "Hizmeti İncele" }],
    palette: { a: [0.95, 0.97, 1.0], b: [0.85, 0.91, 0.99], accent: [0.24, 0.48, 0.86] }
  },
  {
    id: "revizyon",
    index: "03",
    kicker: "Revizyon",
    title: ["Asansör revizyon", "ve modernizasyon"],
    lead: "Sık arızalanan veya konforu düşen asansörlerde kabin, kapı, pano ve kumanda sistemleri güncel standartlara göre yenilenir.",
    bullets: ["Kabin ve kapı yenileme", "Kumanda panosu modernizasyonu", "Güvenlik iyileştirmeleri"],
    actions: [{ href: "/hizmetler", label: "Hizmeti İncele" }],
    palette: { a: [0.96, 0.97, 1.0], b: [0.88, 0.91, 0.98], accent: [0.36, 0.52, 0.8] }
  },
  {
    id: "servis",
    index: "04",
    kicker: "7/24 Arıza Servisi",
    title: ["7/24", "arıza servisi"],
    lead: "Arıza durumunda hızlı tespit, doğru parça ve kalıcı müdahale ile hizmet kesintisi en aza indirilir.",
    bullets: ["Acil arıza yönlendirme", "Parça değişimi ve ayar", "Yapılan işin garanti takibi"],
    actions: [{ href: `tel:${contact.phoneLinks[0]}`, label: "Acil Servis", primary: true }],
    palette: { a: [0.94, 0.98, 0.99], b: [0.84, 0.94, 0.96], accent: [0.14, 0.56, 0.7] }
  },
  {
    id: "iletisim",
    index: "05",
    kicker: "İletişim",
    title: ["Teklif için", "iletişime geçin"],
    lead: "Binanızın asansör ihtiyacını paylaşın; teknik bilgiler doğrultusunda 48 saat içinde yazılı teklif sunalım.",
    actions: [
      { href: `tel:${contact.phoneLinks[0]}`, label: "Hemen Arayın", primary: true },
      { href: "/iletisim", label: "Teklif Alın" }
    ],
    note: contact.address,
    palette: { a: [0.94, 0.99, 0.97], b: [0.84, 0.96, 0.93], accent: [0.14, 0.6, 0.54] }
  }
];
