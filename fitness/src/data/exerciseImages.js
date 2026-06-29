// Egzersiz id -> free-exercise-db klasör adı.
// Görseller jsDelivr CDN üzerinden servis edilir (kamu malı / Unlicense).
// Kaynak: https://github.com/yuhonas/free-exercise-db
// Her egzersizin 0.jpg (başlangıç) ve 1.jpg (bitiş) karesi var; ikisi
// dönerek gerçek bir egzersiz animasyonu oluşturur.
// Eşleşmesi olmayan hareketler otomatik olarak kaslı SVG figürüne düşer.

const CDN = "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/";

export const EXERCISE_IMG = {
  // göğüs
  "bench-press": "Barbell_Bench_Press_-_Medium_Grip",
  "incline-press": "Barbell_Incline_Bench_Press_-_Medium_Grip",
  "decline-press": "Decline_Barbell_Bench_Press",
  "dumbbell-press": "Dumbbell_Bench_Press",
  "dumbbell-fly": "Dumbbell_Flyes",
  "sinav": "Pushups",
  "diamond-pushup": "Incline_Push-Up_Close-Grip",
  "incline-pushup": "Incline_Push-Up",
  "cable-crossover": "Cable_Crossover",
  "chest-dips": "Dips_-_Chest_Version",
  // sırt
  "barfiks": "Pullups",
  "chin-up": "Chin-Up",
  "lat-pulldown": "Wide-Grip_Lat_Pulldown",
  "barbell-row": "Bent_Over_Barbell_Row",
  "dumbbell-row": "One-Arm_Dumbbell_Row",
  "t-bar-row": "Lying_T-Bar_Row",
  "seated-row": "Seated_Cable_Rows",
  "deadlift": "Barbell_Deadlift",
  "romanian-deadlift": "Romanian_Deadlift",
  "hyperextension": "Hyperextensions_Back_Extensions",
  // omuz
  "shoulder-press": "Dumbbell_Shoulder_Press",
  "military-press": "Standing_Military_Press",
  "arnold-press": "Arnold_Dumbbell_Press",
  "lateral-raise": "Side_Lateral_Raise",
  "front-raise": "Front_Dumbbell_Raise",
  "rear-delt-fly": "Reverse_Flyes",
  "upright-row": "Upright_Barbell_Row",
  "shrug": "Barbell_Shrug",
  // kol
  "biceps-curl": "Dumbbell_Bicep_Curl",
  "barbell-curl": "Barbell_Curl",
  "hammer-curl": "Hammer_Curls",
  "concentration-curl": "Concentration_Curls",
  "preacher-curl": "Preacher_Curl",
  "triceps-pushdown": "Triceps_Pushdown_-_Rope_Attachment",
  "overhead-extension": "Standing_Dumbbell_Triceps_Extension",
  "skull-crusher": "EZ-Bar_Skullcrusher",
  "triceps-dips": "Dips_-_Triceps_Version",
  // bacak
  "squat": "Barbell_Squat",
  "front-squat": "Front_Barbell_Squat",
  "goblet-squat": "Goblet_Squat",
  "leg-press": "Leg_Press",
  "leg-extension": "Leg_Extensions",
  "lunge": "Dumbbell_Lunges",
  "bulgarian": "One_Leg_Barbell_Squat",
  "step-up": "Dumbbell_Step_Ups",
  "leg-curl": "Lying_Leg_Curls",
  "hip-thrust": "Barbell_Hip_Thrust",
  "calf-raise": "Standing_Calf_Raises",
  // karın
  "crunch": "Crunches",
  "situp": "Sit-Up",
  "leg-raise": "Flat_Bench_Lying_Leg_Raise",
  "bicycle-crunch": "Air_Bike",
  "russian-twist": "Russian_Twist",
  "flutter-kicks": "Flutter_Kicks",
  "plank": "Plank",
  "side-plank": "Side_Bridge",
  "mountain-climber-ab": "Mountain_Climbers",
  "hanging-leg-raise": "Hanging_Leg_Raise",
  // kardiyo
  "jumping-jack": "Star_Jump",
  "high-knees": "Running_Treadmill",
  "jump-squat": "Freehand_Jump_Squat",
  "box-jump": "Front_Box_Jump",
  "mountain-climber": "Mountain_Climbers",
  "jump-rope": "Rope_Jumping",
  "burpee": "Plyo_Push-up",
  "skater": "Bodyweight_Walking_Lunge",
  "butt-kicks": "Single_Leg_Butt_Kick",
};

// Bölge seçim kartları için temsili görseller (bölge id -> egzersiz klasörü)
export const REGION_IMG = {
  gogus: "Barbell_Bench_Press_-_Medium_Grip",
  sirt: "Wide-Grip_Lat_Pulldown",
  omuz: "Dumbbell_Shoulder_Press",
  kol: "Barbell_Curl",
  bacak: "Barbell_Squat",
  karin: "Crunches",
  kardiyo: "Rope_Jumping",
};

export function regionImage(id) {
  const folder = REGION_IMG[id];
  return folder ? CDN + folder + "/0.jpg" : null;
}

// Bir egzersiz için [başlangıç, bitiş] görsel URL'leri (yoksa null)
export function exerciseFrames(id) {
  const folder = EXERCISE_IMG[id];
  if (!folder) return null;
  return [CDN + folder + "/0.jpg", CDN + folder + "/1.jpg"];
}
