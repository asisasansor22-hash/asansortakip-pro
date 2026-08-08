// --- Direnç profili: kasın hangi boyunda en çok gerildiği ---
//
// Neden önemli: Son yıllardaki çalışmalar (Maeo ve ark. 2021-2023, Pedrosa ve
// ark. 2022, Kassiano ve ark. 2023 derlemesi), kası UZUN (gerilmiş) boyda
// yükleyen hareketlerin, kısa boyda zirve yapanlara göre daha fazla hipertrofi
// ürettiğini gösteriyor ("stretch-mediated hypertrophy"). Tam hareket açıklığı
// ve gerilmiş pozisyonda kontrollü negatif, kazancın büyük kısmını taşıyor.
//
// Pratik kural (programlarda uygulanır):
//   • Her kas için seansta EN AZ BİR "uzun boy" (gerilme) hareketi bulunsun.
//   • Kısa boy (zirve kasılma) hareketleri tamamlayıcıdır — tek başına yeterli değil.
//   • Gerilmiş pozisyonda negatifi 2-3 sn'de kontrol et, hareketi kısaltma.
//
// profile: "uzun" (gerilmiş boyda zirve) | "orta" (orta açıda zirve) | "kisa" (kasılmış boyda zirve)

export const TENSION = {
  // ---- Göğüs ----
  "dumbbell-fly":            { p: "uzun", n: "Dipte göğüs tam gerilir — esas gelişim burada. Dirsek hafif bükük, kontrollü in." },
  "dumbbell-press":          { p: "uzun", n: "Dumbbell barbell'e göre daha derin iner; dipte gerilmeyi hisset." },
  "incline-dumbbell-press":  { p: "uzun", n: "Üst göğsü gerilmiş boyda yükler; dipte 1 sn duraklat." },
  "cable-crossover":         { p: "kisa", n: "Zirve kasılmada en zor — gerilme hareketiyle (fly/dumbbell pres) eşleştir." },
  "pec-deck":                { p: "orta", n: "Orta açıda sabit yük; açılışta gerilmeyi zorlama, omuz önünü koru." },
  "bench-press":             { p: "orta", n: "Zirve orta açıda. Barı göğse değdir, yarım tekrar yapma." },
  "incline-press":           { p: "orta", n: "30-45° eğim üst göğsü hedefler; barı köprücük altına indir." },
  "decline-press":           { p: "orta", n: "Alt göğüs vurgusu; hareket açıklığını kısaltma." },
  "machine-chest-press":     { p: "orta", n: "Sabit yol; oturağı göğüs hizasına ayarla, dipte gerilmeyi kaybetme." },
  "sinav":                   { p: "orta", n: "Göğsü yere yaklaştır; ellerin altına yükseklik koyarsan gerilme artar." },
  "wide-pushup":             { p: "uzun", n: "Geniş tutuş dipte göğsü daha çok gerer — yavaş in." },
  "diamond-pushup":          { p: "orta", n: "Triceps ağırlıklı; göğüs için dar tutuş gerilmeyi azaltır." },
  "decline-pushup":          { p: "orta", n: "Ayak yukarıda = üst göğüs vurgusu." },
  "chest-dips":              { p: "uzun", n: "Öne eğilerek dipte göğüs güçlü gerilir; omuz ağrısı varsa derinliği sınırla." },

  // ---- Sırt ----
  "barfiks":                 { p: "uzun", n: "Tam asılışta lat gerilir — her tekrarda kolları tam aç." },
  "chin-up":                 { p: "uzun", n: "Ters tutuş; dipte tam asıl, biceps katkısı yüksek." },
  "negative-pullup":         { p: "uzun", n: "Sadece negatif: 3-5 sn'de in, gerilmiş boyda kontrol esas." },
  "lat-pulldown":            { p: "orta", n: "Üstte omuzları serbest bırak (lat gerilsin), sonra çek." },
  "barbell-row":             { p: "orta", n: "Zirve orta açıda; gövdeyi sabit tut, salınımla çekme." },
  "seated-row":              { p: "orta", n: "Öne uzanırken sırtı gerdir, geriye çekerken kürekleri sık." },
  "dumbbell-row":            { p: "uzun", n: "Tek kol daha uzun yol verir; aşağıda omzu bırakıp lat'ı ger." },
  "t-bar-row":               { p: "orta", n: "Orta sırt kalınlığı; bel nötr kalsın." },
  "inverted-row":            { p: "orta", n: "Vücut düz; göğsü bara değdir." },
  "deadlift":                { p: "orta", n: "Tüm arka zincir; bel nötr, kalçadan menteşe yap." },
  "romanian-deadlift":       { p: "uzun", n: "Hamstring'i gerilmiş boyda yükler — dizler hafif bükük, kalçayı geri it." },
  "hyperextension":          { p: "kisa", n: "Zirve kasılmada zor; tepede aşırı geriye kavis yapma." },
  "superman":                { p: "kisa", n: "Zirve kasılma egzersizi; bel için hafif tut." },

  // ---- Omuz ----
  "shoulder-press":          { p: "orta", n: "Zirve orta açıda; kulaklara kadar in, yarım pres yapma." },
  "military-press":          { p: "orta", n: "Ayakta sıkı core; barı çene hizasına indir." },
  "arnold-press":            { p: "orta", n: "Rotasyon ön omzu daha uzun yolda çalıştırır." },
  "pike-pushup":             { p: "orta", n: "Kalça yukarıda; baş yere yaklaşsın." },
  "handstand-pushup":        { p: "orta", n: "İleri seviye; tam hareket açıklığı için yükseklik kullan." },
  "lateral-raise":           { p: "kisa", n: "Zirve tepede (kısa boy). Kablo ile gövdenin arkasından başlarsan gerilme artar." },
  "cable-lateral":           { p: "uzun", n: "Kablo, kol gövde önündeyken bile yük verir — yan omzu gerilmiş boyda yükler." },
  "upright-row":             { p: "orta", n: "Omuz sıkışması yaparsa geniş tutuşa geç." },
  "face-pull":               { p: "kisa", n: "Zirve kasılmada; arka omuz + postür için hafif kiloyla yüksek tekrar." },
  "rear-delt-fly":           { p: "orta", n: "Kolları tam aç; öne eğilip omuz bıçaklarını kilitleme." },

  // ---- Kol ----
  "biceps-curl":             { p: "orta", n: "Zirve orta açıda; dirseği sabitle, salınım yapma." },
  "barbell-curl":            { p: "orta", n: "Aşağıda kolu tam aç — yarım tekrar biceps'i kısaltır." },
  "hammer-curl":             { p: "orta", n: "Brachialis/ön kol vurgusu; nötr tutuş." },
  "preacher-curl":           { p: "uzun", n: "Dipte biceps gerilmiş boyda yüklenir — aşağıda kolu tam açmayı ihmal etme." },
  "concentration-curl":      { p: "kisa", n: "Zirve kasılmada; gerilme hareketiyle eşleştir." },
  "skull-crusher":           { p: "uzun", n: "Baş arkasına indirirsen triceps uzun başı gerilir — asıl gelişim burada." },
  "overhead-extension":      { p: "uzun", n: "Kol baş üstünde = uzun baş tam gerilir; en verimli triceps hareketi." },
  "triceps-pushdown":        { p: "kisa", n: "Zirve kasılmada; tek başına yeterli değil, baş üstü hareketle eşleştir." },
  "close-grip-bench":        { p: "orta", n: "Ağır triceps bileşiği; dirsekleri gövdeye yakın tut." },
  "triceps-dips":            { p: "orta", n: "Gövde dik = triceps vurgusu; dipte omzu zorlama." },

  // ---- Bacak ----
  "squat":                   { p: "uzun", n: "Derin squat quad ve glute'u gerilmiş boyda yükler — paralel altına in." },
  "front-squat":             { p: "uzun", n: "Dik gövde + derin açı quad'ı uzun boyda çalıştırır." },
  "hack-squat":              { p: "uzun", n: "Derin açıda quad gerilmesi çok yüksek; kontrollü in." },
  "leg-press":               { p: "uzun", n: "Dizleri göğse yaklaştırdıkça gerilme artar (bel kalkmadan)." },
  "goblet-squat":            { p: "uzun", n: "Dik gövde, derin açı; başlangıç için ideal." },
  "lunge":                   { p: "uzun", n: "Uzun adım = glute/hamstring gerilmesi; diz öne kaçmasın." },
  "bulgarian":               { p: "uzun", n: "Arka ayak yüksekte; ön bacak derin inince glute güçlü gerilir." },
  "pistol-squat":            { p: "uzun", n: "Tek bacak tam derinlik; denge için destek kullan." },
  "leg-extension":           { p: "kisa", n: "Zirve kasılmada; squat/press gibi gerilme hareketiyle eşleştir." },
  "wall-sit":                { p: "orta", n: "İzometrik dayanıklılık; hipertrofi için tek başına yetersiz." },
  "leg-curl":                { p: "orta", n: "Oturarak yapılan versiyon hamstring'i daha uzun boyda yükler — tercih et." },
  "nordic-curl":             { p: "uzun", n: "Negatif ağırlıklı; hamstring gerilmiş boyda maksimum yük alır." },
  "hip-thrust":              { p: "kisa", n: "Zirve kasılmada (kısa boy) — derin squat/lunge ile eşleştir." },
  "glute-bridge":            { p: "kisa", n: "Zirve kasılma; tepede 1 sn sık." },
  "single-leg-glute-bridge": { p: "kisa", n: "Tek taraflı zirve kasılma; kalça düşmesin." },
  "good-morning":            { p: "uzun", n: "Hamstring gerilmesi yüksek; hafif kiloyla ve nötr belle." },
  "calf-raise":              { p: "uzun", n: "Topuğu basamaktan aşağı bırak — gerilme olmadan baldır gelişmez." },
  "seated-calf-raise":       { p: "uzun", n: "Diz bükük = soleus; dipte tam gerilme şart." },

  // ---- Karın ----
  "hanging-leg-raise":       { p: "uzun", n: "Asılıyken karın gerilmiş boyda başlar; salınımsız kaldır." },
  "ab-roller":               { p: "uzun", n: "Uzanırken karın tam gerilir; bel çökmesin." },
  "hollow-body-hold":        { p: "orta", n: "İzometrik; bel yere yapışık kalsın." },
  "leg-raise":               { p: "orta", n: "Beli yere bastır; bacakları yavaş indir." },
  "crunch":                  { p: "kisa", n: "Zirve kasılmada; gerilme hareketiyle (asılı bacak/ab roller) eşleştir." },
  "plank":                   { p: "orta", n: "İzometrik stabilite; kalça düşmesin." },
  // Otomatik üretecin karın havuzuna eklenen varyantlar. Etiketleri olmadan
  // AutoPlanner'daki 🔵/⚪/🟠 göstergesi bu hareketlerde boş kalıyordu.
  "bicycle-crunch":          { p: "kisa", n: "Zirve kasılmada; rotasyonu tam yap, hızlanma." },
  "russian-twist":           { p: "kisa", n: "Zirve kasılmada; oblikler için ağırlığı kalça yanına götür." },
  "side-plank":              { p: "orta", n: "İzometrik yan stabilite; kalçayı düşürme." },
  "cable-crunch":            { p: "kisa", n: "Zirve kasılmada; kalça sabit, omurgayı karınla kıvır." },
  "dragon-flag":             { p: "uzun", n: "İleri seviye; negatifi kontrol et." },
  "v-up":                    { p: "orta", n: "Tam açılıp toparlan." },
};

export function tensionOf(id) { return TENSION[id] || null; }

// Profil etiketi (kısa gösterim)
export const TENSION_LABEL = {
  uzun: { txt: "Gerilmiş boyda", short: "Gerilme", emoji: "🔵", color: "var(--accent)" },
  orta: { txt: "Orta açıda", short: "Orta", emoji: "⚪", color: "var(--muted)" },
  kisa: { txt: "Kasılmış boyda", short: "Kasılma", emoji: "🟠", color: "#fb923c" },
};

// Bir gün/program içindeki hareketlerin profil dağılımı ve eksik uyarısı.
// Dönüş: { uzun, orta, kisa, hasStretch } — hasStretch=false ise gerilme
// hareketi yok demektir (hipertrofi için önerilmez).
export function tensionMix(exIds) {
  const out = { uzun: 0, orta: 0, kisa: 0 };
  (exIds || []).forEach((id) => {
    const t = TENSION[id];
    if (t) out[t.p] = (out[t.p] || 0) + 1;
  });
  return { ...out, hasStretch: out.uzun > 0 };
}
