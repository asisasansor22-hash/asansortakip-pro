import { GENERATED } from "./exercisesGenerated";

// Vücut bölgeleri ve egzersiz veritabanı.
// Her egzersizin "anim" alanı, ExerciseAnimation bileşenindeki animasyon tipine karşılık gelir.
// Mevcut animasyon tipleri: squat, pushup, benchpress, curl, crunch, jumpingjack,
// lunge, shoulderpress, deadlift, calfraise, pullup, plank, idle

export const REGIONS = [
  { id: "gogus", name: "Göğüs", emoji: "🫀", color: "#ef4444" },
  { id: "sirt", name: "Sırt", emoji: "🔙", color: "#3b82f6" },
  { id: "omuz", name: "Omuz", emoji: "💪", color: "#f59e0b" },
  { id: "kol", name: "Kol (Biceps/Triceps)", emoji: "🦾", color: "#8b5cf6" },
  { id: "bacak", name: "Bacak", emoji: "🦵", color: "#10b981" },
  { id: "karin", name: "Karın", emoji: "🧱", color: "#ec4899" },
  { id: "kardiyo", name: "Kardiyo", emoji: "🏃", color: "#06b6d4" },
];

// El ile özenle hazırlanmış hareketler (zengin açıklama/ipucu + muadil + en etkili rozeti).
const CURATED = [
  // ============ GÖĞÜS ============
  { id: "bench-press", name: "Bench Press", region: "gogus", anim: "benchpress", equip: "Halter", level: "Orta",
    sets: "4 x 8-10", desc: "Sırt üstü uzanıp halteri göğüsten yukarı it. Göğüs kasının temel hareketidir.",
    tips: ["Bilekleri dik tut", "Halteri göğüs ortasına indir", "Kürek kemiklerini sık"] },
  { id: "incline-press", name: "Eğimli Bench Press", region: "gogus", anim: "benchpress", equip: "Halter", level: "Orta",
    sets: "4 x 8-10", desc: "Eğimli sehpada üst göğsü hedefler.", tips: ["30-45° eğim ideal", "Kontrollü indir"] },
  { id: "decline-press", name: "Alt Eğimli Press", region: "gogus", anim: "benchpress", equip: "Halter", level: "Orta",
    sets: "4 x 10", desc: "Aşağı eğimli sehpada alt göğsü çalıştırır.", tips: ["Tam kontrol", "Omuzları geride tut"] },
  { id: "dumbbell-press", name: "Dumbbell Press", region: "gogus", anim: "benchpress", equip: "Dumbbell", level: "Orta",
    sets: "4 x 10", desc: "Dumbbell ile bench press; daha geniş hareket açısı sağlar.", tips: ["Kontrollü indir", "Tepede sıkıştır"] },
  { id: "dumbbell-fly", name: "Dumbbell Fly", region: "gogus", anim: "benchpress", equip: "Dumbbell", level: "Orta",
    sets: "3 x 12", desc: "Kolları yay gibi açıp kapatarak göğsü izole eder.", tips: ["Dirsek hafif kırık", "Germe hissini ara"] },
  { id: "sinav", name: "Şınav", region: "gogus", anim: "pushup", equip: "Vücut ağırlığı", level: "Başlangıç",
    sets: "3 x 12-20", desc: "Ekipmansız klasik göğüs hareketi. Vücudu düz bir çizgi halinde tut.",
    tips: ["Kalçayı düşürme", "Dirsekleri 45° aç", "Tam in-çık"] },
  { id: "diamond-pushup", name: "Elmas Şınav", region: "gogus", anim: "pushup", equip: "Vücut ağırlığı", level: "Orta",
    sets: "3 x 12", desc: "Eller bitişik; iç göğüs ve triceps vurgusu.", tips: ["Eller elmas şekli", "Dirsekler gövdeye yakın"] },
  { id: "incline-pushup", name: "Eğimli Şınav", region: "gogus", anim: "pushup", equip: "Vücut ağırlığı", level: "Başlangıç",
    sets: "3 x 15", desc: "Eller yüksekte; daha kolay varyasyon, alt göğüs.", tips: ["Sehpa/sıra kullan"] },
  { id: "cable-crossover", name: "Cable Crossover", region: "gogus", anim: "benchpress", equip: "Makine", level: "Orta",
    sets: "3 x 15", desc: "Makarada kolları önde birleştirerek göğsü sıkıştırır.", tips: ["Hafif öne eğil", "Tepede sık"] },
  { id: "chest-dips", name: "Dips (Göğüs)", region: "gogus", anim: "pushup", equip: "Paralel bar", level: "İleri",
    sets: "3 x 10", desc: "Öne eğilerek yapılan dips; alt göğsü hedefler.", tips: ["Öne eğil", "Kontrollü in"] },

  // ============ SIRT ============
  { id: "barfiks", name: "Barfiks (Pull-up)", region: "sirt", anim: "pullup", equip: "Bar", level: "İleri",
    sets: "4 x maks", desc: "Çeneyi barın üstüne çekerek sırt genişliğini geliştirir.", tips: ["Tam asıl", "Sırtla çek, kolla değil"] },
  { id: "chin-up", name: "Chin-up (Ters Tutuş)", region: "sirt", anim: "pullup", equip: "Bar", level: "Orta",
    sets: "4 x maks", desc: "Avuçlar sana dönük barfiks; biceps de devreye girer.", tips: ["Tam aşağı in"] },
  { id: "lat-pulldown", name: "Lat Pulldown", region: "sirt", anim: "pullup", equip: "Makine", level: "Başlangıç",
    sets: "4 x 12", desc: "Barfiksin makineli, ayarlanabilir versiyonu.", tips: ["Göğse doğru çek", "Sallanma"] },
  { id: "barbell-row", name: "Barbell Row", region: "sirt", anim: "deadlift", equip: "Halter", level: "Orta",
    sets: "4 x 10", desc: "Öne eğilip halteri karına çek. Sırt kalınlığı için temel.", tips: ["Bel düz kalsın", "Dirsekleri geriye çek"] },
  { id: "dumbbell-row", name: "Dumbbell Row", region: "sirt", anim: "deadlift", equip: "Dumbbell", level: "Başlangıç",
    sets: "3 x 12", desc: "Tek kol dumbbell çekişi; sırt kası izolasyonu.", tips: ["Sehpaya yaslan", "Yukarı çek"] },
  { id: "t-bar-row", name: "T-Bar Row", region: "sirt", anim: "deadlift", equip: "Makine", level: "Orta",
    sets: "4 x 10", desc: "Orta sırt yoğunluğu için kalın tutuşlu çekiş.", tips: ["Göğsü dik tut"] },
  { id: "seated-row", name: "Seated Cable Row", region: "sirt", anim: "deadlift", equip: "Makine", level: "Başlangıç",
    sets: "4 x 12", desc: "Oturarak makara çekişi; orta sırt.", tips: ["Omuzları geriye al", "Beli sabit tut"] },
  { id: "deadlift", name: "Deadlift", region: "sirt", anim: "deadlift", equip: "Halter", level: "İleri",
    sets: "4 x 5", desc: "Tüm arka zinciri çalıştıran bileşik hareket.", tips: ["Bel asla yuvarlanmasın", "Bara yakın kaldır", "Kalçayı öne it"] },
  { id: "romanian-deadlift", name: "Romanian Deadlift", region: "sirt", anim: "deadlift", equip: "Halter", level: "Orta",
    sets: "4 x 8", desc: "Dizler hafif kırık, kalça menteşesiyle hamstring ve bel.", tips: ["Kalçayı geri it", "Bar bacağa yakın"] },
  { id: "hyperextension", name: "Hyperextension", region: "sirt", anim: "deadlift", equip: "Makine", level: "Başlangıç",
    sets: "3 x 15", desc: "Bel (lumbar) ve kalça için izolasyon.", tips: ["Aşırı geriye gitme"] },

  // ============ OMUZ ============
  { id: "shoulder-press", name: "Omuz Press", region: "omuz", anim: "shoulderpress", equip: "Dumbbell", level: "Orta",
    sets: "4 x 10", desc: "Ağırlığı baş üstüne it. Omuz kütlesinin temeli.", tips: ["Beli yaylandırma", "Tam yukarı uzan"] },
  { id: "military-press", name: "Military Press", region: "omuz", anim: "shoulderpress", equip: "Halter", level: "İleri",
    sets: "4 x 6-8", desc: "Ayakta halterle baş üstü press; tüm omuz ve core.", tips: ["Karın sıkı", "Bar çene hizasından çıkar"] },
  { id: "arnold-press", name: "Arnold Press", region: "omuz", anim: "shoulderpress", equip: "Dumbbell", level: "İleri",
    sets: "3 x 10", desc: "Dönerek yapılan omuz press; tüm omuz başlarını çalıştırır.", tips: ["Yavaş döndür"] },
  { id: "lateral-raise", name: "Yan Kaldırış", region: "omuz", anim: "shoulderpress", equip: "Dumbbell", level: "Başlangıç",
    sets: "3 x 15", desc: "Kolları yanlara açarak omuz genişliği kazandırır.", tips: ["Dirsek hafif kırık", "Omuz yüksekliğinde dur"] },
  { id: "front-raise", name: "Ön Kaldırış", region: "omuz", anim: "shoulderpress", equip: "Dumbbell", level: "Başlangıç",
    sets: "3 x 12", desc: "Kolları öne kaldırarak ön omuzu hedefler.", tips: ["Sallanma", "Kontrollü indir"] },
  { id: "rear-delt-fly", name: "Arka Omuz Fly", region: "omuz", anim: "deadlift", equip: "Dumbbell", level: "Orta",
    sets: "3 x 15", desc: "Öne eğilip kolları açarak arka omuzu çalıştırır.", tips: ["Hafif ağırlık", "Sık"] },
  { id: "upright-row", name: "Upright Row", region: "omuz", anim: "deadlift", equip: "Halter", level: "Orta",
    sets: "3 x 12", desc: "Barı çeneye doğru dik çekiş; omuz ve trapez.", tips: ["Dirsek yüksekte"] },
  { id: "shrug", name: "Shrug (Trapez)", region: "omuz", anim: "calfraise", equip: "Dumbbell", level: "Başlangıç",
    sets: "4 x 15", desc: "Omuzları yukarı silkerek trapez kasını çalıştırır.", tips: ["Tepede 1 sn dur", "Yuvarlama"] },

  // ============ KOL ============
  { id: "biceps-curl", name: "Biceps Curl", region: "kol", anim: "curl", equip: "Dumbbell", level: "Başlangıç",
    sets: "3 x 12", desc: "Ön kolu bükerek biceps kasını izole eder.", tips: ["Dirseği sabit tut", "Sallanma"] },
  { id: "barbell-curl", name: "Barbell Curl", region: "kol", anim: "curl", equip: "Halter", level: "Başlangıç",
    sets: "4 x 10", desc: "Halterle çift kol biceps curl; kütle için temel.", tips: ["Dirsekleri sabitle"] },
  { id: "hammer-curl", name: "Hammer Curl", region: "kol", anim: "curl", equip: "Dumbbell", level: "Başlangıç",
    sets: "3 x 12", desc: "Nötr tutuşla biceps ve ön kol.", tips: ["Bilek düz"] },
  { id: "concentration-curl", name: "Concentration Curl", region: "kol", anim: "curl", equip: "Dumbbell", level: "Orta",
    sets: "3 x 12", desc: "Dirseği dize yaslayarak tam izolasyon.", tips: ["Tepede sık", "Yavaş indir"] },
  { id: "preacher-curl", name: "Preacher Curl", region: "kol", anim: "curl", equip: "Makine", level: "Orta",
    sets: "3 x 10", desc: "Eğimli destek üzerinde biceps izolasyonu.", tips: ["Tam aşağı in"] },
  { id: "triceps-pushdown", name: "Triceps Pushdown", region: "kol", anim: "curl", equip: "Makine", level: "Başlangıç",
    sets: "3 x 15", desc: "Makarada barı aşağı iterek triceps çalıştırır.", tips: ["Dirsekleri gövdeye sabitle"] },
  { id: "overhead-extension", name: "Overhead Triceps Ext.", region: "kol", anim: "shoulderpress", equip: "Dumbbell", level: "Orta",
    sets: "3 x 12", desc: "Baş üstünde ağırlığı uzatarak triceps uzun başı.", tips: ["Dirsekler sabit", "Tam uzat"] },
  { id: "skull-crusher", name: "Skull Crusher", region: "kol", anim: "benchpress", equip: "Halter", level: "Orta",
    sets: "3 x 10", desc: "Yatarak barı alına indirip uzatma; triceps.", tips: ["Dirsekleri sabit tut"] },
  { id: "triceps-dips", name: "Dips (Triceps)", region: "kol", anim: "pushup", equip: "Vücut ağırlığı", level: "Orta",
    sets: "3 x 12", desc: "Vücudu aşağı indirip iterek triceps çalıştırır.", tips: ["Dirsekleri geride tut"] },

  // ============ BACAK ============
  { id: "squat", name: "Squat", region: "bacak", anim: "squat", equip: "Halter/Vücut", level: "Orta",
    sets: "4 x 8-12", desc: "Bacak gününün kralı. Tüm alt vücudu çalıştırır.", tips: ["Kalçayı geriye it", "Sırt düz", "Diz parmak ucu yönünde"] },
  { id: "front-squat", name: "Front Squat", region: "bacak", anim: "squat", equip: "Halter", level: "İleri",
    sets: "4 x 8", desc: "Bar önde; quadriceps ve core vurgusu.", tips: ["Dirsekler yukarı", "Gövde dik"] },
  { id: "goblet-squat", name: "Goblet Squat", region: "bacak", anim: "squat", equip: "Dumbbell", level: "Başlangıç",
    sets: "3 x 12", desc: "Göğüs önünde dumbbell ile squat; başlangıç dostu.", tips: ["Derin in", "Topuklar yerde"] },
  { id: "leg-press", name: "Leg Press", region: "bacak", anim: "squat", equip: "Makine", level: "Başlangıç",
    sets: "4 x 12", desc: "Makinede bacakla platformu itme; güvenli kuvvet.", tips: ["Dizleri kilitleme"] },
  { id: "leg-extension", name: "Leg Extension", region: "bacak", anim: "squat", equip: "Makine", level: "Başlangıç",
    sets: "3 x 15", desc: "Quadriceps izolasyonu.", tips: ["Tepede sık", "Kontrollü indir"] },
  { id: "lunge", name: "Lunge (Hamle)", region: "bacak", anim: "lunge", equip: "Dumbbell/Vücut", level: "Başlangıç",
    sets: "3 x 12", desc: "Öne adım atıp çök. Denge ve bacak gücü.", tips: ["Arka diz yere yaklaşsın", "Gövde dik"] },
  { id: "bulgarian", name: "Bulgarian Split Squat", region: "bacak", anim: "lunge", equip: "Dumbbell", level: "İleri",
    sets: "3 x 10", desc: "Arka ayak yükseltilmiş tek bacak squat.", tips: ["Yavaş in", "Denge kur"] },
  { id: "step-up", name: "Step-up", region: "bacak", anim: "lunge", equip: "Dumbbell/Vücut", level: "Başlangıç",
    sets: "3 x 12", desc: "Yüksek bir platforma adımla çıkış.", tips: ["Topukla it", "Kontrollü in"] },
  { id: "leg-curl", name: "Leg Curl (Hamstring)", region: "bacak", anim: "lunge", equip: "Makine", level: "Başlangıç",
    sets: "3 x 15", desc: "Arka bacak (hamstring) izolasyonu.", tips: ["Tam büküp aç"] },
  { id: "hip-thrust", name: "Hip Thrust", region: "bacak", anim: "deadlift", equip: "Halter", level: "Orta",
    sets: "4 x 10", desc: "Kalçayı yukarı iterek glute (kalça) gücü.", tips: ["Tepede sık", "Çene içeride"] },
  { id: "calf-raise", name: "Calf Raise (Baldır)", region: "bacak", anim: "calfraise", equip: "Vücut/Dumbbell", level: "Başlangıç",
    sets: "4 x 20", desc: "Topukları kaldırarak baldırı çalıştırır.", tips: ["Tepede 1 sn dur", "Tam aşağı in"] },

  // ============ KARIN ============
  { id: "crunch", name: "Mekik (Crunch)", region: "karin", anim: "crunch", equip: "Vücut ağırlığı", level: "Başlangıç",
    sets: "3 x 20", desc: "Üst karın için temel hareket.", tips: ["Boynu çekme", "Karnı sık"] },
  { id: "situp", name: "Sit-up", region: "karin", anim: "crunch", equip: "Vücut ağırlığı", level: "Başlangıç",
    sets: "3 x 15", desc: "Tam gövde kalkışı; tüm karın.", tips: ["Kontrollü kalk", "Beli koru"] },
  { id: "leg-raise", name: "Bacak Kaldırma", region: "karin", anim: "crunch", equip: "Vücut ağırlığı", level: "Orta",
    sets: "3 x 15", desc: "Alt karın bölgesini hedefler.", tips: ["Beli yere yapıştır"] },
  { id: "bicycle-crunch", name: "Bisiklet Mekiği", region: "karin", anim: "crunch", equip: "Vücut ağırlığı", level: "Orta",
    sets: "3 x 20", desc: "Çapraz dirsek-diz; oblik (yan karın) çalışır.", tips: ["Yavaş ve kontrollü"] },
  { id: "russian-twist", name: "Russian Twist", region: "karin", anim: "crunch", equip: "Vücut/Plaka", level: "Orta",
    sets: "3 x 20", desc: "Gövdeyi sağa-sola çevirerek oblikleri çalıştırır.", tips: ["Ayaklar havada zorlaşır"] },
  { id: "flutter-kicks", name: "Flutter Kicks", region: "karin", anim: "crunch", equip: "Vücut ağırlığı", level: "Başlangıç",
    sets: "3 x 30 sn", desc: "Bacakları sırayla çırparak alt karın.", tips: ["Bel yerde sabit"] },
  { id: "plank", name: "Plank", region: "karin", anim: "plank", equip: "Vücut ağırlığı", level: "Başlangıç",
    sets: "3 x 40 sn", desc: "İzometrik core dayanıklılığı.", tips: ["Kalça düz", "Karın kasılı"] },
  { id: "side-plank", name: "Yan Plank", region: "karin", anim: "plank", equip: "Vücut ağırlığı", level: "Orta",
    sets: "3 x 30 sn", desc: "Yan duruşta oblik ve core stabilizasyonu.", tips: ["Kalçayı düşürme"] },
  { id: "mountain-climber-ab", name: "Mountain Climber", region: "karin", anim: "pushup", equip: "Vücut ağırlığı", level: "Orta",
    sets: "3 x 40 sn", desc: "Plank pozunda dizleri sırayla göğse çekme.", tips: ["Kalça sabit", "Hızlı tempo"] },
  { id: "hanging-leg-raise", name: "Asılı Bacak Kaldırma", region: "karin", anim: "pullup", equip: "Bar", level: "İleri",
    sets: "3 x 12", desc: "Bara asılıyken bacakları kaldırma; güçlü alt karın.", tips: ["Sallanma", "Kontrollü"] },

  // ============ KARDİYO ============
  { id: "jumping-jack", name: "Jumping Jack", region: "kardiyo", anim: "jumpingjack", equip: "Vücut ağırlığı", level: "Başlangıç",
    sets: "3 x 45 sn", desc: "Tüm vücut ısınma ve kardiyo hareketi.", tips: ["Ritmi koru"] },
  { id: "high-knees", name: "High Knees", region: "kardiyo", anim: "jumpingjack", equip: "Vücut ağırlığı", level: "Başlangıç",
    sets: "3 x 30 sn", desc: "Dizleri hızla kaldırarak nabız yükseltir.", tips: ["Hızlı tempo", "Kollar aktif"] },
  { id: "butt-kicks", name: "Butt Kicks", region: "kardiyo", anim: "jumpingjack", equip: "Vücut ağırlığı", level: "Başlangıç",
    sets: "3 x 30 sn", desc: "Topukları kalçaya vurarak ısınma/kardiyo.", tips: ["Tempolu", "Hamstring ısınır"] },
  { id: "burpee", name: "Burpee", region: "kardiyo", anim: "squat", equip: "Vücut ağırlığı", level: "İleri",
    sets: "3 x 12", desc: "Squat + şınav + sıçrama. Yüksek yoğunluk.", tips: ["Akıcı geçişler"] },
  { id: "jump-squat", name: "Jump Squat", region: "kardiyo", anim: "squat", equip: "Vücut ağırlığı", level: "Orta",
    sets: "3 x 15", desc: "Patlayıcı squat sıçrayışı; güç + kardiyo.", tips: ["Yumuşak in", "Diz içe kaçmasın"] },
  { id: "box-jump", name: "Box Jump", region: "kardiyo", anim: "squat", equip: "Kutu/Platform", level: "Orta",
    sets: "3 x 12", desc: "Platforma patlayıcı sıçrama.", tips: ["Tam üstüne in", "Kontrollü dön"] },
  { id: "mountain-climber", name: "Mountain Climber", region: "kardiyo", anim: "pushup", equip: "Vücut ağırlığı", level: "Orta",
    sets: "3 x 45 sn", desc: "Plank pozunda hızlı diz çekişi; kardiyo + core.", tips: ["Kalça sabit"] },
  { id: "skater", name: "Skater Jumps", region: "kardiyo", anim: "lunge", equip: "Vücut ağırlığı", level: "Orta",
    sets: "3 x 40 sn", desc: "Yana sıçrayışlarla denge ve kondisyon.", tips: ["Yumuşak in"] },
  { id: "jump-rope", name: "İp Atlama", region: "kardiyo", anim: "calfraise", equip: "İp", level: "Başlangıç",
    sets: "3 x 60 sn", desc: "Klasik yağ yakım ve baldır kardiyosu.", tips: ["Bileğinden çevir", "Küçük sıçra"] },

  // ============ EK HAREKETLER ============
  // göğüs
  { id: "incline-dumbbell-press", name: "Eğimli Dumbbell Press", region: "gogus", anim: "benchpress", equip: "Dumbbell", level: "Orta",
    sets: "4 x 10", desc: "Eğimli sehpada dumbbell ile üst göğüs.", tips: ["30-45° eğim", "Tepede sıkıştır"] },
  { id: "machine-chest-press", name: "Machine Chest Press", region: "gogus", anim: "benchpress", equip: "Makine", level: "Başlangıç",
    sets: "4 x 12", desc: "Makinede güvenli göğüs itişi; başlangıç dostu.", tips: ["Tam aç-kapa", "Omuz geride"] },
  { id: "pec-deck", name: "Pec Deck (Butterfly)", region: "gogus", anim: "benchpress", equip: "Makine", level: "Başlangıç",
    sets: "3 x 15", desc: "Makinede kolları önde birleştirerek göğüs izolasyonu.", tips: ["Tepede sık", "Yavaş aç"] },
  // sırt
  { id: "good-morning", name: "Good Morning", region: "sirt", anim: "deadlift", equip: "Halter", level: "Orta",
    sets: "3 x 10", desc: "Kalça menteşesiyle bel ve hamstring.", tips: ["Bel düz", "Dizler hafif kırık"] },
  { id: "rack-pull", name: "Rack Pull", region: "sirt", anim: "deadlift", equip: "Halter", level: "İleri",
    sets: "4 x 6", desc: "Kısmi deadlift; üst sırt ve trapez gücü.", tips: ["Bara yakın", "Kalçayı it"] },
  { id: "v-bar-pulldown", name: "V-Bar Pulldown", region: "sirt", anim: "pullup", equip: "Makine", level: "Başlangıç",
    sets: "4 x 12", desc: "Dar tutuşla orta sırt yoğunluğu.", tips: ["Göğse çek", "Sallanma"] },
  // omuz
  { id: "face-pull", name: "Face Pull", region: "omuz", anim: "deadlift", equip: "Makine", level: "Başlangıç",
    sets: "3 x 15", desc: "Halatı yüze çekerek arka omuz ve postür.", tips: ["Dirsek yüksek", "Sık"] },
  { id: "cable-lateral", name: "Cable Yan Kaldırış", region: "omuz", anim: "shoulderpress", equip: "Makine", level: "Başlangıç",
    sets: "3 x 15", desc: "Makarada sabit gerginlikle yan omuz.", tips: ["Kontrollü kaldır"] },
  // kol
  { id: "close-grip-bench", name: "Close-Grip Bench Press", region: "kol", anim: "benchpress", equip: "Halter", level: "Orta",
    sets: "3 x 8", desc: "Dar tutuş bench; triceps vurgusu.", tips: ["Dirsekler gövdeye yakın"] },
  { id: "triceps-kickback", name: "Triceps Kickback", region: "kol", anim: "curl", equip: "Dumbbell", level: "Başlangıç",
    sets: "3 x 15", desc: "Öne eğilip kolu geriye uzatarak triceps.", tips: ["Üst kol sabit", "Tepede sık"] },
  { id: "cable-hammer-curl", name: "Cable Hammer Curl", region: "kol", anim: "curl", equip: "Makine", level: "Başlangıç",
    sets: "3 x 12", desc: "Halatla nötr tutuş biceps/ön kol.", tips: ["Dirsek sabit"] },
  { id: "spider-curl", name: "Spider Curl", region: "kol", anim: "curl", equip: "Dumbbell", level: "Orta",
    sets: "3 x 12", desc: "Eğimli sehpaya yüzükoyun yatıp biceps izolasyonu.", tips: ["Tam izolasyon", "Sallanma yok"] },
  { id: "zottman-curl", name: "Zottman Curl", region: "kol", anim: "curl", equip: "Dumbbell", level: "Orta",
    sets: "3 x 10", desc: "Yukarı normal, aşağı ters tutuş; biceps + ön kol.", tips: ["Tepede bileği çevir"] },
  // bacak
  { id: "hack-squat", name: "Hack Squat", region: "bacak", anim: "squat", equip: "Makine", level: "Orta",
    sets: "4 x 10", desc: "Makinede quadriceps odaklı squat.", tips: ["Derin in", "Sırt desteğe yaslı"] },
  { id: "sumo-deadlift", name: "Sumo Deadlift", region: "bacak", anim: "deadlift", equip: "Halter", level: "İleri",
    sets: "4 x 6", desc: "Geniş duruş deadlift; iç bacak ve kalça.", tips: ["Göğüs dik", "Bara yakın"] },
  { id: "glute-kickback", name: "Glute Kickback", region: "bacak", anim: "lunge", equip: "Makine", level: "Başlangıç",
    sets: "3 x 15", desc: "Bacağı geriye iterek kalça (glute) izolasyonu.", tips: ["Tepede sık", "Beli koru"] },
  { id: "seated-calf-raise", name: "Seated Calf Raise", region: "bacak", anim: "calfraise", equip: "Makine", level: "Başlangıç",
    sets: "4 x 20", desc: "Oturarak baldır (soleus) çalışması.", tips: ["Tam aşağı in", "Tepede dur"] },
  { id: "glute-bridge", name: "Glute Bridge", region: "bacak", anim: "deadlift", equip: "Vücut ağırlığı", level: "Başlangıç",
    sets: "3 x 15", desc: "Sırt üstü kalçayı yukarı iterek glute.", tips: ["Tepede sık", "Çene içeride"] },
  // karın
  { id: "cable-crunch", name: "Cable Crunch", region: "karin", anim: "crunch", equip: "Makine", level: "Orta",
    sets: "3 x 15", desc: "Makarada diz çöküp gövdeyi büküp üst karın.", tips: ["Karınla çek", "Kalça sabit"] },
  { id: "reverse-crunch", name: "Reverse Crunch", region: "karin", anim: "crunch", equip: "Vücut ağırlığı", level: "Orta",
    sets: "3 x 15", desc: "Kalçayı yukarı sararak alt karın.", tips: ["Sallanma", "Kontrollü"] },
  { id: "toe-touches", name: "Toe Touches", region: "karin", anim: "crunch", equip: "Vücut ağırlığı", level: "Başlangıç",
    sets: "3 x 20", desc: "Bacaklar havada el-ayak ucuna uzanma; üst karın.", tips: ["Karnı sık"] },
  { id: "ab-roller", name: "Ab Wheel", region: "karin", anim: "plank", equip: "Ekipman", level: "İleri",
    sets: "3 x 10", desc: "Tekerlekle öne açılıp toplanarak tüm core.", tips: ["Bel çökmesin", "Yavaş aç"] },
  // kardiyo
  { id: "stairmaster", name: "Stairmaster", region: "kardiyo", anim: "lunge", equip: "Makine", level: "Başlangıç",
    sets: "10-20 dk", desc: "Merdiven makinesinde sürekli tempolu kardiyo.", tips: ["Korkuluğa yaslanma", "Tempolu"] },

  // ============ KALİSTENİK (vücut ağırlığı) ============
  // İtme
  { id: "wide-pushup", name: "Geniş Şınav", region: "gogus", anim: "pushup", equip: "Vücut ağırlığı", level: "Başlangıç",
    sets: "3 x 12-20", desc: "Elleri omuzdan geniş açarak dış göğsü daha çok vurgulayan şınav.", tips: ["Vücut düz bir çizgi", "Dirsekleri ~45° aç", "Tam in-çık"] },
  { id: "decline-pushup", name: "Ayak Yüksek Şınav (Decline)", region: "gogus", anim: "pushup", equip: "Vücut ağırlığı", level: "Orta",
    sets: "3 x 12-15", desc: "Ayaklar yüksek bir yüzeyde; üst göğüs ve ön omuz vurgusu artar.", tips: ["Kalçayı düşürme", "Kontrollü in", "Core sıkı"] },
  { id: "archer-pushup", name: "Archer Şınav", region: "gogus", anim: "pushup", equip: "Vücut ağırlığı", level: "İleri",
    sets: "3 x 6-10", desc: "Ağırlığı tek kola verip diğer kolu yana açarak yapılan şınav; tek kol şınava köprü.", tips: ["Açık kol düz kalsın", "Yükü çalışan kola ver", "Yavaş kontrol"] },
  { id: "pseudo-planche-pushup", name: "Pseudo Planche Şınav", region: "gogus", anim: "pushup", equip: "Vücut ağırlığı", level: "İleri",
    sets: "3 x 6-10", desc: "Eller bele yakın, gövde öne eğik; ön omuz ve iç göğse yüklenir, planche hazırlığı.", tips: ["Eller bel hizasında", "Öne eğil", "Omuzları öne it"] },
  { id: "pike-pushup", name: "Pike Şınav", region: "omuz", anim: "shoulderpress", equip: "Vücut ağırlığı", level: "Orta",
    sets: "3 x 8-12", desc: "Kalça yukarıda ters V; başı yere indirerek omuzu hedefler, amuda şınava hazırlık.", tips: ["Kalça yukarı", "Başı ellerin önüne indir", "Dirsekleri çok açma"] },
  { id: "handstand-pushup", name: "Amuda Şınav (Duvar)", region: "omuz", anim: "shoulderpress", equip: "Vücut ağırlığı", level: "İleri",
    sets: "3 x 3-8", desc: "Duvara yaslı amuda kalkıp başı indirerek omuz pres; güçlü omuz hareketi.", tips: ["Duvar desteği al", "Kontrollü in", "Core ve glute sıkı"] },
  // Çekme
  { id: "inverted-row", name: "Avustralya Barfiksi (Inverted Row)", region: "sirt", anim: "pullup", equip: "Bar", level: "Başlangıç",
    sets: "3 x 8-15", desc: "Bara yatay asılıp göğsü bara çekmek; barfikse hazırlık ve yatay çekiş.", tips: ["Vücut düz", "Kürekleri sık", "Bar göğse değsin"] },
  { id: "scapular-pull", name: "Skapular Çekiş", region: "sirt", anim: "pullup", equip: "Bar", level: "Başlangıç",
    sets: "3 x 8-12", desc: "Bara asılıyken sadece kürek kemiklerini aşağı-geri çekmek; barfiks için sırt-omuz bağı.", tips: ["Kolları düz tut", "Omuzları kulaktan uzaklaştır", "Küçük ama kontrollü"] },
  { id: "negative-pullup", name: "Negatif Barfiks", region: "sirt", anim: "pullup", equip: "Bar", level: "Başlangıç",
    sets: "3 x 4-6", desc: "Çene bar üstündeyken 3-5 sn yavaşça inmek; barfiks gücü kazanmanın en etkili yolu.", tips: ["Yavaş in (3-5 sn)", "Tam aşağı uzan", "Sıçrayarak yukarı çık"] },
  { id: "muscle-up", name: "Muscle-up", region: "sirt", anim: "pullup", equip: "Bar", level: "İleri",
    sets: "3 x 3-6", desc: "Barfiks + dip birleşimi; barın üstüne çıkan ileri kalistenik hareket.", tips: ["Patlayıcı çekiş", "Bileği çevir", "Önce barfiks+dip güçlensin"] },
  // Bacak
  { id: "pistol-squat", name: "Tek Bacak Squat (Pistol)", region: "bacak", anim: "squat", equip: "Vücut ağırlığı", level: "İleri",
    sets: "3 x 5-8", desc: "Tek bacak üzerinde tam çömelme; bacak gücü ve dengenin zirvesi.", tips: ["Topuk yerde", "Karşı bacak önde düz", "Önce destekli dene"] },
  { id: "wall-sit", name: "Duvar Oturuşu (Wall Sit)", region: "bacak", anim: "squat", equip: "Vücut ağırlığı", level: "Başlangıç",
    sets: "3 x 30-60 sn", desc: "Duvara yaslı 90° oturuş izometrik tutuşu; quadriceps dayanıklılığı.", tips: ["Diz 90°", "Sırt duvarda düz", "Nefes al"] },
  { id: "nordic-curl", name: "Nordic Hamstring", region: "bacak", anim: "lunge", equip: "Vücut ağırlığı", level: "İleri",
    sets: "3 x 4-8", desc: "Diz çökükken ayaklar sabitken gövdeyi yavaş öne bırakma; hamstring için en güçlü eksantrik hareket.", tips: ["Çok yavaş in", "Kalça düz (menteşe yapma)", "Elle iterek geri kalk"] },
  { id: "single-leg-glute-bridge", name: "Tek Bacak Glute Bridge", region: "bacak", anim: "deadlift", equip: "Vücut ağırlığı", level: "Başlangıç",
    sets: "3 x 10-15", desc: "Tek bacakla kalçayı yukarı itme; glute izolasyonu ve denge.", tips: ["Tepede sık", "Kalçayı eşit kaldır", "Çene içeride"] },
  // Core
  { id: "hollow-body-hold", name: "Hollow Body Hold", region: "karin", anim: "crunch", equip: "Vücut ağırlığı", level: "Orta",
    sets: "3 x 20-40 sn", desc: "Sırt üstü kol-bacak uzanmış içbükey gövde tutuşu; jimnastik core temeli.", tips: ["Bel yere yapışık", "Omuz ve bacak hafif havada", "Nefesi tutma"] },
  { id: "l-sit", name: "L-Sit", region: "karin", anim: "plank", equip: "Vücut ağırlığı", level: "İleri",
    sets: "3 x 10-20 sn", desc: "Eller yerde/paralelde vücudu kaldırıp bacakları L şeklinde tutmak; güçlü core ve kalça fleksörü.", tips: ["Omuzları aşağı bas", "Bacaklar düz", "Önce diz çekili (tuck) dene"] },
  { id: "v-up", name: "V-Up", region: "karin", anim: "crunch", equip: "Vücut ağırlığı", level: "Orta",
    sets: "3 x 12-15", desc: "Kol ve bacakları aynı anda kaldırıp V oluşturmak; tüm karın.", tips: ["Kontrollü kalk-in", "Bacaklar düz", "Sallanma"] },
  { id: "dragon-flag", name: "Dragon Flag", region: "karin", anim: "plank", equip: "Vücut ağırlığı", level: "İleri",
    sets: "3 x 5-8", desc: "Omuzlardan destek alıp tüm vücudu düz tutarak indirme; çok güçlü core hareketi.", tips: ["Vücut tek parça düz", "Yavaş in", "Bel çökmesin"] },
  { id: "superman", name: "Superman", region: "sirt", anim: "plank", equip: "Vücut ağırlığı", level: "Başlangıç",
    sets: "3 x 12-15", desc: "Yüzüstü kol-bacak yukarı kaldırma; bel (erector spinae) ve glute.", tips: ["Tepede 1-2 sn dur", "Boynu zorlama", "Kontrollü"] },
];

