// Rozetler / başarımlar — antrenman geçmişinden hesaplanır (dış servis yok).
const DAY = 86400000;
const dayKey = (t) => { const d = new Date(t); d.setHours(0, 0, 0, 0); return d.getTime(); };
const firstInt = (s) => { const m = String(s || "").match(/\d+/); return m ? parseInt(m[0], 10) : 0; };

export function achievementStats(history) {
  const list = Array.isArray(history) ? history : [];
  let sets = 0, vol = 0, apple = false;
  list.forEach((s) => {
    const ss = Array.isArray(s.sets) ? s.sets : [];
    sets += ss.length;
    ss.forEach((st) => { vol += (Number(st.weight) || 0) * firstInt(st.reps); });
    if (s.source === "apple") apple = true;
  });
  const days = new Set(list.map((s) => dayKey(s.date)));
  const t0 = dayKey(Date.now());
  let streak = 0;
  let cur = days.has(t0) ? t0 : (days.has(t0 - DAY) ? t0 - DAY : null);
  while (cur != null && days.has(cur)) { streak++; cur -= DAY; }
  const weekStart = t0 - ((new Date().getDay() + 6) % 7) * DAY;
  let week = 0;
  days.forEach((d) => { if (d >= weekStart) week++; });
  return { sessions: list.length, sets, vol: Math.round(vol), streak, week, apple: apple ? 1 : 0 };
}

// need: eşik; metric: stats anahtarı. earned = stats[metric] >= need
export const ACHIEVEMENTS = [
  { id: "first", emoji: "🎯", name: "İlk Adım", metric: "sessions", need: 1, desc: "İlk antrenmanını tamamla" },
  { id: "s10", emoji: "💪", name: "Isınıyor", metric: "sessions", need: 10, desc: "10 antrenman" },
  { id: "s25", emoji: "🔥", name: "Alev Aldı", metric: "sessions", need: 25, desc: "25 antrenman" },
  { id: "s50", emoji: "🏅", name: "Kararlı", metric: "sessions", need: 50, desc: "50 antrenman" },
  { id: "s100", emoji: "👑", name: "Efsane", metric: "sessions", need: 100, desc: "100 antrenman" },
  { id: "streak3", emoji: "⚡", name: "Momentum", metric: "streak", need: 3, desc: "3 gün üst üste" },
  { id: "streak7", emoji: "🔥", name: "7 Gün Seri", metric: "streak", need: 7, desc: "7 gün üst üste" },
  { id: "streak14", emoji: "🌟", name: "İki Hafta", metric: "streak", need: 14, desc: "14 gün üst üste" },
  { id: "streak30", emoji: "💎", name: "Sarsılmaz", metric: "streak", need: 30, desc: "30 gün üst üste" },
  { id: "sets100", emoji: "🏋️", name: "100 Set", metric: "sets", need: 100, desc: "Toplam 100 set" },
  { id: "sets500", emoji: "💥", name: "500 Set", metric: "sets", need: 500, desc: "Toplam 500 set" },
  { id: "vol10", emoji: "🏔️", name: "10 Ton", metric: "vol", need: 10000, desc: "10.000 kg toplam tonaj" },
  { id: "vol50", emoji: "🚀", name: "50 Ton", metric: "vol", need: 50000, desc: "50.000 kg toplam tonaj" },
  { id: "week3", emoji: "📅", name: "Haftalık Hedef", metric: "week", need: 3, desc: "Bir haftada 3 antrenman" },
  { id: "week5", emoji: "🗓️", name: "Tam Hafta", metric: "week", need: 5, desc: "Bir haftada 5 antrenman" },
  { id: "apple", emoji: "🍎", name: "Bağlantılı", metric: "apple", need: 1, desc: "Apple Sağlık'tan antrenman aktar" },
];

export function computeAchievements(history) {
  const st = achievementStats(history);
  const list = ACHIEVEMENTS.map((a) => {
    const val = st[a.metric] || 0;
    return { ...a, val, earned: val >= a.need, progress: Math.min(1, val / a.need) };
  });
  return { stats: st, list, earned: list.filter((a) => a.earned).length };
}

export function earnedCount(history) {
  const st = achievementStats(history);
  return ACHIEVEMENTS.filter((a) => (st[a.metric] || 0) >= a.need).length;
}
