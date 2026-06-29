// Kanıta dayalı supplement rehberi.
// Kaynaklar: ISSN position stands, sistematik derlemeler ve meta-analizler
// (creatine, whey protein, kafein, beta-alanin için güçlü kanıt).
// kanit: kanıt gücü (Güçlü / Orta / Sınırlı)

export const SUPPLEMENTS = [
  {
    id: "creatine",
    name: "Kreatin Monohidrat",
    emoji: "⚡",
    kanit: "Güçlü",
    fayda: "Kas kütlesi, güç ve yüksek şiddetli performansı artırır. En çok çalışılan ve etkili supplement.",
    doz: "Günde 3-5 g (her gün, antrenman günü fark etmez). Yükleme şart değil.",
    notlar: ["Suyla al, zamanlaması önemli değil", "Uzun vadede güvenli", "Hafif su tutulması olabilir"],
  },
  {
    id: "whey",
    name: "Whey Protein",
    emoji: "🥛",
    kanit: "Güçlü",
    fayda: "Kas onarımı ve hipertrofiyi destekler. Günlük protein hedefini tutturmak için pratik.",
    doz: "Öğün başına 20-40 g. Toplam hedef: ~1.6-2.2 g/kg vücut ağırlığı/gün.",
    notlar: ["Gerçek besinden protein de sayılır", "Antrenman sonrası kullanışlı ama şart değil"],
  },
  {
    id: "caffeine",
    name: "Kafein",
    emoji: "☕",
    kanit: "Güçlü",
    fayda: "Odak, dayanıklılık ve güç çıktısını artırır. Antrenman öncesi performans desteği.",
    doz: "Antrenmandan 30-60 dk önce 3-6 mg/kg.",
    notlar: ["Akşam geç saatte alma (uyku)", "Toleransa dikkat", "Hassasiyet kişiden kişiye değişir"],
  },
  {
    id: "beta-alanine",
    name: "Beta-Alanin",
    emoji: "🔥",
    kanit: "Orta",
    fayda: "Kas karnozinini artırıp yorgunluğu geciktirir; 1-4 dk süren yüksek şiddetli işlerde fayda.",
    doz: "Günde 2-6 g, bölünmüş dozlarda (karıncalanmayı azaltmak için).",
    notlar: ["Etkisi haftalar içinde birikir", "Karıncalanma (paresthesia) zararsızdır"],
  },
  {
    id: "vitamin-d",
    name: "D Vitamini",
    emoji: "☀️",
    kanit: "Orta",
    fayda: "Kemik sağlığı, bağışıklık ve kas fonksiyonu. Eksiklik yaygındır (özellikle kışın).",
    doz: "Genelde 1000-2000 IU/gün. İdeali kan değerine göre ayarlamak.",
    notlar: ["Eksiklikte fayda daha belirgin", "Yağla emilimi artar"],
  },
  {
    id: "omega3",
    name: "Omega-3 (Balık Yağı)",
    emoji: "🐟",
    kanit: "Orta",
    fayda: "Kalp sağlığı, eklem ve toparlanma desteği; antiinflamatuar etki.",
    doz: "Günde ~1-3 g EPA+DHA.",
    notlar: ["Haftada 2-3 kez yağlı balık yiyorsan gerek olmayabilir"],
  },
];