// Tüm hareketler = el ile hazırlananlar + free-exercise-db'den içe aktarılanlar.
export const EXERCISES = [...CURATED, ...GENERATED];

export function exercisesByRegion(regionId) {
  return EXERCISES.filter(function (e) { return e.region === regionId; });
}

export function getExercise(id) {
  return EXERCISES.find(function (e) { return e.id === id; }) || null;
}

// Araştırmaya (EMG çalışmaları / meta-analizler) dayalı en etkili hareketler.
export const TOP_EXERCISES = {
  "squat": "EMG çalışmaları: bacak kaslarında en yüksek aktivasyon.",
  "bench-press": "Meta-analiz: geniş tutuş düz bench, göğüste en yüksek aktivasyonu sağlar.",
  "incline-press": "15-30° eğim üst göğsü, omuzu fazla katmadan optimal çalıştırır.",
  "pec-deck": "Makineli göğüs hareketleri arasında EMG'de en yüksek aktivasyon.",
  "barfiks": "EMG verisi: sırt için en etkili hareket.",
  "barbell-row": "Sırt kalınlığı için en yüksek aktivasyonlu çekişlerden.",
  "deadlift": "Tüm arka zinciri çalıştıran en verimli bileşik hareket.",
  "military-press": "EMG: omuz için en etkili — overhead barbell press.",
  "shoulder-press": "Omuz kütlesi için en yüksek aktivasyonlu preslerden.",
  "romanian-deadlift": "Hamstring ve glute için en etkili hareketlerden.",
  "sinav": "Araştırma: yeterli zorlukta (başarısızlığa yakın) yapılan şınav, göğüs gelişiminde bench press'e yakın sonuç verir.",
  "inverted-row": "Yatay çekişin en erişilebilir hali; itme hacmini dengelemek ve duruş için kanıtlı seçim.",
  "pistol-squat": "Tek taraflı bacak gücü ve denge için en etkili vücut ağırlığı hareketi.",
  "nordic-curl": "Eksantrik hamstring çalışması; hamstring gücü ve sakatlık önlemede öne çıkar.",
};

