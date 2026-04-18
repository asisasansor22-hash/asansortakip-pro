export function normalizeForMaps(adres) {
  if (!adres) return '';
  let s = adres;
  // SOK. / SOK → Sokak
  s = s.replace(/\bSOK\b\.?\s*/gi, 'Sokak ');
  // CAD. / CAD → Caddesi
  s = s.replace(/\bCAD\b\.?\s*/gi, 'Caddesi ');
  // MAH. / MAH → Mahallesi
  s = s.replace(/\bMAH\b\.?\s*/gi, 'Mahallesi ');
  // Harf+Rakam yapışık: YONCA1 → YONCA 1, ASLI1 → ASLI 1
  s = s.replace(/([A-ZÇĞIİÖŞÜa-zçğıiöşü])(\d)/g, '$1 $2');
  // SİYAVUŞAŞA → SİYAVUŞPAŞA
  s = s.replace(/SİYAVUŞAŞA/gi, 'SİYAVUŞPAŞA');
  // DAİRE / D: bilgisini sil (adres sonundaki)
  s = s.replace(/\s*DA[İI]RE\s*:?\s*\d+\s*$/i, '');
  s = s.replace(/\s+D\s*:\s*\d+\s*$/i, '');
  s = s.replace(/\s+D\d+\s*$/i, '');
  // "B A / 4" gibi garip ekleri temizle
  s = s.replace(/\s+B\s+A\s*\/\s*\d+\s*$/i, '');
  // Fazla boşlukları temizle
  s = s.replace(/\s+/g, ' ').trim();
  return s;
}

export function buildMapsAddress(elev) {
  if (!elev) return '';
  let adres = normalizeForMaps(elev.adres || '');
  const semt = (elev.semt || '').trim();
  const ilce = (elev.ilce || '').trim();

  // Ham adreste ", İstanbul" varsa sil (zaten ekleniyor)
  adres = adres.replace(/,?\s*[İi]stanbul\s*$/i, '').trim();

  // Adres zaten MAHALLESİ/Mahallesi içeriyorsa semt'i tekrar ekleme
  const adresHasMah = /mahalle/i.test(adres);

  // Adres çok kısa/boşsa veya sadece ilçe/semt adı tekrarıysa
  const adresLower = adres.toLowerCase().replace(/[İ]/g, 'i').replace(/[ı]/g, 'i');
  const ilceLower = ilce.toLowerCase().replace(/[İ]/g, 'i').replace(/[ı]/g, 'i');
  const semtLower = semt.toLowerCase().replace(/[İ]/g, 'i').replace(/[ı]/g, 'i');
  const adresYetersiz = !adres || adres.length < 10 ||
    /^[A-ZÇĞİÖŞÜ]\s*BLOK$/i.test(adres) ||
    adresLower === ilceLower ||
    adresLower === semtLower;

  let parts = [];
  if (adresYetersiz) {
    if (semt) parts.push(semt);
    if (ilce) parts.push(ilce);
    parts.push('İstanbul');
  } else {
    if (semt && !adresHasMah) parts.push(semt + ' Mahallesi');
    parts.push(adres);
    if (ilce) parts.push(ilce);
    parts.push('İstanbul');
  }
  return parts.join(', ');
}
