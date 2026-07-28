// --- Gönderim kuyruğu (outbox): "hangi anahtarlar buluta borçlu?" ---
//
// TASARIM KARARI: Kuyruk YÜK SAKLAMAZ. Yalnızca "K anahtarının gönderilmemiş
// bir yazması var" bilgisini ve o yazmanın zamanını tutar. Yük, gönderim
// anında cihaz aynasından ya da React state'inden okunur.
//
// Neden böyle:
//   • Sınırsız büyüme yok — kuyruk en fazla anahtar sayısı kadar satır tutar.
//   • Bayat yük tekrarı yok — her zaman en güncel hâl gönderilir.
//   • Kota riski yok — base64 fotoğraf gibi büyük yükler kuyruğa hiç girmez.
//
// `at` damgası şunun için: bir yazma uçuştayken kullanıcı yeni bir değişiklik
// yaparsa, uçuştaki yazmanın başarıyla dönmesi anahtarı TEMİZ işaretlememeli —
// çünkü yeni değişiklik hâlâ gönderilmedi. clearPending yalnızca damga
// eşleşirse siler.

const LS = "fitbe_outbox";

function read() {
  try {
    const v = JSON.parse(localStorage.getItem(LS) || "{}");
    return v && typeof v === "object" && !Array.isArray(v) ? v : {};
  } catch (e) { return {}; }
}
function write(o) {
  try {
    if (!o || !Object.keys(o).length) localStorage.removeItem(LS);
    else localStorage.setItem(LS, JSON.stringify(o));
  } catch (e) {}
}

export function markPending(key, at) {
  if (!key) return;
  const o = read();
  o[key] = { at: at || Date.now() };
  write(o);
}

// Damga eşleşmiyorsa (arada daha yeni bir düzenleme geldiyse) hiçbir şey yapma.
export function clearPending(key, at) {
  const o = read();
  const cur = o[key];
  if (!cur) return;
  if (at != null && cur.at !== at) return;
  delete o[key];
  write(o);
}

export function isPending(key) { return !!read()[key]; }
export function pendingKeys() { return Object.keys(read()); }
export function clearAll() { write({}); }