export function topNote(id) {
  return TOP_EXERCISES[id] || null;
}

// Muadil (alternatif) hareketler — salonda alet yoksa aynı kası çalıştıran seçenekler.
export const ALTERNATIVES = {
  // göğüs
  "bench-press": ["dumbbell-press", "machine-chest-press", "sinav"],
  "incline-press": ["incline-dumbbell-press", "sinav"],
  "decline-press": ["dumbbell-press", "chest-dips"],
  "dumbbell-press": ["bench-press", "machine-chest-press", "sinav"],
  "machine-chest-press": ["dumbbell-press", "sinav"],
  "cable-crossover": ["dumbbell-fly", "pec-deck"],
  "pec-deck": ["dumbbell-fly", "cable-crossover"],
  "dumbbell-fly": ["pec-deck", "cable-crossover"],
  "chest-dips": ["sinav", "triceps-dips", "archer-pushup"],
  "sinav": ["machine-chest-press", "dumbbell-press", "chest-dips", "wide-pushup", "decline-pushup"],
  "incline-dumbbell-press": ["incline-press", "dumbbell-press"],
  // sırt
  "lat-pulldown": ["barfiks", "v-bar-pulldown", "dumbbell-row", "inverted-row"],
  "v-bar-pulldown": ["lat-pulldown", "barfiks"],
  "barfiks": ["lat-pulldown", "v-bar-pulldown", "inverted-row", "negative-pullup"],
  "chin-up": ["barfiks", "lat-pulldown", "negative-pullup"],
  "barbell-row": ["dumbbell-row", "t-bar-row", "seated-row"],
  "t-bar-row": ["barbell-row", "dumbbell-row"],
  "seated-row": ["dumbbell-row", "barbell-row"],
  "dumbbell-row": ["barbell-row", "seated-row"],
  "deadlift": ["romanian-deadlift", "sumo-deadlift", "rack-pull"],
  "rack-pull": ["deadlift", "romanian-deadlift"],
  "good-morning": ["romanian-deadlift", "hyperextension"],
  "hyperextension": ["good-morning", "glute-bridge"],
  "romanian-deadlift": ["good-morning", "leg-curl", "deadlift"],
  // omuz
  "shoulder-press": ["military-press", "arnold-press", "pike-pushup"],
  "military-press": ["shoulder-press", "arnold-press", "pike-pushup"],
  "arnold-press": ["shoulder-press", "military-press"],
  "lateral-raise": ["cable-lateral"],
  "cable-lateral": ["lateral-raise"],
  "front-raise": ["lateral-raise"],
  "face-pull": ["rear-delt-fly", "upright-row"],
  "rear-delt-fly": ["face-pull"],
  "upright-row": ["lateral-raise", "shrug"],
  "shrug": ["upright-row"],
  // kol
  "biceps-curl": ["barbell-curl", "hammer-curl", "cable-hammer-curl"],
  "barbell-curl": ["biceps-curl", "hammer-curl"],
  "hammer-curl": ["biceps-curl", "cable-hammer-curl"],
  "cable-hammer-curl": ["hammer-curl", "biceps-curl"],
  "preacher-curl": ["barbell-curl", "concentration-curl", "spider-curl"],
  "concentration-curl": ["biceps-curl", "preacher-curl"],
  "spider-curl": ["preacher-curl", "concentration-curl"],
  "zottman-curl": ["hammer-curl", "biceps-curl"],
  "triceps-pushdown": ["triceps-dips", "overhead-extension", "skull-crusher"],
  "overhead-extension": ["triceps-pushdown", "skull-crusher"],
  "skull-crusher": ["triceps-pushdown", "overhead-extension", "close-grip-bench"],
  "close-grip-bench": ["triceps-dips", "skull-crusher"],
  "triceps-kickback": ["triceps-pushdown", "overhead-extension"],
  "triceps-dips": ["sinav", "triceps-pushdown"],
  // bacak
  "squat": ["goblet-squat", "leg-press", "hack-squat", "front-squat", "pistol-squat", "wall-sit"],
  "front-squat": ["squat", "goblet-squat"],
  "goblet-squat": ["squat", "leg-press"],
  "leg-press": ["squat", "goblet-squat", "hack-squat", "lunge"],
  "hack-squat": ["squat", "leg-press", "front-squat"],
  "leg-extension": ["squat", "lunge", "leg-press"],
  "leg-curl": ["romanian-deadlift", "glute-bridge", "good-morning", "nordic-curl"],
  "lunge": ["bulgarian", "step-up", "squat"],
  "bulgarian": ["lunge", "step-up"],
  "step-up": ["lunge", "bulgarian"],
  "hip-thrust": ["glute-bridge", "romanian-deadlift"],
  "glute-bridge": ["hip-thrust", "glute-kickback"],
  "glute-kickback": ["glute-bridge", "hip-thrust"],
  "sumo-deadlift": ["deadlift", "romanian-deadlift"],
  "calf-raise": ["seated-calf-raise"],
  "seated-calf-raise": ["calf-raise"],
  // karın
  "cable-crunch": ["crunch", "situp", "reverse-crunch"],
  "ab-roller": ["plank", "crunch"],
  "hanging-leg-raise": ["leg-raise", "reverse-crunch"],
  // kardiyo
  "stairmaster": ["high-knees", "jump-rope", "step-up"],
  "box-jump": ["jump-squat", "squat"],
  // kalistenik (muadiller: alet yoksa / zorluk ayarı)
  "wide-pushup": ["sinav", "decline-pushup", "chest-dips"],
  "decline-pushup": ["sinav", "archer-pushup", "pike-pushup"],
  "archer-pushup": ["sinav", "diamond-pushup", "decline-pushup"],
  "pseudo-planche-pushup": ["archer-pushup", "pike-pushup", "sinav"],
  "pike-pushup": ["handstand-pushup", "shoulder-press", "decline-pushup"],
  "handstand-pushup": ["pike-pushup", "military-press", "shoulder-press"],
  "inverted-row": ["barfiks", "negative-pullup", "dumbbell-row"],
  "scapular-pull": ["negative-pullup", "inverted-row", "barfiks"],
  "negative-pullup": ["inverted-row", "scapular-pull", "lat-pulldown"],
  "muscle-up": ["barfiks", "chest-dips", "negative-pullup"],
  "pistol-squat": ["bulgarian", "squat", "wall-sit"],
  "wall-sit": ["squat", "leg-extension", "goblet-squat"],
  "nordic-curl": ["leg-curl", "romanian-deadlift", "glute-bridge"],
  "single-leg-glute-bridge": ["glute-bridge", "hip-thrust"],
  "hollow-body-hold": ["plank", "leg-raise", "Dead_Bug"],
  "l-sit": ["hanging-leg-raise", "hollow-body-hold", "v-up"],
  "v-up": ["crunch", "hollow-body-hold", "toe-touches"],
  "dragon-flag": ["hanging-leg-raise", "reverse-crunch", "l-sit"],
  "superman": ["hyperextension", "good-morning", "glute-bridge"],
};

