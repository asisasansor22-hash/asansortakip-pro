// Hazır antrenman programları — kanıta dayalı (meta-analiz/EMG) ilkelerle düzenlenmiştir:
//  • Hacim: hipertrofi için kas başına ~10-20 set/hafta (Schoenfeld ve ark.).
//  • Sıklık: kası haftada 2x çalışmak, eşit hacimde 1x'e göre en az o kadar etkili.
//  • Bileşik öncelik: çok eklemli hareketler başta, izolasyon sonra.
//  • İtme/çekme dengesi: omuz sağlığı için pres ve çekiş hacmi dengeli.
//  • Aşamalı yüklenme: 1-3 dk dinlen; setleri başarısızlığa 1-3 tekrar kala bitir; zamanla tekrar/kilo artır.
// Etiketler onboarding filtrelemesi için:
//   gender: "herkes" | "kadin" | "erkek"   style: "salon" | "ev" | "kosu" | "pilates" | "kalistenik"   goalTag: "yagver" | "kasyap" | "fitkal"
// days[].exercises = exercises.js id'leri. days[].note = opsiyonel açıklama (set/tempo/interval).

export const READY_PROGRAMS = [
  {
    id: "fullbody-beginner", name: "Yeni Başlayan Full Body",
    gender: "herkes", style: "salon", goalTag: "fitkal",
    level: "Başlangıç", goal: "Genel form & güç", freq: "Haftada 3 gün (gün aşırı)",
    desc: "Yeni başlayanlar için en kanıtlı şablon: tüm vücut, haftada 3 kez. Yüksek sıklık hareketi öğrenmeyi ve kas gelişimini hızlandırır.",
    days: [
      { name: "Gün A", note: "Her hareket 3 set. Bileşikte 6-10, izolasyonda 10-15 tekrar. Setler arası 1.5-2 dk dinlen.", exercises: ["squat", "bench-press", "barbell-row", "shoulder-press", "plank"] },
      { name: "Gün B", note: "3 set. Form öncelik; ağırlığı yavaş artır.", exercises: ["romanian-deadlift", "lat-pulldown", "incline-press", "lunge", "crunch"] },
      { name: "Gün C", note: "3 set. A ve B'yi dönüşümlü uygula; her hafta 1 tekrar veya küçük kilo ekle.", exercises: ["squat", "sinav", "seated-row", "lateral-raise", "calf-raise"] },
    ],
  },
  {
    id: "ppl", name: "Push / Pull / Legs (Hipertrofi)",
    gender: "herkes", style: "salon", goalTag: "kasyap",
    level: "Orta-İleri", goal: "Kas kütlesi (hipertrofi)", freq: "Haftada 6 gün (PPL x2) veya 3 gün",
    desc: "Haftada 2 tur yapıldığında her kas 2x çalışır — hipertrofi için ideal sıklık ve hacim. 3 gün de uygulanabilir.",
    days: [
      { name: "Push (İtiş)", note: "Göğüs/omuz/triceps. Bileşik 6-10, izolasyon 10-15 tekrar; 3-4 set.", exercises: ["bench-press", "incline-press", "shoulder-press", "lateral-raise", "triceps-dips", "triceps-pushdown"] },
      { name: "Pull (Çekiş)", note: "Sırt/arka omuz/biceps. Çekiş hacmi itişe denk olmalı.", exercises: ["deadlift", "barfiks", "barbell-row", "face-pull", "biceps-curl", "hammer-curl"] },
      { name: "Legs (Bacak)", note: "Quad + arka zincir + baldır dengeli. Squat ve menteşe birlikte; asılı bacak kaldırma core için.", exercises: ["squat", "romanian-deadlift", "leg-press", "leg-curl", "calf-raise", "hanging-leg-raise"] },
    ],
  },
  {
    id: "upper-lower", name: "Upper / Lower Bölünme",
    gender: "herkes", style: "salon", goalTag: "kasyap",
    level: "Orta", goal: "Kütle & güç", freq: "Haftada 4 gün",
    desc: "Üst/alt dönüşümlü; her kas haftada 2x. Çalışan-iş hayatına en iyi oturan 4 günlük denge.",
    days: [
      { name: "Üst A", note: "Pres ağırlıklı. 3-4 set, 6-10 tekrar.", exercises: ["bench-press", "barbell-row", "shoulder-press", "lat-pulldown", "triceps-pushdown", "biceps-curl"] },
      { name: "Alt A", note: "Squat ağırlıklı. 3-4 set.", exercises: ["squat", "romanian-deadlift", "leg-press", "leg-curl", "calf-raise"] },
      { name: "Üst B", note: "Eğim/çekiş vurgusu; A'dan farklı açılar.", exercises: ["incline-press", "seated-row", "lateral-raise", "face-pull", "hammer-curl", "skull-crusher"] },
      { name: "Alt B", note: "Menteşe/glute vurgusu; plank ile core.", exercises: ["deadlift", "hip-thrust", "bulgarian", "leg-extension", "seated-calf-raise", "plank"] },
    ],
  },
  {
    id: "home-noequip", name: "Evde Ekipmansız",
    gender: "herkes", style: "ev", goalTag: "fitkal",
    level: "Başlangıç-Orta", goal: "Form koruma & yağ yakımı", freq: "Haftada 3-4 gün (günleri dönüşümlü tekrarla)",
    desc: "Tamamen vücut ağırlığıyla. Zorluğu tekrar artırarak veya daha zor varyasyona geçerek (aşamalı yüklenme) yükselt.",
    days: [
      { name: "Üst Vücut", note: "Her hareket 3-4 set, başarısızlığa yakın. Kolaysa decline/diamond varyasyona geç. Superman, itme ağırlıklı günü sırt/arka zincirle dengeler.", exercises: ["sinav", "decline-pushup", "pike-pushup", "triceps-dips", "superman", "plank"] },
      { name: "Alt Vücut", note: "3-4 set. Kolaysa tek bacak (bulgarian/pistol) varyasyonuna geç.", exercises: ["squat", "lunge", "single-leg-glute-bridge", "wall-sit", "calf-raise"] },
      { name: "Kardiyo + Core", note: "Devre: 40 sn çalış / 20 sn dinlen x 3 tur.", exercises: ["jumping-jack", "high-knees", "burpee", "hollow-body-hold", "leg-raise"] },
    ],
  },
  {
    id: "fatloss", name: "Yağ Yakım & Kondisyon",
    gender: "herkes", style: "ev", goalTag: "yagver",
    level: "Orta", goal: "Yağ yakımı (kas koruyarak)", freq: "Haftada 3-5 gün (günleri dönüşümlü tekrarla)",
    desc: "Yağ kaybını kalori açığı belirler; bu plan kuvvet + HIIT ile kası korurken kalori harcamayı artırır.",
    days: [
      { name: "HIIT 1", note: "30 sn maksimal / 30 sn yürü x 8-10 tur.", exercises: ["burpee", "jump-squat", "mountain-climber", "high-knees", "plank"] },
      { name: "Kuvvet (Full)", note: "Kası korumak için ağır bileşikler. 3-4 set, 6-10 tekrar.", exercises: ["squat", "bench-press", "barbell-row", "shoulder-press", "lunge"] },
      { name: "HIIT 2", note: "Devre tipi, kısa dinlenme.", exercises: ["jumping-jack", "burpee", "lunge", "v-up", "side-plank"] },
    ],
  },

  // ---------- KADIN ----------
  {
    id: "kadin-glute", name: "Kadın · Alt Vücut & Glute",
    gender: "kadin", style: "salon", goalTag: "kasyap",
    level: "Orta", goal: "Kalça & bacak şekillendirme", freq: "Haftada 3-4 gün",
    desc: "Glute için en yüksek aktivasyonlu hareketler (hip thrust, RDL) öncelikli. Glute haftada 2x çalışır.",
    days: [
      { name: "Glute Odak", note: "Hip thrust ve menteşe başta. 3-4 set, 8-12 tekrar; tepede 1 sn sık.", exercises: ["hip-thrust", "romanian-deadlift", "glute-kickback", "glute-bridge", "seated-calf-raise"] },
      { name: "Bacak (Quad)", note: "3-4 set.", exercises: ["squat", "bulgarian", "leg-press", "leg-curl", "calf-raise"] },
      { name: "Core & Üst", note: "Üst vücut dengesi + core. 3 set.", exercises: ["lat-pulldown", "shoulder-press", "plank", "russian-twist"] },
    ],
  },
  {
    id: "kadin-home", name: "Kadın · Evde Shape",
    gender: "kadin", style: "ev", goalTag: "yagver",
    level: "Başlangıç", goal: "Sıkılaşma & yağ yakımı", freq: "Haftada 3-4 gün (günleri dönüşümlü tekrarla)",
    desc: "Ekipmansız, kalça-bacak-core odaklı. Yağ kaybı için beslenme açığıyla birlikte uygula.",
    days: [
      { name: "Alt Vücut", note: "3-4 set, başarısızlığa yakın. Squat en ağır bileşik olduğu için başta.", exercises: ["squat", "lunge", "glute-bridge", "single-leg-glute-bridge", "calf-raise"] },
      { name: "Core & Sırt", note: "3 set; pozisyonları 30-40 sn tut. Superman bel ve duruş için.", exercises: ["plank", "side-plank", "hollow-body-hold", "v-up", "superman"] },
      { name: "Kardiyo", note: "Devre: 40 sn çalış / 20 sn dinlen x 3-4 tur.", exercises: ["jumping-jack", "high-knees", "jump-squat", "butt-kicks"] },
    ],
  },
  {
    id: "kadin-fitkal", name: "Kadın · Form Koruma",
    gender: "kadin", style: "salon", goalTag: "fitkal",
    level: "Başlangıç-Orta", goal: "Genel form & tonus", freq: "Haftada 3 gün",
    desc: "Dengeli tüm vücut; her büyük kası haftada en az 1-2x çalışır. Tonus için orta tekrar (10-15).",
    days: [
      { name: "Alt Vücut", exercises: ["squat", "hip-thrust", "lunge", "leg-curl", "calf-raise"] },
      { name: "Üst Vücut", exercises: ["lat-pulldown", "seated-row", "shoulder-press", "biceps-curl", "triceps-pushdown"] },
      { name: "Core", exercises: ["plank", "crunch", "russian-twist", "side-plank"] },
    ],
  },

  // ---------- ERKEK ----------
  {
    id: "erkek-upper", name: "Erkek · Üst Vücut Güç",
    gender: "erkek", style: "salon", goalTag: "kasyap",
    level: "Orta", goal: "Üst vücut kütle & güç", freq: "Haftada 4 gün (Üst x2 + Alt)",
    desc: "Üst vücut vurgulu ama bacak ihmal edilmeden. İtme ve çekiş hacmi dengeli tutulur.",
    days: [
      { name: "İtiş", note: "3-4 set, 6-10 tekrar.", exercises: ["bench-press", "incline-press", "military-press", "lateral-raise", "triceps-dips"] },
      { name: "Çekiş", note: "İtişe denk hacim.", exercises: ["barfiks", "barbell-row", "lat-pulldown", "face-pull", "biceps-curl"] },
      { name: "Bacak & Core", note: "Üst gelişimi için bacak da şart.", exercises: ["squat", "romanian-deadlift", "leg-press", "calf-raise", "plank"] },
    ],
  },
  {
    id: "erkek-home", name: "Erkek · Evde Kuvvet (Kalistenik)",
    gender: "erkek", style: "ev", goalTag: "kasyap",
    level: "Başlangıç-Orta", goal: "Ekipmansız kuvvet", freq: "Haftada 3-4 gün (günleri dönüşümlü tekrarla)",
    desc: "Vücut ağırlığıyla kas yapımı: setleri başarısızlığa yakın bitir ve zamanla daha zor varyasyona geç.",
    days: [
      { name: "İtme", note: "3-4 set. Kolaylaşınca archer/decline'a geç.", exercises: ["sinav", "decline-pushup", "pike-pushup", "triceps-dips", "diamond-pushup"] },
      { name: "Çekme", note: "Bar varsa barfiks; yoksa masa altı inverted row.", exercises: ["barfiks", "inverted-row", "negative-pullup", "scapular-pull"] },
      { name: "Bacak & Core", note: "Tek bacağa ilerle.", exercises: ["squat", "bulgarian", "single-leg-glute-bridge", "wall-sit", "hanging-leg-raise"] },
    ],
  },
  {
    id: "erkek-fatloss", name: "Erkek · Yağ Yakım",
    gender: "erkek", style: "salon", goalTag: "yagver",
    level: "Orta", goal: "Yağ yakımı & kas koruma", freq: "Haftada 3-5 gün (günleri dönüşümlü tekrarla)",
    desc: "Ağır bileşikler kası korur, HIIT kalori açığını destekler. Yağ kaybının motoru beslenme açığıdır.",
    days: [
      { name: "Full A", note: "Ağır, 4-6 tekrar bileşikler.", exercises: ["squat", "bench-press", "barbell-row", "shoulder-press", "plank"] },
      { name: "HIIT", note: "30 sn / 30 sn x 8-10 tur.", exercises: ["burpee", "jump-squat", "mountain-climber", "high-knees"] },
      { name: "Full B", note: "Menteşe + çekiş vurgusu.", exercises: ["deadlift", "lat-pulldown", "lunge", "face-pull", "hanging-leg-raise"] },
    ],
  },

  // ---------- KALİSTENİK ----------
  {
    id: "kalistenik-baslangic", name: "Kalistenik · Başlangıç (Temeller)",
    gender: "herkes", style: "kalistenik", goalTag: "fitkal",
    level: "Başlangıç", goal: "Vücut ağırlığı temeli", freq: "Haftada 3 gün (full body)",
    desc: "Kalistenikte yeni başlayanlar için full body. İt-çek-bacak-core dengesi; her hareketin kolay (regresyon) versiyonundan başla.",
    days: [
      { name: "Gün A", note: "3 set, başarısızlığa 1-2 tekrar kala. Şınav zorsa diz üstü/eğik yap.", exercises: ["sinav", "inverted-row", "squat", "plank"] },
      { name: "Gün B", note: "3 set. Barfiks zorsa negatif veya inverted row yap.", exercises: ["pike-pushup", "negative-pullup", "lunge", "hollow-body-hold"] },
      { name: "Gün C", note: "3 set. Her hafta 1-2 tekrar ekle (aşamalı yüklenme).", exercises: ["decline-pushup", "scapular-pull", "single-leg-glute-bridge", "v-up"] },
    ],
  },
  {
    id: "kalistenik", name: "Kalistenik · Push/Pull/Legs",
    gender: "herkes", style: "kalistenik", goalTag: "kasyap",
    level: "Orta", goal: "Ekipmansız güç & kütle", freq: "Haftada 3-6 gün",
    desc: "Vücut ağırlığıyla itme/çekme/bacak bölünmesi. Haftada 2 tur yaparsan her grup 2x çalışır.",
    days: [
      { name: "İtme (Push)", note: "3-4 set. Göğüs + omuz + triceps.", exercises: ["sinav", "decline-pushup", "pike-pushup", "archer-pushup", "triceps-dips"] },
      { name: "Çekme (Pull)", note: "İtişe denk hacim. Bar yoksa inverted row.", exercises: ["barfiks", "chin-up", "inverted-row", "scapular-pull", "hanging-leg-raise"] },
      { name: "Bacak & Core", note: "Tek bacak gücüne ilerle.", exercises: ["squat", "bulgarian", "single-leg-glute-bridge", "wall-sit", "hollow-body-hold"] },
    ],
  },
  {
    id: "kalistenik-skill", name: "Kalistenik · Beceri & Güç (İleri)",
    gender: "herkes", style: "kalistenik", goalTag: "kasyap",
    level: "İleri", goal: "İleri beceri & maksimal güç", freq: "Haftada 4 gün",
    desc: "Muscle-up, planş ve L-sit gibi becerilere hazırlık. Beceri çalışmasını dinlenikken, kas çalışmasını sonra yap.",
    days: [
      { name: "Beceri (Dinç)", note: "Isınma sonrası, az tekrar-çok set; tam dinlenerek kaliteli tekrar.", exercises: ["muscle-up", "handstand-pushup", "l-sit"] },
      { name: "İtme Gücü", note: "3-5 set, zor varyasyon.", exercises: ["pseudo-planche-pushup", "archer-pushup", "pike-pushup", "triceps-dips"] },
      { name: "Çekme Gücü", note: "Patlayıcı + kontrollü.", exercises: ["barfiks", "muscle-up", "inverted-row", "dragon-flag"] },
      { name: "Bacak & Core", note: "Tek bacak + güçlü core.", exercises: ["pistol-squat", "nordic-curl", "bulgarian", "l-sit"] },
    ],
  },

  // ---------- KOŞU / KARDİYO ----------
  {
    id: "kosu-baslangic", name: "Koşu · Başlangıç (Couch to 5K)",
    gender: "herkes", style: "kosu", goalTag: "yagver",
    level: "Başlangıç", goal: "Sıfırdan sürekli koşu", freq: "Haftada 3 gün (gün aşırı)",
    desc: "Kanıtlanmış yürü-koş ilerlemesi. Her hafta koşu oranını artır; 8 haftada 30 dk sürekli koşu hedefi.",
    days: [
      { name: "1. Antrenman", note: "5 dk yürü (ısınma) → 8 tekrar: 1 dk koş / 1.5 dk yürü → 5 dk yürü (soğuma).", exercises: ["high-knees", "butt-kicks"] },
      { name: "2. Antrenman", note: "5 dk yürü → 6 tekrar: 1.5 dk koş / 1.5 dk yürü → 5 dk yürü.", exercises: ["jumping-jack"] },
      { name: "3. Antrenman", note: "5 dk yürü → 5 tekrar: 2 dk koş / 1 dk yürü → 5 dk yürü. Her hafta koşu süresini ~%10 artır.", exercises: ["high-knees"] },
    ],
  },
  {
    id: "kosu-orta", name: "Koşu · Orta Seviye",
    gender: "herkes", style: "kosu", goalTag: "fitkal",
    level: "Orta", goal: "Dayanıklılık & hız", freq: "Haftada 3-4 gün",
    desc: "Polarize yaklaşım: çoğu koşu kolay tempoda, az miktarda yüksek şiddet. Hacmi haftada en fazla %10 artır.",
    days: [
      { name: "Kolay Koşu", note: "5 dk ısınma → 25-30 dk konuşabilecek tempoda → 5 dk soğuma.", exercises: ["high-knees"] },
      { name: "Interval", note: "5 dk ısınma → 6 tekrar: 2 dk hızlı / 2 dk yavaş → 5 dk soğuma.", exercises: ["butt-kicks"] },
      { name: "Uzun Koşu", note: "Rahat tempoda 40-50 dk sürekli. Haftanın en uzun koşusu.", exercises: ["jumping-jack"] },
    ],
  },

  // ---------- PİLATES / MOBİLİTE ----------
  {
    id: "pilates-mobilite", name: "Pilates & Mobilite",
    gender: "herkes", style: "pilates", goalTag: "fitkal",
    level: "Başlangıç", goal: "Core, esneklik & duruş", freq: "Haftada 3-5 gün",
    desc: "Kontrollü, düşük tempolu core ve mobilite akışı; duruş ve esneklik için. Nefes-hareket uyumuna odaklan.",
    days: [
      { name: "Core Akışı", note: "Her harekette kontrollü nefes; pozisyonları 20-40 sn tut.", exercises: ["plank", "side-plank", "glute-bridge", "hollow-body-hold"] },
      { name: "Mobilite & Core", note: "Yavaş ve kontrollü; esnemeye odaklan.", exercises: ["superman", "russian-twist", "single-leg-glute-bridge", "plank"] },
    ],
  },
  {
    id: "pilates-guc", name: "Pilates · Güç & Denge",
    gender: "herkes", style: "pilates", goalTag: "fitkal",
    level: "Orta", goal: "Core gücü & denge", freq: "Haftada 3-4 gün",
    desc: "Daha ileri core, denge ve kontrol akışı.",
    days: [
      { name: "Core Güç", note: "Kontrollü tempo, pozisyonları 30-45 sn tut.", exercises: ["plank", "side-plank", "hanging-leg-raise", "hollow-body-hold"] },
      { name: "Denge & Glute", note: "Tek bacak ve denge odaklı; yavaş çalış.", exercises: ["single-leg-glute-bridge", "bulgarian", "wall-sit", "plank"] },
    ],
  },
];

export function getReadyProgram(id) {
  return READY_PROGRAMS.find(function (p) { return p.id === id; }) || null;
}
