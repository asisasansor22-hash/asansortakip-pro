// Kanıta dayalı takviye rehberi — KADEMELİ.
//
// Kaynaklar: ISSN (International Society of Sports Nutrition) position stand'leri,
// sistematik derlemeler ve meta-analizler. Her maddede kanıtın NE KADAR güçlü
// olduğu ve varsa çekinceler açıkça yazılır.
//
// TEMEL İLKE: Kas gelişiminin büyük kısmı antrenman hacmi, aşamalı yüklenme,
// yeterli protein/kalori ve uykudan gelir. Takviye en iyi ihtimalle kenar
// süsüdür — "işe yarar" listesindekiler bile tek başına fark yaratmaz.
//
// ⚠️ PAZARLAMA TUZAĞI: "Kas protein sentezini (MPS) %X artırır" iddiası tek
// başına bir şey ifade etmez. Mitchell ve ark. (2014, PLOS One) akut MPS
// yanıtı ile 16 haftalık gerçek kas büyümesi arasında KORELASYON BULAMADI.
// Bir ürün yalnızca akut MPS verisiyle pazarlanıyorsa, kas yaptığı kanıtlanmış
// değildir.

// tier: "iyi" (işe yarar) | "kosullu" (duruma göre) | "gereksiz" (kanıt yok/zayıf)
export const TIERS = [
  { id: "iyi", label: "✅ İşe yarar", desc: "Güçlü kanıt var. Paranın karşılığını verir." },
  { id: "kosullu", label: "🟡 Duruma göre", desc: "Belirli koşullarda veya sınırlı ölçüde işe yarar." },
  { id: "gereksiz", label: "❌ Gereksiz", desc: "Kanıt yok veya yeterli beslenmede anlamsız." },
];

