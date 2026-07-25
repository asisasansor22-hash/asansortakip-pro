// --- Barkodla besin arama: Open Food Facts ---
//
// Open Food Facts açık (ODbL lisanslı) bir gıda veritabanıdır: API ANAHTARI
// GEREKTİRMEZ, kayıt istemez, ücretsizdir. İstek doğrudan kullanıcının
// tarayıcısından gider (CORS açıktır).
//
// Kaynak: https://openfoodfacts.github.io/openfoodfacts-server/api/
// Kibarlık kuralı: uygulama kendini User-Agent ile tanıtmalıdır.

const BASE = "https://world.openfoodfacts.org/api/v2/product/";
const FIELDS = "code,product_name,product_name_tr,brands,serving_size,serving_quantity,nutriments,image_small_url,quantity";

// Barkodu sadeleştir: rakam dışı her şeyi at
export function cleanBarcode(s) {
  return String(s || "").replace(/\D/g, "");
}

// Barkod geçerli mi? EAN-8/UPC-E(8), UPC-A(12), EAN-13(13), ITF-14(14)
export function isValidBarcode(s) {
  const c = cleanBarcode(s);
  return c.length >= 8 && c.length <= 14;
}

const num = (v) => {
  const n = Number(v);
  return isFinite(n) && n >= 0 ? n : 0;
};

// Barkodu sorgula. Dönüş:
//   { success: true, food: {barcode, name, brand, per100:{kcal,protein,carbs,fat}, serving:{g,kcal,protein}|null, image} }
//   { success: false, error: "..." , notFound?: true }
export async function lookupBarcode(barcode) {
  const code = cleanBarcode(barcode);
  if (!isValidBarcode(code)) return { success: false, error: "Geçersiz barkod (8-14 hane olmalı)." };

  try {
    const url = BASE + encodeURIComponent(code) + ".json?fields=" + FIELDS;
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 12000);
    let res;
    try {
      res = await fetch(url, {
        signal: ctrl.signal,
        headers: { "Accept": "application/json" },
      });
    } finally { clearTimeout(timer); }

    if (res.status === 404) return { success: false, notFound: true, error: "Bu barkod veritabanında yok." };
    if (!res.ok) return { success: false, error: "Sunucu hatası (" + res.status + ")." };

    const data = await res.json();
    // v2: status 0 = bulunamadı
    if (!data || data.status === 0 || !data.product) {
      return { success: false, notFound: true, error: "Bu barkod veritabanında yok." };
    }

    const p = data.product;
    const n = p.nutriments || {};

    const name = (p.product_name_tr || p.product_name || "").trim();
    if (!name) return { success: false, notFound: true, error: "Ürün bulundu ama adı kayıtlı değil." };

    // 100 g/ml başına değerler. OFF kcal'i "energy-kcal_100g" alanında tutar;
    // yoksa kJ'den çevir (1 kcal = 4.184 kJ).
    let kcal100 = num(n["energy-kcal_100g"]);
    if (!kcal100 && n["energy_100g"]) kcal100 = Math.round(num(n["energy_100g"]) / 4.184);

    const per100 = {
      kcal: Math.round(kcal100),
      protein: Math.round(num(n.proteins_100g) * 10) / 10,
      carbs: Math.round(num(n.carbohydrates_100g) * 10) / 10,
      fat: Math.round(num(n.fat_100g) * 10) / 10,
    };

    if (!per100.kcal && !per100.protein) {
      return { success: false, notFound: true, error: "Ürünün besin değerleri kayıtlı değil." };
    }

    // Porsiyon bilgisi (varsa)
    let serving = null;
    const sg = num(p.serving_quantity);
    if (sg > 0) {
      serving = {
        g: sg,
        label: (p.serving_size || sg + " g").trim(),
        kcal: Math.round(per100.kcal * sg / 100),
        protein: Math.round(per100.protein * sg / 100 * 10) / 10,
      };
    }

    return {
      success: true,
      food: {
        barcode: code,
        name,
        brand: (p.brands || "").split(",")[0].trim(),
        quantity: (p.quantity || "").trim(),
        per100,
        serving,
        image: p.image_small_url || null,
      },
    };
  } catch (e) {
    if (e && e.name === "AbortError") return { success: false, error: "İstek zaman aşımına uğradı." };
    return { success: false, error: "Bağlantı hatası. İnternetini kontrol et." };
  }
}

// Seçilen gram miktarına göre kalori/protein hesapla
export function portionOf(food, grams) {
  const g = Math.max(0, Number(grams) || 0);
  if (!food || !food.per100) return { kcal: 0, p: 0 };
  return {
    kcal: Math.round(food.per100.kcal * g / 100),
    p: Math.round(food.per100.protein * g / 100 * 10) / 10,
  };
}