export function getAlternatives(id) {
  const ids = ALTERNATIVES[id] || [];
  return ids.map(getExercise).filter(Boolean);
}

// ---- Bölge içi kas alt-grupları (anatomik hedefe göre) ----
// Her bölgenin alt-grup gösterim sırası. Kardiyo gruplanmaz (düz liste).
export const SUBGROUPS = {
  gogus: ["Üst göğüs", "Orta göğüs", "Alt göğüs", "İç / İzolasyon"],
  sirt: ["Genişlik (Lat)", "Kalınlık (Orta sırt)", "Bel (Alt sırt)"],
  omuz: ["Ön omuz", "Yan omuz", "Arka omuz", "Trapez"],
  kol: ["Biceps", "Triceps", "Ön kol"],
  bacak: ["Ön bacak (Quadriceps)", "Arka bacak (Hamstring)", "Kalça (Glute)", "Baldır", "İç bacak"],
  karin: ["Üst karın", "Alt karın", "Yan karın (Oblik)", "Core / İzometrik"],
  kardiyo: [],
};

// El ile hazırlanan hareketlerin alt-grup ataması (id → alt-grup).
const SUB_BY_ID = {
  // göğüs
  "bench-press": "Orta göğüs", "incline-press": "Üst göğüs", "decline-press": "Alt göğüs",
  "dumbbell-press": "Orta göğüs", "dumbbell-fly": "İç / İzolasyon", "sinav": "Orta göğüs",
  "diamond-pushup": "İç / İzolasyon", "incline-pushup": "Alt göğüs", "cable-crossover": "İç / İzolasyon",
  "chest-dips": "Alt göğüs", "incline-dumbbell-press": "Üst göğüs", "machine-chest-press": "Orta göğüs",
  "pec-deck": "İç / İzolasyon", "wide-pushup": "Orta göğüs", "decline-pushup": "Üst göğüs",
  "archer-pushup": "Orta göğüs", "pseudo-planche-pushup": "Üst göğüs",
  // sırt
  "barfiks": "Genişlik (Lat)", "chin-up": "Genişlik (Lat)", "lat-pulldown": "Genişlik (Lat)",
  "barbell-row": "Kalınlık (Orta sırt)", "dumbbell-row": "Kalınlık (Orta sırt)", "t-bar-row": "Kalınlık (Orta sırt)",
  "seated-row": "Kalınlık (Orta sırt)", "deadlift": "Bel (Alt sırt)", "romanian-deadlift": "Bel (Alt sırt)",
  "hyperextension": "Bel (Alt sırt)", "good-morning": "Bel (Alt sırt)", "rack-pull": "Kalınlık (Orta sırt)",
  "v-bar-pulldown": "Genişlik (Lat)", "inverted-row": "Kalınlık (Orta sırt)", "scapular-pull": "Genişlik (Lat)",
  "negative-pullup": "Genişlik (Lat)", "muscle-up": "Genişlik (Lat)", "superman": "Bel (Alt sırt)",
  // omuz
  "shoulder-press": "Ön omuz", "military-press": "Ön omuz", "arnold-press": "Ön omuz",
  "lateral-raise": "Yan omuz", "front-raise": "Ön omuz", "rear-delt-fly": "Arka omuz",
  "upright-row": "Yan omuz", "shrug": "Trapez", "face-pull": "Arka omuz", "cable-lateral": "Yan omuz",
  "pike-pushup": "Ön omuz", "handstand-pushup": "Ön omuz",
  // kol
  "biceps-curl": "Biceps", "barbell-curl": "Biceps", "hammer-curl": "Biceps",
  "concentration-curl": "Biceps", "preacher-curl": "Biceps", "cable-hammer-curl": "Biceps",
  "spider-curl": "Biceps", "zottman-curl": "Biceps",
  "triceps-pushdown": "Triceps", "overhead-extension": "Triceps", "skull-crusher": "Triceps",
  "triceps-dips": "Triceps", "close-grip-bench": "Triceps", "triceps-kickback": "Triceps",
  // bacak
  "squat": "Ön bacak (Quadriceps)", "front-squat": "Ön bacak (Quadriceps)", "goblet-squat": "Ön bacak (Quadriceps)",
  "leg-press": "Ön bacak (Quadriceps)", "leg-extension": "Ön bacak (Quadriceps)", "lunge": "Ön bacak (Quadriceps)",
  "bulgarian": "Ön bacak (Quadriceps)", "step-up": "Ön bacak (Quadriceps)", "hack-squat": "Ön bacak (Quadriceps)",
  "pistol-squat": "Ön bacak (Quadriceps)", "wall-sit": "Ön bacak (Quadriceps)",
  "leg-curl": "Arka bacak (Hamstring)", "nordic-curl": "Arka bacak (Hamstring)",
  "hip-thrust": "Kalça (Glute)", "sumo-deadlift": "Kalça (Glute)", "glute-kickback": "Kalça (Glute)",
  "glute-bridge": "Kalça (Glute)", "single-leg-glute-bridge": "Kalça (Glute)",
  "calf-raise": "Baldır", "seated-calf-raise": "Baldır",
  // karın
  "crunch": "Üst karın", "situp": "Üst karın", "cable-crunch": "Üst karın", "toe-touches": "Üst karın", "v-up": "Üst karın",
  "leg-raise": "Alt karın", "flutter-kicks": "Alt karın", "hanging-leg-raise": "Alt karın", "reverse-crunch": "Alt karın",
  "bicycle-crunch": "Yan karın (Oblik)", "russian-twist": "Yan karın (Oblik)", "side-plank": "Yan karın (Oblik)",
  "plank": "Core / İzometrik", "mountain-climber-ab": "Core / İzometrik", "ab-roller": "Core / İzometrik",
  "hollow-body-hold": "Core / İzometrik", "l-sit": "Core / İzometrik", "dragon-flag": "Core / İzometrik",
};

