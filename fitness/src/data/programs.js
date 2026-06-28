// Hazır antrenman programları. days[].exercises = exercises.js içindeki id'ler.

export const READY_PROGRAMS = [
  {
    id: "fullbody-beginner",
    name: "Yeni Başlayan Full Body",
    level: "Başlangıç",
    goal: "Genel form & güç",
    freq: "Haftada 3 gün",
    desc: "Tüm vücudu kapsayan, ekipman gerektirmeyen/temel hareketlerden oluşan başlangıç programı.",
    days: [
      { name: "Gün A", exercises: ["squat", "sinav", "row", "plank"] },
      { name: "Gün B", exercises: ["lunge", "shoulder-press", "biceps-curl", "crunch"] },
      { name: "Gün C", exercises: ["squat", "sinav", "lat-pulldown", "calf-raise"] },
    ],
  },
  {
    id: "ppl",
    name: "Push / Pull / Legs",
    level: "Orta-İleri",
    goal: "Kas kütlesi (hipertrofi)",
    freq: "Haftada 3-6 gün",
    desc: "Klasik itme / çekme / bacak bölünmesi. Hacim artışı için ideal.",
    days: [
      { name: "Push (İtiş)", exercises: ["bench-press", "incline-press", "shoulder-press", "lateral-raise", "triceps-dips"] },
      { name: "Pull (Çekiş)", exercises: ["deadlift", "barfiks", "row", "biceps-curl", "hammer-curl"] },
      { name: "Legs (Bacak)", exercises: ["squat", "lunge", "bulgarian", "calf-raise"] },
    ],
  },
  {
    id: "home-noequip",
    name: "Evde Ekipmansız",
    level: "Başlangıç-Orta",
    goal: "Form koruma & yağ yakımı",
    freq: "Haftada 4 gün",
    desc: "Tamamen vücut ağırlığıyla, evde yapılabilen pratik program.",
    days: [
      { name: "Üst Vücut", exercises: ["sinav", "triceps-dips", "plank"] },
      { name: "Alt Vücut", exercises: ["squat", "lunge", "calf-raise"] },
      { name: "Kardiyo + Core", exercises: ["jumping-jack", "high-knees", "burpee", "crunch", "leg-raise"] },
    ],
  },
  {
    id: "fatloss",
    name: "Yağ Yakım & Kondisyon",
    level: "Orta",
    goal: "Yağ yakımı",
    freq: "Haftada 4-5 gün",
    desc: "Yüksek tempolu, kardiyo ağırlıklı, devre tipi antrenman.",
    days: [
      { name: "HIIT 1", exercises: ["burpee", "jumping-jack", "squat", "high-knees", "plank"] },
      { name: "Kuvvet", exercises: ["squat", "sinav", "row", "lunge"] },
      { name: "HIIT 2", exercises: ["high-knees", "burpee", "lunge", "crunch"] },
    ],
  },
];

export function getReadyProgram(id) {
  return READY_PROGRAMS.find(function (p) { return p.id === id; }) || null;
}
