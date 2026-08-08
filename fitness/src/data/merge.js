// --- Yerel ve bulut verisini BİRLEŞTİRME ---
//
// NEDEN: Uygulama açılışta önce cihazdaki yedeği gösteriyor, sonra buluttan
// okuyor. Eskiden bulut okuması yereli KOŞULSUZ eziyordu — üstelik
// lsSetHist(hist.data) ile yerel yedeği de siliyordu. Sonuç: çevrimdışı yapılan
// bir antrenman, internet gelir gelmez geri dönüşsüz siliniyordu. Aynı şey iki
// cihaz arasında da oluyordu (son açılan, diğerinin verisini eziyordu).
//
// Bu modül saf: React ve firebase importu yok, yan etkisi yok, test edilebilir.
//
// KABUL EDİLEN SINIR — SİLME GERİ GELİR:
// Mezar taşı (tombstone) günlüğü tutmuyoruz. Yani çevrimdışıyken sildiğin bir
// program / plan günü / ölçüm, bulutta hâlâ durduğu için birleştirmede geri
// gelir. Tek kullanıcılı bir uygulamada bu, veri kaybetmeye kıyasla kat kat
// tercih edilir: geri gelen bir kaydı tekrar silmek kolay, kaybolan bir
// antrenmanı geri getirmek imkânsız. Silmenin de senkronlanması gerekirse
// her anahtara silinmiş-id listesi eklemek gerekir; bu ölçek için fazla.
//
// localWins: "bu cihazda buluta gönderilmemiş bir yazma var" bilgisi
// (utils/outbox.js'ten gelir). Zaman damgası olmayan skaler alanlarda
// (goalKg, favoriler) hangi tarafın kazanacağını yalnızca bu belirleyebilir.

import { compactHistory, isArchived, setCountOf } from "./history";

const DAY_MS = 86400000;

const asArray = (v) => (Array.isArray(v) ? v.filter(Boolean) : []);

// --- Antrenman geçmişi ---
//
// Anahtar: seansın `date` alanı (bitişteki Date.now()). Güvenli, çünkü aynı
// milisaniyede iki antrenman bitirmek gerekir; ayrıca yedekten geri yükleme
// aynı date'i üretir, yani UUID'in bozacağı tekilleştirme date ile çalışır.
//
// ASIL TEHLİKE ÇAKIŞMA DEĞİL, BİÇİM FARKI: data/history.js yalnızca son 100
// seansı tam detayla tutar, öncesini özet (arşiv) satırına indirir. Aynı seans
// bir cihazda tam, diğerinde arşiv olabilir. Naif birleşim arşiv satırını
// seçerse set dökümü kalıcı olarak yok olur — bu yüzden biçim farkındayız.
export function mergeHistory(local, cloud) {
  const byDate = {};
  const limit = Date.now() + DAY_MS;
  // Yerel İKİNCİ işlenir: eşit değerdeki bir çakışmada yerel kazansın.
  [...asArray(cloud), ...asArray(local)].forEach((row) => {
    const d = Number(row.date);
    if (!isFinite(d) || d <= 0) return;
    if (d > limit) return; // saat kayması çöpü: gelecek tarihli satır listenin başına çakılır
    const cur = byDate[d];
    if (!cur) { byDate[d] = row; return; }
    if (isArchived(cur) && !isArchived(row)) byDate[d] = row;                       // tam > arşiv
    else if (isArchived(cur) === isArchived(row) && setCountOf(row) > setCountOf(cur)) byDate[d] = row; // dolu > eksik
  });
  // Sıralama (yeni→eski) ve 100/900 sınırı compactHistory'den gelir.
  return compactHistory(Object.values(byDate));
}

// Gereksiz PUT'u önleyen ucuz eşitlik: her açılışta buluta yazmayalım.
export function sameHistory(a, b) {
  const x = asArray(a), y = asArray(b);
  if (x.length !== y.length) return false;
  if (x.length === 0) return true;
  return Number(x[0].date) === Number(y[0].date)
    && Number(x[x.length - 1].date) === Number(y[y.length - 1].date);
}

// --- Programlar ---
// id başına yerel kazanır. (App.jsx'teki yeniden bağlanma yolunda zaten bu
// mantık vardı; buraya taşındı ve artık ana yükleme yolunda da çalışıyor.)
export function mergePrograms(localPack, cloudData) {
  const cloudList = asArray(cloudData && cloudData.list);
  const localList = asArray(localPack && localPack.list);
  const byId = {};
  cloudList.forEach((p) => { if (p && p.id) byId[p.id] = p; });
  localList.forEach((p) => { if (p && p.id) byId[p.id] = p; });
  const list = Object.values(byId);
  // activeId: yerel seçim hayatta kalan bir programa çözülüyorsa onu koru.
  const localActive = localPack && localPack.activeId;
  const cloudActive = cloudData && cloudData.activeId;
  const has = (id) => !!id && list.some((p) => p.id === id);
  const activeId = has(localActive) ? localActive : (has(cloudActive) ? cloudActive : null);
  return { list, activeId };
}

