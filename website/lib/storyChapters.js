import { contact } from "@/lib/siteData";

// Each chapter is a full-viewport scene. palette colors are normalized RGB
// (0..1) consumed by the Three.js shader. Palettes stay within a calm,
// corporate blue -> teal range; copy is factual and professional.
export const chapters = [
  {
    id: "kapak",
    index: "",
    kicker: "İstanbul Avrupa Yakası · 7 Yıllık Deneyim",
    title: ["Profesyonel asansör", "bakım ve servis hizmetleri"],
    lead: "Asis Asansör; bakım, montaj, revizyon ve arıza servisini tek elden, kayıtlı ve garantili olarak yürütür.",
    actions: [{ href: `tel:${contact.phoneLinks[0]}`, label: "Servis Çağır", primary: true }],
    hint: "Hizmetlerimiz için kaydırın",
    palette: { a: [0.02, 0.05, 0.12], b: [0.05, 0.16, 0.32], accent: [0.36, 0.68, 0.98] }
  },
  {
    id: "bakim",
    index: "01",
    kicker: "Bakım",
    title: ["Periyodik", "asansör bakımı"],
    lead: "Aylık bakımda kapı, fren, halat, kuyu, makine dairesi ve kumanda sistemi düzenli olarak kontrol edilir ve raporlanır.",
    bullets: ["Aylık periyodik kontrol", "Güvenlik ekipmanı testi", "Bakım sonrası raporlama"],
    actions: [{ href: "/hizmetler", label: "Hizmeti İncele" }],
    palette: { a: [0.03, 0.1, 0.16], b: [0.05, 0.22, 0.34], accent: [0.3, 0.74, 0.84] }
  },
  {
    id: "montaj",
    index: "02",
    kicker: "Montaj",
    title: ["Anahtar teslim", "asansör montajı"],
    lead: "Binanın kullanım yoğunluğu, kapasitesi ve mimari koşullarına uygun sistem seçilir; montaj süreci proje ve testlerle yönetilir.",
    bullets: ["Keşif ve kapasite planı", "Proje ve malzeme seçimi", "Test ve teslim süreci"],
    actions: [{ href: "/hizmetler", label: "Hizmeti İncele" }],
    palette: { a: [0.03, 0.08, 0.18], b: [0.07, 0.2, 0.42], accent: [0.4, 0.66, 0.96] }
  },
  {
    id: "revizyon",
    index: "03",
    kicker: "Revizyon",
    title: ["Asansör revizyon", "ve modernizasyon"],
    lead: "Sık arızalanan veya konforu düşen asansörlerde kabin, kapı, pano ve kumanda sistemleri güncel standartlara göre yenilenir.",
    bullets: ["Kabin ve kapı yenileme", "Kumanda panosu modernizasyonu", "Güvenlik iyileştirmeleri"],
    actions: [{ href: "/hizmetler", label: "Hizmeti İncele" }],
    palette: { a: [0.04, 0.09, 0.16], b: [0.1, 0.24, 0.4], accent: [0.45, 0.72, 0.92] }
  },
  {
    id: "servis",
    index: "04",
    kicker: "7/24 Arıza Servisi",
    title: ["7/24", "arıza servisi"],
    lead: "Arıza durumunda hızlı tespit, doğru parça ve kalıcı müdahale ile hizmet kesintisi en aza indirilir.",
    bullets: ["Acil arıza yönlendirme", "Parça değişimi ve ayar", "Yapılan işin garanti takibi"],
    actions: [{ href: `tel:${contact.phoneLinks[0]}`, label: "Acil Servis", primary: true }],
    palette: { a: [0.03, 0.11, 0.17], b: [0.06, 0.26, 0.38], accent: [0.32, 0.8, 0.86] }
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
    palette: { a: [0.03, 0.12, 0.15], b: [0.05, 0.28, 0.32], accent: [0.34, 0.82, 0.74] }
  }
];