// Otomatik (free-exercise-db) hareketlerin desc'inden alt-grup çıkar. Sıra
// önemli: özel ifadeler (Üst/Alt Göğüs, Orta Sırt) genel olandan (Göğüs, Sırt)
// önce eşleşmeli.
const GEN_SUB = [
  ["Üst Göğüs", "Üst göğüs"], ["Alt Göğüs", "Alt göğüs"], ["Göğüs", "Orta göğüs"],
  ["Sırt (Lat)", "Genişlik (Lat)"], ["Orta Sırt", "Kalınlık (Orta sırt)"], ["Bel", "Bel (Alt sırt)"],
  ["Ön Bacak", "Ön bacak (Quadriceps)"], ["Arka Bacak", "Arka bacak (Hamstring)"],
  ["Kalça", "Kalça (Glute)"], ["Baldır", "Baldır"], ["İç Bacak", "İç bacak"],
  ["Biceps", "Biceps"], ["Triceps", "Triceps"], ["Ön Kol", "Ön kol"],
];

// Bir hareketin bölge-içi alt-grubu. Önce el ile atama, sonra desc'ten türetme,
// yoksa "Genel" (bölge sonunda gösterilir).
export function subOf(ex) {
  if (!ex) return "Diğer";
  if (SUB_BY_ID[ex.id]) return SUB_BY_ID[ex.id];
  const d = ex.desc || "";
  for (let i = 0; i < GEN_SUB.length; i++) {
    if (d.indexOf(GEN_SUB[i][0]) !== -1) return GEN_SUB[i][1];
  }
  return "Diğer";
}