export const SUPPLEMENTS = [
  // ---------- ✅ İŞE YARAR ----------
  {
    id: "creatine", tier: "iyi", name: "Kreatin Monohidrat", emoji: "⚡", kanit: "Güçlü",
    fayda: "Kas kütlesi, güç ve yüksek şiddetli performansı artırır. Sporda kanıtı EN GÜÇLÜ takviye — ISSN'e göre mevcut en etkili ergojenik destek.",
    doz: "Günde 3-5 g, her gün (antrenman günü olsun olmasın). Yükleme dönemi şart değil, sadece doygunluğu hızlandırır.",
    notlar: [
      "Monohidrat yeterli — 'HCl', 'kre-alkalyn' gibi pahalı formların üstünlüğü gösterilmedi",
      "Zamanlaması önemsiz; günün herhangi bir saatinde alabilirsin",
      "ISSN: 30 g/güne kadar 5 yıl kullanımda bile güvenli bulundu",
      "İlk haftalarda 1-2 kg su tutulması normal — yağ değil, kas içi su",
    ],
  },
  {
    id: "protein", tier: "iyi", name: "Protein Tozu (Whey / Kazein / Bitkisel)", emoji: "🥛", kanit: "Güçlü",
    fayda: "Kendisi sihirli değil — günlük protein hedefini tutturmanın ucuz ve pratik yolu. Hedefi yemekle tutturuyorsan gerek yok.",
    doz: "Toplam hedef: 1.6-2.2 g/kg vücut ağırlığı/gün. Öğün başına 20-40 g.",
    notlar: [
      "Gerçek besinden gelen protein de aynı sayılır",
      "'Antrenmandan sonra 30 dk içinde iç' kuralı abartı — günlük toplam belirleyici",
      "Bitkisel tozlarda lösin daha düşük; porsiyonu biraz artır",
    ],
  },
  {
    id: "caffeine", tier: "iyi", name: "Kafein", emoji: "☕", kanit: "Güçlü",
    fayda: "Güç çıktısı, dayanıklılık, odak ve algılanan zorlanmayı iyileştirir. ISSN position stand ile destekli.",
    doz: "Antrenmandan 30-60 dk önce 3-6 mg/kg (70 kg için ~200-400 mg).",
    notlar: [
      "Uykuya en az 8-9 saat kala kes — uyku kaybı kazancı götürür",
      "Düzenli kullanımda tolerans gelişir; ağır günlere sakla",
      "Kahve de olur hap da; kaynak fark etmez",
    ],
  },

  // ---------- 🟡 DURUMA GÖRE ----------
  {
    id: "vitamin-d", tier: "kosullu", name: "D Vitamini", emoji: "☀️", kanit: "Orta",
    fayda: "EKSİKLİĞİN VARSA değerli: kemik sağlığı, bağışıklık, kas fonksiyonu. Eksik değilsen ek fayda beklenmez.",
    doz: "1000-2000 IU/gün. İdeali kan testine (25-OH D) göre ayarlamak.",
    notlar: ["Türkiye'de kış aylarında eksiklik yaygın", "Yağlı öğünle al, emilim artar"],
  },
  {
    id: "omega3", tier: "kosullu", name: "Omega-3 (EPA/DHA)", emoji: "🐟", kanit: "Orta",
    fayda: "Kalp-damar ve eklem sağlığı için sağlam gerekçe var; kas kazancına doğrudan etkisi küçük.",
    doz: "1-3 g/gün EPA+DHA (etiketteki toplam yağ değil, EPA+DHA miktarına bak).",
    notlar: ["Haftada 2-3 kez yağlı balık yiyorsan gerek yok"],
  },
  {
    id: "beta-alanine", tier: "kosullu", name: "Beta-Alanin", emoji: "🔥", kanit: "Orta",
    fayda: "Kas karnozinini artırıp asit birikimini tamponlar. Yalnızca 1-4 dakika süren yüksek şiddetli işlerde ölçülebilir fayda.",
    doz: "Günde 3-6 g, bölünmüş dozlarda. Etkisi 4+ haftada birikir.",
    notlar: [
      "Klasik 8-12 tekrarlık setlerde faydası sınırlı",
      "Karıncalanma (paresthesia) zararsız; dozu bölünce azalır",
    ],
  },
  {
    id: "citrulline", tier: "kosullu", name: "Sitrulin Malat", emoji: "🩸", kanit: "Sınırlı",
    fayda: "Kan akışı ve tekrar sayısında küçük artış bildiren çalışmalar var; sonuçlar tutarsız, etki küçük.",
    doz: "Antrenmandan 60 dk önce 6-8 g.",
    notlar: ["Etkisinin bir kısmı 'pompa' hissi", "Kanıtı kreatin/kafein kadar sağlam değil"],
  },
  {
    id: "hmb", tier: "kosullu", name: "HMB", emoji: "🧬", kanit: "Sınırlı",
    fayda: "ISSN 2024 güncellemesi güvenli buluyor ve toparlanmaya katkısından söz ediyor; ancak asıl fayda yeni başlayan / antrenmansız kişilerde. Antrenmanlıda etki küçük.",
    doz: "Günde 3 g, antrenman çevresinde bölünmüş.",
    notlar: ["Yeterli protein alıyorsan ek katkısı belirsiz", "Kreatinden çok daha pahalı, çok daha az kanıtlı"],
  },
  {
    id: "ashwagandha", tier: "kosullu", name: "Ashwagandha", emoji: "🌿", kanit: "Sınırlı",
    fayda: "Stres ve uyku kalitesinde mütevazı iyileşme bildiren çalışmalar var. Performans/kas iddiaları kesin değil.",
    doz: "Günde 300-600 mg standardize ekstre.",
    notlar: [
      "NIH değerlendirmesi: etki 'kesinlikten uzak'",
      "Tiroid ve karaciğerle ilgili nadir olumsuz bildirimler var — ilaç kullanıyorsan doktoruna sor",
    ],
  },

  // ---------- ❌ GEREKSİZ ----------
  {
    id: "bcaa", tier: "gereksiz", name: "BCAA (Dallı Zincirli Amino Asit)", emoji: "🚫", kanit: "Yok",
    fayda: "Yeterli protein alan birinde ek fayda gösterilemedi. Kas yapımı için 9 esansiyel amino asidin hepsi gerekir; BCAA bunların yalnızca 3'ü.",
    doz: "Önerilmiyor — parayı proteine harca.",
    notlar: [
      "ISSN: tam esansiyel amino asit (EAA) profili BCAA'dan üstün",
      "Whey zaten bolca BCAA içerir",
    ],
  },
  {
    id: "glutamine", tier: "gereksiz", name: "Glutamin", emoji: "🚫", kanit: "Yok",
    fayda: "Sağlıklı sporcularda kas kazancı, güç veya toparlanmaya faydası gösterilemedi.",
    doz: "Önerilmiyor.",
    notlar: ["Klinik kullanımından (yanık, travma) spor pazarına taşınmış bir iddia"],
  },
  {
    id: "test-booster", tier: "gereksiz", name: "Testosteron Artırıcılar (Tribulus, DAA…)", emoji: "🚫", kanit: "Yok",
    fayda: "Normal testosteron seviyesindeki erkeklerde anlamlı hormon artışı veya kas kazancı sağlamıyor.",
    doz: "Önerilmiyor.",
    notlar: ["Testosteronun gerçekten düşükse bu bir sağlık meselesidir — doktora git, takviyeye değil"],
  },
  {
    id: "fat-burner", tier: "gereksiz", name: "Yağ Yakıcılar", emoji: "🚫", kanit: "Yok",
    fayda: "Yağ kaybını kalori açığı belirler. Bu ürünlerin çoğu kafein + etkisiz karışım; ölçülebilir etkisi kafeinden ibaret.",
    doz: "Önerilmiyor.",
    notlar: ["Aynı parayla kaliteli protein al", "Bazı ürünler yasaklı/riskli madde içerebiliyor"],
  },
  {
    id: "dileucine", tier: "gereksiz", name: "Dileucine / \"Peptit\" Ürünler", emoji: "🚫", kanit: "Zayıf",
    fayda: "Akut kas protein sentezini lösinden fazla artırdığı gösterildi — ancak akut MPS artışı gerçek kas büyümesini öngörmüyor (Mitchell 2014). Uzun vadeli, kas ölçen bağımsız çalışma yok.",
    doz: "Önerilmiyor — kanıt olgunlaşana kadar bekle.",
    notlar: [
      "Enjekte edilen peptitlerle (BPC-157 vb.) ilgisi yok; bu 2 amino asitlik bir dipeptit",
      "Yeterli protein alıyorsan ek lösinin işi yok",
      "\"%159 daha fazla MPS\" pazarlaması yukarıdaki tuzağın tipik örneği",
    ],
  },
];
