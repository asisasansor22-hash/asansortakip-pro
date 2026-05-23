import { contact } from "@/lib/siteData";

// Each chapter is a full-viewport "scene". palette colors are normalized RGB
// (0..1) consumed by the Three.js shader; the journey flows from deep night
// blue -> teal -> azure -> violet -> warm amber -> fresh teal.
export const chapters = [
  {
    id: "kapak",
    index: "",
    kicker: "İstanbul Avrupa Yakası · 7 Yıllık Deneyim",
    title: ["Her katın", "bir hikayesi var."],
    lead: "Asis Asansör; bakım, montaj, revizyon ve arıza servisini tek elden, kayıtlı ve garantili şekilde yönetir.",
    actions: [{ href: `tel:${contact.phoneLinks[0]}`, label: "Servis Çağır", primary: true }],
    hint: "Hikayeyi keşfetmek için kaydırın",
    palette: { a: [0.02, 0.05, 0.12], b: [0.05, 0.16, 0.32], accent: [0.36, 0.68, 0.98] }
  },
  {
    id: "bakim",
    index: "Bölüm I",
    kicker: "Bakım",
    title: ["Disiplinli bakım,", "kesintisiz güven."],
    lead: "Aylık bakım süreçlerinde kapı, fren, halat, kuyu, makine dairesi ve kumanda sistemi düzenli şekilde kontrol edilir.",
    bullets: ["Aylık periyodik kontrol", "Güvenlik ekipmanı testi", "Bakım sonrası bilgilendirme"],
    actions: [{ href: "/hizmetler", label: "Hizmeti İncele" }],
    palette: { a: [0.02, 0.1, 0.13], b: [0.04, 0.26, 0.32], accent: [0.26, 0.86, 0.78] }
  },
  {
    id: "montaj",
    index: "Bölüm II",
    kicker: "Montaj",
    title: ["Doğru sistem,", "anahtar teslim."],
    lead: "Binanın kullanım yoğunluğu, kapasitesi ve mimari koşullarına göre doğru sistem seçilir ve montaj süreci yönetilir.",
    bullets: ["Keşif ve kapasite planı", "Proje ve malzeme seçimi", "Test ve teslim süreci"],
    actions: [{ href: "/hizmetler", label: "Hizmeti İncele" }],
    palette: { a: [0.03, 0.08, 0.18], b: [0.08, 0.24, 0.48], accent: [0.42, 0.7, 1.0] }
  },
  {
    id: "revizyon",
    index: "Bölüm III",
    kicker: "Revizyon",
    title: ["Eskiyen sisteme", "modern nefes."],
    lead: "Sık arızalanan veya konforu düşen asansörlerde kabin, kapı, pano ve kumanda sistemleri yenilenir.",
    bullets: ["Kabin ve kapı yenileme", "Kumanda panosu modernizasyonu", "Güvenlik iyileştirmeleri"],
    actions: [{ href: "/hizmetler", label: "Hizmeti İncele" }],
    palette: { a: [0.08, 0.05, 0.18], b: [0.26, 0.16, 0.46], accent: [0.72, 0.56, 1.0] }
  },
  {
    id: "servis",
    index: "Bölüm IV",
    kicker: "7/24 Acil Servis",
    title: ["Arıza beklemez,", "biz de beklemeyiz."],
    lead: "Ani arızalarda hızlı tespit, doğru parça ve kalıcı müdahale yaklaşımıyla hizmet kesintisi en aza indirilir.",
    bullets: ["Acil arıza yönlendirme", "Parça değişimi ve ayar", "Yapılan işin garanti takibi"],
    actions: [{ href: `tel:${contact.phoneLinks[0]}`, label: "Acil Servis", primary: true }],
    palette: { a: [0.14, 0.07, 0.08], b: [0.4, 0.16, 0.13], accent: [1.0, 0.56, 0.36] }
  },
  {
    id: "iletisim",
    index: "Final",
    kicker: "İletişim",
    title: ["Hikayenizi", "birlikte yazalım."],
    lead: "Binanızın asansör ihtiyacını konuşalım; teknik bilgileri paylaşın, 48 saat içinde yazılı teklif sunalım.",
    actions: [
      { href: `tel:${contact.phoneLinks[0]}`, label: "Hemen Arayın", primary: true },
      { href: "/iletisim", label: "Teklif Alın" }
    ],
    note: contact.address,
    palette: { a: [0.03, 0.12, 0.13], b: [0.05, 0.3, 0.3], accent: [0.34, 0.92, 0.74] }
  }
];