// ---- Spesifik kas-başı vurgusu (Latince) + bölge-içi anatomik sıralama ----
// Her el-yapımı hareketin EN ÇOK yüklendiği kas/kas-başı. EMG çalışmaları ve
// anatomik kaldıraç ilkelerine göre; bölge içinde bu sıraya göre dizilir.
export const FOCUS = {
  // GÖĞÜS — Pectoralis major (clavicular=üst, sternocostal=orta, abdominal=alt)
  "incline-press": "Üst göğüs · Pectoralis major (pars clavicularis)",
  "incline-dumbbell-press": "Üst göğüs · Pectoralis major (pars clavicularis)",
  "decline-pushup": "Üst göğüs · Pectoralis major (clavicularis) + ön deltoid",
  "pseudo-planche-pushup": "Üst-iç göğüs · Pectoralis major + Deltoideus anterior",
  "bench-press": "Orta göğüs · Pectoralis major (pars sternocostalis)",
  "dumbbell-press": "Orta göğüs · Pectoralis major (sternocostalis, geniş açı)",
  "machine-chest-press": "Orta göğüs · Pectoralis major (sternocostalis)",
  "sinav": "Orta göğüs · Pectoralis major (sternocostalis)",
  "wide-pushup": "Dış-orta göğüs · Pectoralis major (sternocostalis)",
  "archer-pushup": "Orta göğüs · Pectoralis major (tek taraflı)",
  "decline-press": "Alt göğüs · Pectoralis major (pars abdominalis)",
  "chest-dips": "Alt göğüs · Pectoralis major (abdominalis) + Triceps",
  "incline-pushup": "Alt göğüs · Pectoralis major (pars abdominalis)",
  "cable-crossover": "İç göğüs · Pectoralis major (sternal lifler, adduksiyon)",
  "pec-deck": "İç göğüs · Pectoralis major (adduksiyon izolasyon)",
  "dumbbell-fly": "İç-dış göğüs · Pectoralis major (germe + adduksiyon)",
  "diamond-pushup": "İç göğüs + Triceps brachii (caput mediale)",
  // SIRT — Latissimus / Trapezius+Rhomboidei / Erector spinae
  "barfiks": "Latissimus dorsi (dikey çekiş, genişlik)",
  "chin-up": "Latissimus dorsi + Biceps brachii (supinasyon)",
  "lat-pulldown": "Latissimus dorsi (dikey çekiş)",
  "v-bar-pulldown": "Latissimus dorsi (dar tutuş, alt lifler)",
  "negative-pullup": "Latissimus dorsi (eksantrik)",
  "scapular-pull": "Latissimus + Trapezius (alt) — skapula depresyonu",
  "muscle-up": "Latissimus + Pectoralis + Triceps (bileşik)",
  "barbell-row": "Orta sırt · Trapezius (orta) + Rhomboidei + Latissimus",
  "t-bar-row": "Orta sırt · Rhomboidei + Latissimus",
  "seated-row": "Orta sırt · Trapezius (orta) + Rhomboidei",
  "dumbbell-row": "Orta sırt · Latissimus + Rhomboidei (tek kol)",
  "inverted-row": "Orta sırt · Rhomboidei + Trapezius (yatay çekiş)",
  "rack-pull": "Üst sırt/trapez · Trapezius + Erector spinae",
  "deadlift": "Arka zincir · Erector spinae + Gluteus + Hamstrings",
  "romanian-deadlift": "Hamstrings + Gluteus maximus + Erector spinae",
  "good-morning": "Erector spinae + Hamstrings (kalça menteşesi)",
  "hyperextension": "Erector spinae (izolasyon)",
  "superman": "Erector spinae + Gluteus maximus",
  // OMUZ — Deltoideus (anterior/lateral/posterior) + Trapezius
  "shoulder-press": "Ön omuz · Deltoideus (pars clavicularis) + Triceps",
  "military-press": "Ön omuz · Deltoideus anterior (ayakta, bileşik)",
  "arnold-press": "Ön→yan omuz · Deltoideus (anterior + lateral)",
  "front-raise": "Ön omuz · Deltoideus anterior (izolasyon)",
  "pike-pushup": "Ön omuz · Deltoideus anterior (vücut ağırlığı)",
  "handstand-pushup": "Ön omuz · Deltoideus anterior + Triceps",
  "lateral-raise": "Yan omuz · Deltoideus (pars acromialis / lateral)",
  "cable-lateral": "Yan omuz · Deltoideus lateral (sabit gerilim)",
  "upright-row": "Yan omuz + Trapezius · Deltoideus lateral",
  "rear-delt-fly": "Arka omuz · Deltoideus (pars spinalis / posterior)",
  "face-pull": "Arka omuz · Deltoideus posterior + Trapezius (orta)",
  "shrug": "Trapezius (üst lifler) — skapula elevasyonu",
  // KOL — Biceps brachii / Brachialis / Brachioradialis · Triceps başları
  "barbell-curl": "Biceps brachii (uzun + kısa baş, kütle)",
  "biceps-curl": "Biceps brachii (uzun + kısa baş)",
  "preacher-curl": "Biceps brachii (kısa baş / caput breve)",
  "concentration-curl": "Biceps brachii (kısa baş — tepe/peak)",
  "spider-curl": "Biceps brachii (kısa baş, tam kasılma)",
  "hammer-curl": "Brachialis + Brachioradialis (nötr tutuş)",
  "cable-hammer-curl": "Brachialis + Brachioradialis",
  "zottman-curl": "Brachioradialis + Biceps (pronasyonlu dönüş)",
  "close-grip-bench": "Triceps brachii (bileşik, tüm başlar)",
  "triceps-dips": "Triceps brachii (bileşik, vücut ağırlığı)",
  "skull-crusher": "Triceps brachii (uzun baş / caput longum)",
  "overhead-extension": "Triceps brachii (uzun baş — germede)",
  "triceps-pushdown": "Triceps brachii (dış baş / caput laterale)",
  "triceps-kickback": "Triceps brachii (dış+arka, tam kasılma)",
  // BACAK — Quadriceps / Hamstrings / Gluteus / Gastrocnemius-Soleus
  "squat": "Quadriceps femoris + Gluteus maximus (bileşik)",
  "front-squat": "Quadriceps femoris (vastuslar, dik gövde)",
  "hack-squat": "Quadriceps femoris (vastus lateralis/medialis)",
  "leg-press": "Quadriceps femoris (yüksek yük)",
  "goblet-squat": "Quadriceps femoris (başlangıç dostu)",
  "bulgarian": "Quadriceps + Gluteus maximus (tek bacak)",
  "lunge": "Quadriceps + Gluteus maximus",
  "step-up": "Quadriceps + Gluteus maximus",
  "pistol-squat": "Quadriceps femoris (tek bacak, denge)",
  "wall-sit": "Quadriceps femoris (izometrik)",
  "leg-extension": "Quadriceps femoris (rectus femoris / vastus medialis) — izolasyon",
  "leg-curl": "Hamstrings · Biceps femoris (diz fleksiyonu)",
  "nordic-curl": "Hamstrings (eksantrik, güçlü)",
  "hip-thrust": "Gluteus maximus (kalça ekstansiyonu)",
  "glute-bridge": "Gluteus maximus",
  "sumo-deadlift": "Gluteus + Adductores + Hamstrings",
  "glute-kickback": "Gluteus maximus (izolasyon)",
  "single-leg-glute-bridge": "Gluteus maximus (tek bacak)",
  "calf-raise": "Gastrocnemius (ayakta — diz düz)",
  "seated-calf-raise": "Soleus (oturarak — diz bükük)",
  // KARIN — Rectus abdominis (üst/alt) · Obliqui · Transversus
  "crunch": "Rectus abdominis (üst lifler)",
  "cable-crunch": "Rectus abdominis (üst, yüklü)",
  "situp": "Rectus abdominis (üst→tüm) + kalça fleksörleri",
  "v-up": "Rectus abdominis (üst + alt beraber)",
  "toe-touches": "Rectus abdominis (üst lifler)",
  "hanging-leg-raise": "Rectus abdominis (alt lifler) + iliopsoas",
  "leg-raise": "Rectus abdominis (alt lifler)",
  "reverse-crunch": "Rectus abdominis (alt lifler)",
  "flutter-kicks": "Rectus abdominis (alt) + iliopsoas",
  "bicycle-crunch": "Obliquus externus/internus (rotasyon)",
  "russian-twist": "Obliquus externus/internus (rotasyon)",
  "side-plank": "Obliquus + Quadratus lumborum (yan stabilizasyon)",
  "plank": "Transversus abdominis + Rectus (izometrik)",
  "hollow-body-hold": "Rectus abdominis + Transversus (jimnastik core)",
  "l-sit": "Rectus abdominis + iliopsoas (izometrik)",
  "ab-roller": "Rectus abdominis + Transversus (anti-ekstansiyon)",
  "dragon-flag": "Rectus abdominis (tüm) — güçlü eksantrik/izometrik",
  "mountain-climber-ab": "Rectus abdominis + core (dinamik)",
};

