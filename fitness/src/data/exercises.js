// Vücut bölgeleri ve egzersiz veritabanı.
// Her egzersizin "anim" alanı, ExerciseAnimation bileşenindeki animasyon tipine karşılık gelir.

export const REGIONS = [
  { id: "gogus", name: "Göğüs", emoji: "🫀", color: "#ef4444" },
  { id: "sirt", name: "Sırt", emoji: "🔙", color: "#3b82f6" },
  { id: "omuz", name: "Omuz", emoji: "💪", color: "#f59e0b" },
  { id: "kol", name: "Kol (Biceps/Triceps)", emoji: "🦾", color: "#8b5cf6" },
  { id: "bacak", name: "Bacak", emoji: "🦵", color: "#10b981" },
  { id: "karin", name: "Karın", emoji: "🧱", color: "#ec4899" },
  { id: "kardiyo", name: "Kardiyo", emoji: "🏃", color: "#06b6d4" },
];

export const EXERCISES = [
  // ---------- GÖĞÜS ----------
  { id: "bench-press", name: "Bench Press", region: "gogus", anim: "benchpress", equip: "Halter", level: "Orta",
    sets: "4 x 8-10", desc: "Sırt üstü uzanıp halteri göğüsten yukarı it. Göğüs kasının temel hareketidir.",
    tips: ["Bilekleri dik tut", "Halteri göğüs ortasına indir", "Kürek kemiklerini sık"] },
  { id: "sinav", name: "Şınav", region: "gogus", anim: "pushup", equip: "Vücut ağırlığı", level: "Başlangıç",
    sets: "3 x 12-20", desc: "Ekipmansız klasik göğüs hareketi. Vücudu düz bir çizgi halinde tut.",
    tips: ["Kalçayı düşürme", "Dirsekleri 45° aç", "Tam in-çık"] },
  { id: "dumbbell-press", name: "Dumbbell Press", region: "gogus", anim: "benchpress", equip: "Dumbbell", level: "Orta",
    sets: "4 x 10", desc: "Dumbbell ile bench press. Daha geniş hareket açısı sağlar.",
    tips: ["Kontrollü indir", "Tepede sıkıştır"] },
  { id: "incline-press", name: "Eğimli Bench Press", region: "gogus", anim: "benchpress", equip: "Halter", level: "Orta",
    sets: "4 x 8-10", desc: "Eğimli sehpada üst göğsü hedefler.", tips: ["30-45° eğim ideal"] },

  // ---------- SIRT ----------
  { id: "barfiks", name: "Barfiks (Pull-up)", region: "sirt", anim: "pullup", equip: "Bar", level: "İleri",
    sets: "4 x maks", desc: "Çeneyi barın üstüne çekerek sırt genişliğini geliştirir.",
    tips: ["Tam asıl", "Sırtla çek, kolla değil"] },
  { id: "row", name: "Barbell Row", region: "sirt", anim: "deadlift", equip: "Halter", level: "Orta",
    sets: "4 x 10", desc: "Öne eğilip halteri karına çek. Sırt kalınlığı için temel hareket.",
    tips: ["Bel düz kalsın", "Dirsekleri geriye çek"] },
  { id: "deadlift", name: "Deadlift", region: "sirt", anim: "deadlift", equip: "Halter", level: "İleri",
    sets: "4 x 5", desc: "Tüm arka zinciri çalıştıran bileşik hareket.",
    tips: ["Bel asla yuvarlanmasın", "Bara yakın kaldır", "Kalçayı öne it"] },
  { id: "lat-pulldown", name: "Lat Pulldown", region: "sirt", anim: "pullup", equip: "Makine", level: "Başlangıç",
    sets: "4 x 12", desc: "Barfiksin makineli, ayarlanabilir versiyonu.", tips: ["Göğse doğru çek"] },

  // ---------- OMUZ ----------
  { id: "shoulder-press", name: "Omuz Press", region: "omuz", anim: "shoulderpress", equip: "Dumbbell", level: "Orta",
    sets: "4 x 10", desc: "Ağırlığı baş üstüne it. Omuz kütlesinin temeli.",
    tips: ["Beli yaylandırma", "Tam yukarı uzan"] },
  { id: "lateral-raise", name: "Yan Kaldırış", region: "omuz", anim: "shoulderpress", equip: "Dumbbell", level: "Başlangıç",
    sets: "3 x 15", desc: "Kolları yanlara açarak omuz genişliği kazandırır.",
    tips: ["Dirsek hafif kırık", "Omuz yüksekliğinde dur"] },
  { id: "arnold-press", name: "Arnold Press", region: "omuz", anim: "shoulderpress", equip: "Dumbbell", level: "İleri",
    sets: "3 x 10", desc: "Dönerek yapılan omuz press. Tüm omuz başlarını çalıştırır.", tips: ["Yavaş döndür"] },

  // ---------- KOL ----------
  { id: "biceps-curl", name: "Biceps Curl", region: "kol", anim: "curl", equip: "Dumbbell", level: "Başlangıç",
    sets: "3 x 12", desc: "Ön kolu bükerek biceps kasını izole eder.",
    tips: ["Dirseği sabit tut", "Sallanma"] },
  { id: "hammer-curl", name: "Hammer Curl", region: "kol", anim: "curl", equip: "Dumbbell", level: "Başlangıç",
    sets: "3 x 12", desc: "Nötr tutuşla biceps ve ön kol.", tips: ["Bilek düz"] },
  { id: "triceps-dips", name: "Dips (Triceps)", region: "kol", anim: "pushup", equip: "Vücut ağırlığı", level: "Orta",
    sets: "3 x 12", desc: "Vücudu aşağı indirip iterek triceps çalıştırır.", tips: ["Dirsekleri geride tut"] },

  // ---------- BACAK ----------
  { id: "squat", name: "Squat", region: "bacak", anim: "squat", equip: "Halter/Vücut", level: "Orta",
    sets: "4 x 8-12", desc: "Bacak gününün kralı. Tüm alt vücudu çalıştırır.",
    tips: ["Diz parmak ucunu geçmesin aşırı", "Kalçayı geriye it", "Sırt düz"] },
  { id: "lunge", name: "Lunge (Hamle)", region: "bacak", anim: "lunge", equip: "Dumbbell/Vücut", level: "Başlangıç",
    sets: "3 x 12", desc: "Öne adım atıp çök. Denge ve bacak gücü.",
    tips: ["Arka diz yere yaklaşsın", "Gövde dik"] },
  { id: "calf-raise", name: "Calf Raise (Baldır)", region: "bacak", anim: "calfraise", equip: "Vücut/Dumbbell", level: "Başlangıç",
    sets: "4 x 20", desc: "Topukları kaldırarak baldırı çalıştırır.", tips: ["Tepede 1 sn dur"] },
  { id: "bulgarian", name: "Bulgarian Split Squat", region: "bacak", anim: "lunge", equip: "Dumbbell", level: "İleri",
    sets: "3 x 10", desc: "Arka ayak yükseltilmiş tek bacak squat.", tips: ["Yavaş in"] },

  // ---------- KARIN ----------
  { id: "crunch", name: "Mekik (Crunch)", region: "karin", anim: "crunch", equip: "Vücut ağırlığı", level: "Başlangıç",
    sets: "3 x 20", desc: "Üst karın için temel hareket.", tips: ["Boynu çekme", "Karnı sık"] },
  { id: "plank", name: "Plank", region: "karin", anim: "plank", equip: "Vücut ağırlığı", level: "Başlangıç",
    sets: "3 x 40 sn", desc: "İzometrik core dayanıklılığı.", tips: ["Kalça düz", "Karın kasılı"] },
  { id: "leg-raise", name: "Bacak Kaldırma", region: "karin", anim: "crunch", equip: "Vücut ağırlığı", level: "Orta",
    sets: "3 x 15", desc: "Alt karın bölgesini hedefler.", tips: ["Beli yere yapıştır"] },

  // ---------- KARDİYO ----------
  { id: "jumping-jack", name: "Jumping Jack", region: "kardiyo", anim: "jumpingjack", equip: "Vücut ağırlığı", level: "Başlangıç",
    sets: "3 x 45 sn", desc: "Tüm vücut ısınma ve kardiyo hareketi.", tips: ["Ritmi koru"] },
  { id: "high-knees", name: "High Knees", region: "kardiyo", anim: "jumpingjack", equip: "Vücut ağırlığı", level: "Başlangıç",
    sets: "3 x 30 sn", desc: "Dizleri hızla kaldırarak nabız yükseltir.", tips: ["Hızlı tempo"] },
  { id: "burpee", name: "Burpee", region: "kardiyo", anim: "squat", equip: "Vücut ağırlığı", level: "İleri",
    sets: "3 x 12", desc: "Squat + şınav + sıçrama. Yüksek yoğunluk.", tips: ["Akıcı geçişler"] },
];

export function exercisesByRegion(regionId) {
  return EXERCISES.filter(function (e) { return e.region === regionId; });
}

export function getExercise(id) {
  return EXERCISES.find(function (e) { return e.id === id; }) || null;
}
