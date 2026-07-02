# Güvenlik Notları — Düzeltilecekler

> Tarih: 02.07.2026 · Kod incelemesinde tespit edildi. Öncelik sırasına göre.
> Her madde düzeltildiğinde işaretlenip commit'te referans verilecek.

## 🔴 1. Diğer firmaların bakımcıları Asis verisine erişebiliyor (KRİTİK)

**Yer:** `database.rules.json` → `$legacyKey` kuralı

- **Okuma:** `auth.token.email.endsWith('@asistakip.app')` → *herhangi bir* tenant'ın
  bakımcısı (`bakimci_firmaX_ali@asistakip.app`) Asis'in TÜM flat verisini
  (finans, ödemeler, asansörler) okuyabilir.
- **Yazma:** `auth.token.email.beginsWith('bakimci_')` → başka firmanın bakımcısı
  Asis'in `at_elevs`, `at_maints`, `at_sonodemeler` verisine yazabilir.

**Düzeltme planı:** Legacy kuralda bakımcı e-postasını Asis formatıyla sınırla.
Asis bakımcı e-postaları `bakimci_{ad}@asistakip.app` (tenant prefix'siz,
bkz. `makeBakimciEmail`), tenant bakımcıları `bakimci_{tenantId}_{ad}@...`.
Ayrım için: users/{uid}.tenantId === 'asis' profil kontrolü en sağlamı —
ancak eski Asis bakımcı hesaplarında profil olmayabilir; önce mevcut
hesapların profil durumu doğrulanmalı (aksi halde kilitlenirler).

## 🟡 2. "Sistemi Sıfırla" şifresi kodda açık (199494)

**Yer:** `src/App.jsx` (Dashboard → Sistemi Sıfırla)

Tarayıcıdan JS kaynağını okuyan herkes şifreyi görebilir. Buton zaten yönetici
ekranında ama şifre gerçek koruma değil.

**Düzeltme planı:** Hardcoded şifreyi kaldır; yerine çift onay + yazarak onay
("SİL" yazın) veya Firebase Auth re-authentication iste.

## 🟡 3. SheetJS harici CDN'den yükleniyor

**Yer:** `index.html` → `cdn.sheetjs.com/xlsx-0.20.3/.../xlsx.full.min.js`

CDN ele geçirilirse uygulamaya rastgele JS enjekte edilebilir (tüm veriye erişim).
SW cache'lediği için offline çalışıyor ama kaynak hâlâ harici.

**Düzeltme planı:** `xlsx` paketini npm bağımlılığı olarak bundle'a al
(`npm i xlsx` + import) ve CDN script'ini kaldır. Alternatif: script tag'ine
`integrity` (SRI) hash ekle.

## 🟡 4. Rules'ta veri doğrulama yok (tutar/şema)

**Yer:** `database.rules.json` → `$dataKey` / `$legacyKey`

Yazma izni olan herkes (ör. bakımcı) `at_elevs` altında bakiye/ücret dahil
her alanı sınırsız değiştirebilir; tutarlar için tip/aralık doğrulaması yok.
Kötü niyetli veya hatalı istemci finansal veriyi bozabilir.

**Düzeltme planı:** Kritik alanlara `.validate` kuralları (isNumber, makul
aralık); uzun vadede ödeme defteri (append-only `at_payment_events`) modeline
tam geçiş.

## 🟢 5. Bilgi amaçlı (açık değil)

- **Firebase apiKey / VAPID key kodda görünüyor:** Normal ve beklenen —
  Firebase web güvenliği rules'a dayanır. Aksiyon gerekmez.
- **`at_bakimcilar_pub` herkese açık okunur:** Login ekranı için bilinçli
  tasarım; içinde şifre yok (`hasSifre` boolean). Aksiyon gerekmez.
- **Sabah Raporu GitHub Action'ı 20.06'dan beri her gün hata veriyor:**
  Güvenlik değil ama takipte kalınmalı.