// Bölge-içi gösterim sırası: her alt-grup içinde bileşik→izolasyon ve kas-başı
// mantığına göre. (FOCUS ile aynı sıra.)
const FOCUS_ORDER = Object.keys(FOCUS);
const ORDER_INDEX = {};
FOCUS_ORDER.forEach((id, i) => { ORDER_INDEX[id] = i; });

// Bir hareketin spesifik kas vurgusu etiketi (yoksa null)
export function focusOf(id) { return FOCUS[id] || null; }

// Bir bölgenin hareketlerini alt-gruplara ayır; her grup içinde anatomik
// vurgu sırasına göre dizilir (el-yapımı önce, otomatikler sonra). [{name,items}]
export function groupedByRegion(regionId) {
  const list = exercisesByRegion(regionId);
  const order = SUBGROUPS[regionId] || [];
  const map = {};
  list.forEach((ex) => {
    const s = subOf(ex);
    (map[s] = map[s] || []).push(ex);
  });
  Object.keys(map).forEach((name) => {
    map[name].sort((a, b) => (ORDER_INDEX[a.id] != null ? ORDER_INDEX[a.id] : 9999) - (ORDER_INDEX[b.id] != null ? ORDER_INDEX[b.id] : 9999));
  });
  const names = order.filter((n) => map[n])
    .concat(Object.keys(map).filter((n) => order.indexOf(n) === -1)); // tanımsızlar + "Diğer" sona
  return names.map((name) => ({ name, items: map[name] }));
}