// --- Haftalık plan (gün → program id) ---
// Yereldeki gün varsa yerel, yoksa bulut.
export function mergeSchedule(local, cloud) {
  const out = {};
  const put = (src) => {
    if (!src || typeof src !== "object") return;
    Object.keys(src).forEach((k) => { if (src[k]) out[k] = src[k]; });
  };
  put(cloud);
  put(local);
  return out;
}

// --- İlerleme (kilo + ölçüler + hedef) ---
// weights/measures `t` (gün damgası) başına birleşir, yerel kazanır.
// DİKKAT: geçmişin tersine bunlar ARTAN sırada tutulur (Progress.jsx grafiği
// böyle bekliyor) — birleştirmeden sonra yeniden sıralanır.
export function mergeProgress(local, cloud, localWins) {
  const pick = (a, b) => {
    const byT = {};
    asArray(b).forEach((x) => { if (x && x.t != null) byT[x.t] = x; }); // bulut
    asArray(a).forEach((x) => { if (x && x.t != null) byT[x.t] = x; }); // yerel üstüne
    return Object.values(byT).sort((m, n) => Number(m.t) - Number(n.t));
  };
  const L = local && typeof local === "object" ? local : {};
  const C = cloud && typeof cloud === "object" ? cloud : {};
  // goalKg'nin zaman damgası yok; hangi tarafın daha yeni olduğu ancak
  // "bu cihazda gönderilmemiş yazma var mı" bilgisiyle bilinebilir.
  const goalSrc = localWins ? L : C;
  const goalKg = (typeof goalSrc.goalKg === "number" && goalSrc.goalKg > 0)
    ? goalSrc.goalKg
    : ((typeof C.goalKg === "number" && C.goalKg > 0) ? C.goalKg : null);
  return { weights: pick(L.weights, C.weights), measures: pick(L.measures, C.measures), goalKg };
}

// --- Favoriler ---
// BİLEREK birleşim YAPILMIYOR: birleşim, favoriden çıkarılan bir hareketi geri
// getirirdi ve bu listede silme, eklemek kadar sık kullanılıyor. Toptan bir
// taraf seçilir.
export function mergeFavorites(local, cloud, localWins) {
  const L = asArray(local), C = asArray(cloud);
  if (localWins) return L;
  return C.length ? C : L;
}

// --- Beslenme günlüğü ---
// Şekil: { goal: {kcal, protein}, days: { "2026-08-08": {items:[...], water:n} }, recent: [...] }
//
// GÜN BAZINDA birleştirilir, gün İÇİNDE öğeler id'ye göre birleşir. Gerekçe:
// çevrimdışıyken telefondan öğle yemeğini, sonra masaüstünden akşam yemeğini
// eklersen ikisi de kalmalı. Öğelerin benzersiz id'si var (mkItem), o yüzden
// birleşim güvenli — aynı öğe iki kez sayılmaz.
//
// Su (water): sayıdır, id'si yok; büyük olan seçilir. Su sayacı yalnız artar,
// dolayısıyla büyük olan "daha yeni"dir. localWins burada kullanılmaz.
export function mergeDiary(local, cloud) {
  const L = local && typeof local === "object" ? local : {};
  const C = cloud && typeof cloud === "object" ? cloud : {};
  const items = (d) => (Array.isArray(d && d.items) ? d.items : (d && d.items ? Object.values(d.items) : []));

  const days = {};
  const gunler = new Set([...Object.keys(C.days || {}), ...Object.keys(L.days || {})]);
  gunler.forEach((g) => {
    const byId = {};
    items((C.days || {})[g]).forEach((it) => { if (it && it.id) byId[it.id] = it; });
    items((L.days || {})[g]).forEach((it) => { if (it && it.id) byId[it.id] = it; });
    days[g] = {
      items: Object.values(byId),
      water: Math.max(Number(((C.days || {})[g] || {}).water) || 0,
                      Number(((L.days || {})[g] || {}).water) || 0),
    };
  });

  // Hedef: yerelde anlamlı bir değer varsa o, yoksa bulut.
  const gecerli = (x) => x && (Number(x.kcal) > 0 || Number(x.protein) > 0);
  const goal = gecerli(L.goal) ? L.goal : (gecerli(C.goal) ? C.goal : { kcal: 0, protein: 0 });

  // Son kullanılanlar: yerel önce, buluttan tamamla, ada göre tekilleştir, 20 ile sınırla.
  const recent = [];
  const gorulen = new Set();
  [...(Array.isArray(L.recent) ? L.recent : []), ...(Array.isArray(C.recent) ? C.recent : [])].forEach((r) => {
    const k = r && r.name;
    if (!k || gorulen.has(k)) return;
    gorulen.add(k); recent.push(r);
  });
  return { goal, days, recent: recent.slice(0, 20) };
}
