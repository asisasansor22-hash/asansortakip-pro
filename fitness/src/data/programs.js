// Hazır antrenman programları.
// Etiketler onboarding'e göre filtrelemek için:
//   gender: "herkes" | "kadin" | "erkek"
//   style:  "salon" | "ev" | "kosu" | "pilates"
//   goalTag: "yagver" | "kasyap" | "fitkal"
// days[].exercises = exercises.js id'leri. days[].note = opsiyonel açıklama (ör. koşu intervalleri).

export const READY_PROGRAMS = [
  {
    id: "fullbody-beginner", name: "Yeni Başlayan Full Body",
    gender: "herkes", style: "salon", goalTag: "fitkal",
    level: "Başlangıç", goal: "Genel form & güç", freq: "Haftada 3 gün",
    desc: "Tüm vücudu kapsayan, temel hareketlerden oluşan başlangıç programı.",
    days: [
      { name: "Gün A", exercises: ["squat", "sinav", "barbell-row", "plank"] },
      { name: "Gün B", exercises: ["lunge", "shoulder-press", "biceps-curl", "crunch"] },
      { name: "Gün C", exercises: ["squat", "sinav", "lat-pulldown", "calf-raise"] },
    ],
  },
  {
    id: "ppl", name: "Push / Pull / Legs",
    gender: "herkes", style: "salon", goalTag: "kasyap",
    level: "Orta-İleri", goal: "Kas kütlesi (hipertrofi)", freq: "Haftada 3-6 gün",
    desc: "Klasik itme / çekme / bacak bölünmesi. Hacim artışı için ideal.",
    days: [
      { name: "Push (İtiş)", exercises: ["bench-press", "incline-press", "shoulder-press", "lateral-raise", "triceps-dips"] },
      { name: "Pull (Çekiş)", exercises: ["deadlift", "barfiks", "barbell-row", "biceps-curl", "hammer-curl"] },
      { name: "Legs (Bacak)", exercises: ["squat", "lunge", "bulgarian", "calf-raise"] },
    ],
  },
  {
    id: "home-noequip", name: "Evde Ekipmansız",
    gender: "herkes", style: "ev", goalTag: "fitkal",
    level: "Başlangıç-Orta", goal: "Form koruma & yağ yakımı", freq: "Haftada 4 gün",
    desc: "Tamamen vücut ağırlığıyla, evde yapılabilen pratik program.",
    days: [
      { name: "Üst Vücut", exercises: ["sinav", "triceps-dips", "plank"] },
      { name: "Alt Vücut", exercises: ["squat", "lunge", "calf-raise"] },
      { name: "Kardiyo + Core", exercises: ["jumping-jack", "high-knees", "burpee", "crunch", "leg-raise"] },
    ],
  },
  {
    id: "fatloss", name: "Yağ Yakım & Kondisyon",
    gender: "herkes", style: "ev", goalTag: "yagver",
    level: "Orta", goal: "Yağ yakımı", freq: "Haftada 4-5 gün",
    desc: "Yüksek tempolu, kardiyo ağırlıklı, devre tipi antrenman.",
    days: [
      { name: "HIIT 1", exercises: ["burpee", "jumping-jack", "squat", "high-knees", "plank"] },
      { name: "Kuvvet", exercises: ["squat", "sinav", "barbell-row", "lunge"] },
      { name: "HIIT 2", exercises: ["high-knees", "burpee", "lunge", "crunch"] },
    ],
  },

  // ---------- KADIN ----------
  {
    id: "kadin-glute", name: "Kadın · Alt Vücut & Glute",
    gender: "kadin", style: "salon", goalTag: "kasyap",
    level: "Orta", goal: "Kalça & bacak şekillendirme", freq: "Haftada 3-4 gün",
    desc: "Glute ve alt vücut vurgusu yüksek, şekillendirme odaklı program.",
    days: [
      { name: "Glute Odak", exercises: ["hip-thrust", "glute-bridge", "glute-kickback", "romanian-deadlift", "calf-raise"] },
      { name: "Bacak", exercises: ["squat", "lunge", "bulgarian", "leg-curl", "seated-calf-raise"] },
      { name: "Core & Kardiyo", exercises: ["plank", "crunch", "russian-twist", "jumping-jack"] },
    ],
  },
  {
    id: "kadin-home", name: "Kadın · Evde Shape",
    gender: "kadin", style: "ev", goalTag: "yagver",
    level: "Başlangıç", goal: "Sıkılaşma & yağ yakımı", freq: "Haftada 4 gün",
    desc: "Ekipmansız, kalça-bacak-core odaklı evde program.",
    days: [
      { name: "Alt Vücut", exercises: ["glute-bridge", "squat", "lunge", "calf-raise"] },
      { name: "Core", exercises: ["plank", "side-plank", "crunch", "leg-raise"] },
      { name: "Kardiyo", exercises: ["jumping-jack", "high-knees", "jump-squat", "butt-kicks"] },
    ],
  },

  // ---------- ERKEK ----------
  {
    id: "erkek-upper", name: "Erkek · Üst Vücut Güç",
    gender: "erkek", style: "salon", goalTag: "kasyap",
    level: "Orta", goal: "Üst vücut kütle & güç", freq: "Haftada 3-4 gün",
    desc: "Göğüs, sırt, omuz ve kol vurgulu kütle programı.",
    days: [
      { name: "İtiş", exercises: ["bench-press", "incline-press", "military-press", "lateral-raise", "triceps-dips"] },
      { name: "Çekiş", exercises: ["barfiks", "barbell-row", "lat-pulldown", "biceps-curl", "hammer-curl"] },
      { name: "Bacak & Core", exercises: ["squat", "deadlift", "calf-raise", "plank"] },
    ],
  },

  // ---------- KOŞU / KARDİYO ----------
  {
    id: "kosu-baslangic", name: "Koşu · Başlangıç (Couch to Run)",
    gender: "herkes", style: "kosu", goalTag: "yagver",
    level: "Başlangıç", goal: "Koşu kondisyonu", freq: "Haftada 3 gün",
    desc: "Yürü-koş intervalleriyle sıfırdan koşuya. 8 haftada 30 dk sürekli koşu hedefi.",
    days: [
      { name: "1. Antrenman", note: "5 dk yürü (ısınma) → 8 tekrar: 1 dk koş / 1.5 dk yürü → 5 dk yürü (soğuma).", exercises: ["high-knees", "butt-kicks"] },
      { name: "2. Antrenman", note: "5 dk yürü → 6 tekrar: 1.5 dk koş / 1.5 dk yürü → 5 dk yürü.", exercises: ["jumping-jack"] },
      { name: "3. Antrenman", note: "5 dk yürü → 5 tekrar: 2 dk koş / 1 dk yürü → 5 dk yürü. Her hafta koşu süresini artır.", exercises: ["high-knees"] },
    ],
  },

  // ---------- PİLATES / MOBİLİTE ----------
  {
    id: "pilates-mobilite", name: "Pilates & Mobilite",
    gender: "herkes", style: "pilates", goalTag: "fitkal",
    level: "Başlangıç", goal: "Core, esneklik & duruş", freq: "Haftada 3-5 gün",
    desc: "Kontrollü, düşük tempolu core ve mobilite akışı; duruş ve esneklik için.",
    days: [
      { name: "Core Akışı", note: "Her harekette kontrollü nefes; pozisyonları 20-40 sn tut.", exercises: ["plank", "side-plank", "glute-bridge", "leg-raise"] },
      { name: "Mobilite & Core", note: "Yavaş ve kontrollü; esnemeye odaklan.", exercises: ["russian-twist", "crunch", "glute-bridge", "plank"] },
    ],
  },

  // ---------- EK ÇEŞİTLER ----------
  {
    id: "upper-lower", name: "Upper / Lower Bölünme",
    gender: "herkes", style: "salon", goalTag: "kasyap",
    level: "Orta", goal: "Kütle & güç", freq: "Haftada 4 gün",
    desc: "Üst gün / alt gün dönüşümlü; haftada 4 antrenmanla hacim.",
    days: [
      { name: "Üst", exercises: ["bench-press", "barbell-row", "shoulder-press", "biceps-curl", "triceps-dips"] },
      { name: "Alt", exercises: ["squat", "romanian-deadlift", "lunge", "leg-curl", "calf-raise"] },
    ],
  },
  {
    id: "erkek-home", name: "Erkek · Evde Kuvvet",
    gender: "erkek", style: "ev", goalTag: "kasyap",
    level: "Başlangıç-Orta", goal: "Ekipmansız kuvvet", freq: "Haftada 4 gün",
    desc: "Vücut ağırlığıyla üst-alt vücut kuvvet programı.",
    days: [
      { name: "Üst Vücut", exercises: ["sinav", "diamond-pushup", "triceps-dips", "plank"] },
      { name: "Alt Vücut", exercises: ["squat", "bulgarian", "jump-squat", "calf-raise"] },
      { name: "Full + Core", exercises: ["burpee", "mountain-climber", "crunch", "leg-raise"] },
    ],
  },
  {
    id: "erkek-fatloss", name: "Erkek · Yağ Yakım",
    gender: "erkek", style: "salon", goalTag: "yagver",
    level: "Orta", goal: "Yağ yakımı & kas koruma", freq: "Haftada 4-5 gün",
    desc: "Ağırlık + HIIT karışımıyla yağ yakarken kası koru.",
    days: [
      { name: "Full A", exercises: ["squat", "bench-press", "barbell-row", "plank"] },
      { name: "HIIT", exercises: ["burpee", "jumping-jack", "mountain-climber", "high-knees"] },
      { name: "Full B", exercises: ["deadlift", "shoulder-press", "lunge", "crunch"] },
    ],
  },
  {
    id: "kadin-fitkal", name: "Kadın · Form Koruma",
    gender: "kadin", style: "salon", goalTag: "fitkal",
    level: "Başlangıç-Orta", goal: "Genel form & tonus", freq: "Haftada 3 gün",
    desc: "Dengeli, tüm vücut tonus ve form koruma programı.",
    days: [
      { name: "Alt Vücut", exercises: ["squat", "hip-thrust", "lunge", "calf-raise"] },
      { name: "Üst Vücut", exercises: ["lat-pulldown", "shoulder-press", "biceps-curl", "triceps-dips"] },
      { name: "Core", exercises: ["plank", "crunch", "russian-twist", "side-plank"] },
    ],
  },
  {
    id: "kosu-orta", name: "Koşu · Orta Seviye",
    gender: "herkes", style: "kosu", goalTag: "fitkal",
    level: "Orta", goal: "Dayanıklılık", freq: "Haftada 3-4 gün",
    desc: "Sürekli koşu + tempo çalışmasıyla dayanıklılığı geliştir.",
    days: [
      { name: "Kolay Koşu", note: "5 dk ısınma → 25-30 dk rahat tempoda sürekli koşu → 5 dk soğuma.", exercises: ["high-knees"] },
      { name: "Interval", note: "5 dk ısınma → 6 tekrar: 2 dk hızlı / 2 dk yavaş koş → 5 dk soğuma.", exercises: ["butt-kicks"] },
      { name: "Uzun Koşu", note: "Rahat tempoda 40-50 dk sürekli koşu. Konuşabilecek hızda kal.", exercises: ["jumping-jack"] },
    ],
  },
  {
    id: "pilates-guc", name: "Pilates · Güç & Denge",
    gender: "herkes", style: "pilates", goalTag: "fitkal",
    level: "Orta", goal: "Core gücü & denge", freq: "Haftada 3-4 gün",
    desc: "Daha ileri core, denge ve kontrol akışı.",
    days: [
      { name: "Core Güç", note: "Kontrollü tempo, pozisyonları 30-45 sn tut.", exercises: ["plank", "side-plank", "hanging-leg-raise", "russian-twist"] },
      { name: "Denge & Glute", note: "Tek bacak ve denge odaklı; yavaş çalış.", exercises: ["glute-bridge", "bulgarian", "leg-raise", "plank"] },
    ],
  },
];

export function getReadyProgram(id) {
  return READY_PROGRAMS.find(function (p) { return p.id === id; }) || null;
}
