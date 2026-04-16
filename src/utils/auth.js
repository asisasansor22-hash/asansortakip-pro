// Şifre hash'leme ve doğrulama (Web Crypto API - SHA-256)

export async function hashPassword(plain) {
  var encoder = new TextEncoder();
  var data = encoder.encode(plain);
  var hashBuffer = await crypto.subtle.digest("SHA-256", data);
  var hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(function(b){ return b.toString(16).padStart(2, "0"); }).join("");
}

export async function verifyPassword(plain, hash) {
  var hashed = await hashPassword(plain);
  return hashed === hash;
}

// Hash'lenmiş mi kontrol et (64 karakter hex string)
export function isHashed(value) {
  return typeof value === "string" && value.length === 64 && /^[0-9a-f]+$/.test(value);
}

// Firma kodu oluştur (Türkçe karakter dönüşümü + slug)
export function firmaSlug(name) {
  return name
    .toLowerCase()
    .replace(/ş/g, "s").replace(/ç/g, "c").replace(/ğ/g, "g")
    .replace(/ı/g, "i").replace(/ö/g, "o").replace(/ü/g, "u")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
