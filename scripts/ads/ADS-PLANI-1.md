# ADS Planı 1 — Reklam Metni Yenileme (Aşama 1)

**Hesap:** Asis Asansör (Customer ID: 7840558523)
**Hazırlanış:** 7 Haziran 2026 | **Revize:** 7 Haziran 2026 (yeniden değerlendirme sonrası)
**Hedef uygulama:** Kriter bazlı — 18-21 Haziran arası (Max Conversions stabilize olunca)
**Etki:** CTR %6 → %10+ (Şubat seviyesi), QS↑ → CPC↓ → CPA↓

---

## 0. Müşteri Onayları (7 Haz alındı)

| Soru | Cevap | Karar |
|---|---|---|
| 45 dk müdahale gerçekçi mi? | Evet | Kullanılabilir (ama "Hızlı" olarak yumuşatıldı, aşağıya bak) |
| WhatsApp'tan teklif? | Evet | Kullanılabilir (ama "Anında" yerine "Hızlı") |
| Ücretsiz keşif ne zaman? | En geç 1 gün sonra | "1 İş Günü İçinde Keşif" |
| 15. başlık? | Claude karar versin | "İstanbul Avrupa Yakası" (gerekçe §2) |
| Path tercihi? | En mantıklı olan | `/asansor/aylik-bakim` (gerekçe §2) |

---

## 1. Amaç ve Yeniden Değerlendirme Notu

Aktif gruptaki ("Aylık Bakım - Genel", id 190360442605) tek RSA'yı yenilemek.

**Mevcut sorunlar:**
- ❌ Path1/Path2 boş (görünür URL etkisiz)
- ❌ Başlık #12 `{KeyWord:Asansör Bakım Firması}` şablonu (CTR'a zarar)
- ❌ Başlık #15 "Avcılar Beylikdüzü Bakım" (ana grupta bölgesel karışıklık)
- ❌ Sosyal kanıt yok (7 yıl, 480+ apartman geçmiyor)
- ❌ WhatsApp referansı yok
- ❌ TS EN 81-20 başlıkta yok
- ❌ CTA çeşitliliği zayıf

**ÖNEMLİ — Yeniden değerlendirme kararı (7 Haz):**
Bu reklam yenilemesi DEĞERLİ ama acil değil. Daha hızlı/yüksek etkili işler var:
1. **AD_CALL=0 sorunu** — gerçek arama uzantısı ölçmüyor; çözülürse Max Conv çok daha doğru optimize eder
2. **Search Terms analizi** — boşa harcanan aramalara negatif → CPA'yı hızlı düşürür

Bu yüzden reklam yenileme, Search Terms analizinden SONRA yapılacak.

---

## 2. Final Reklam Metni

**Reklam Grubu:** Aylık Bakım - Genel (190360442605)
**Final URL:** `https://www.asisasansor.com`
**Path1:** `asansor` · **Path2:** `aylik-bakim`
> Görünür URL: `www.asisasansor.com/asansor/aylik-bakim`

**Path gerekçesi:** Ana keyword "asansör aylık bakım" ile birebir görünür uyum → tıklayan tam aradığını gördüğünü düşünür. Alternatifler (`/bakim/sozlesmeli`, `/avrupa-yakasi/bakim`) daha dar/dolaylı.

### 15 Başlık (≤30 karakter)

| # | Başlık | Kar. | Kategori |
|---|---|---:|---|
| 1 | Asansör Aylık Bakım | 19 | Keyword |
| 2 | 7 Yıl Tecrübe | 13 | Sosyal kanıt |
| 3 | 480+ Apartmanda Hizmet | 22 | Sosyal kanıt |
| 4 | Asansör Bakım Firması | 21 | Keyword |
| 5 | Asis Asansör | 12 | Marka |
| 6 | TS EN 81-20 Sertifikalı | 23 | Güven |
| 7 | Lisanslı Asansör Firması | 24 | Güven |
| 8 | 7/24 Acil Servis | 16 | Aciliyet |
| 9 | Yazılı Garanti | 14 | Güven |
| 10 | Aylık Bakım Sözleşmesi | 22 | Hizmet |
| 11 | Uzman Bakım Ekibi | 17 | Kalite |
| 12 | WhatsApp'tan Hızlı Teklif | 25 | WhatsApp+CTA |
| 13 | Garantili Asansör Bakımı | 24 | Keyword |
| 14 | 1 İş Günü İçinde Keşif | 22 | CTA |
| 15 | İstanbul Avrupa Yakası | 22 | Kapsam |

**15. başlık gerekçesi ("İstanbul Avrupa Yakası"):**
- Kapsamı netleştirir → Anadolu yakasından gelen boşa tıklamayı azaltır
- HER arayanı etkiler (sadece acil arayan değil)
- Diğer adaylar reddedildi: "45 Dk Müdahale" (#8 ve açıklamada aciliyet zaten var, tekrar), "Hemen Arayın+numara" (çağrı uzantısı zaten numara gösteriyor), "Acil Arıza" (#8 ile çakışma)

### 4 Açıklama (≤90 karakter)

| # | Açıklama | Kar. |
|---|---|---:|
| 1 | İstanbul Avrupa Yakası'nda 7 yıl tecrübeli ekip, 480+ apartmanda asansör bakımı. | 80 |
| 2 | Aylık bakım + 7/24 acil müdahale. Yazılı garanti, TS EN 81-20 sertifikalı ekip. | 79 |
| 3 | Asansör güvenliği için profesyonel aylık bakım. WhatsApp'tan hızlı teklif alın. | 78 |
| 4 | Bina yöneticilerinin tercihi Asis Asansör. Acil arızada hızlı müdahale. | 71 |

**Vaad yumuşatma gerekçesi (7 Haz revizesi):**
Reklamdaki sözler tutulamayınca müşteri şikayeti + olumsuz inceleme riski doğar. Bu yüzden:
- "45 Dk Müdahale" → "Hızlı müdahale" (Büyükçekmece/Esenler 45dk zor olabilir)
- "Anında Teklif" → "Hızlı teklif" (gece/çalışma saati dışı için esneklik)
- "24 Saat İçinde" → "1 İş Günü İçinde" (hafta sonu esnekliği)
Vaad ne kadar somut/agresifse risk o kadar yüksek. Hızlı+güvenli denge kuruldu.

---

## 3. Pinning Stratejisi

**Karar: Pin YOK** — algoritma serbest, Ad Strength EXCELLENT korunur.
Çeşitlilik + daha iyi öğrenme. Brand'i pinlemek Ad Strength'i düşürür, gerekmiyor.

---

## 4. Uygulama Yöntemi (revize)

**Eski plan:** "İki reklamı paralel A/B test"
**Sorun:** Max Conv tek dönüşüme odaklanır, bir reklamı çabuk kazanan ilan edip diğerini ezer → gerçek A/B olmaz.
**Yeni yöntem:**
1. Yeni RSA ekle (eski hâlâ ENABLED)
2. Yeni reklam **3-5 gün gösterim toplasın** (yeterli veri için)
3. Sonra eski RSA'yı **pause** et
4. Yeni reklam tek başına devam

---

## 5. Revize Takvim (kriter bazlı — sabit tarih değil)

| Aşama | Tarih | Aksiyon | Kriter |
|---|---|---|---|
| Bekleme | 7-13 Haz | Hiçbir şey, Max Conv öğreniyor | — |
| Hazırlık | 13-14 Haz | Müşteri vaad detayları netleştirir (saat aralığı, hafta sonu) | — |
| **Search Terms** | 15-17 Haz | Boşa harcanan aramalar → yeni negatif (HIZLI KAZANIM) | Max Conv ≥8 gün |
| Reklam yenileme | 18-21 Haz | Yeni RSA ekle | Max Conv stabil (CPC dalgalanması azalmış, CPA bandında) |
| Eski pause | 23-25 Haz | Yeni reklam 3-5g veri topladıktan sonra eskiyi pause | Yeni RSA ≥100 gösterim |
| Değerlendirme | 28 Haz-2 Tem | Yeni vs eski: CTR, dönüşüm oranı, QS | — |

**KRİTİK KURAL:** "18-21 Haz" sabit değil. Max Conversions stabilize OLMADAN reklam değiştirilmez. Stabilizasyon kriteri: son 3 gün CPC dalgalanması <%30, CPA hedef bandına yaklaşmış.

---

## 6. Risk Yönetimi

| Risk | Etki | Hafifletme | Geri dönüş |
|---|---|---|---|
| Yeni reklam kötü performans | Birkaç gün CPA↑ | Eski 3-5g paralel tut | Yeniyi pause, eskiyi tut |
| Google reddi (politika) | Yayına girmez | Çağrı uzantısı çakışması kontrol | Reddedilen başlığı değiştir |
| Öğrenme bozulması | Toparlanma uzar | Max Conv stabil olmadan dokunma | — |
| Vaad tutulamaz | Şikayet/olumsuz yorum | Vaadler yumuşatıldı (§2) | Metin revize |

---

## 7. Başarı Metrikleri

### 1 hafta sonra (yeni reklam sonrası):
| Metrik | Hedef | Baseline (7 Haz) |
|---|---|---|
| CTR | %8+ | %6.1 |
| Dönüşüm oranı | %15+ | %13.5 (7g) |
| CPA | <500₺ | 365-636₺ |
| Ad Strength | EXCELLENT | EXCELLENT |

### 2-3 hafta sonra:
- searchPredictedCtr → ABOVE_AVERAGE'a yaklaşma
- CPC 80-100₺ bandı
- CPA Şubat seviyesi hedefi (235-300₺)

---

## 8. Kapsam Dışı (bu plan SADECE reklam metni)

- ❌ Yeni reklam grupları
- ❌ Bütçe değişikliği
- ❌ Keyword ekleme/çıkarma (Search Terms ayrı iş)
- ❌ Bidding strategy değişikliği
- ❌ Site içerik (Aşama 3)
- ❌ Sitelink/callout (ayrı iş)

---

## 9. Bağlı/Öncelikli Diğer İşler (bu plandan ÖNCE veya PARALEL)

Yeniden değerlendirmede ortaya çıkan, reklam yenilemesinden daha hızlı kazanım sağlayabilecekler:

1. **AD_CALL=0 incelemesi** (15 Haz) — gerçek arama uzantısı neden ölçmüyor? Çözülürse Max Conv sinyali çok güçlenir.
2. **Search Terms analizi** (15-17 Haz) — boşa harcanan aramalara negatif → CPA hızlı düşer.
3. **Local-Directions ikincil** (panelden) — zayıf sinyal, Max Conv'u yanıltmasın.
4. **Lead Form review durumu** — 20 May'dan beri incelemede, sonuç ne?

---

## 10. Onay Durumu

- [x] 5 sorunun cevapları alındı (7 Haz)
- [x] Final metin hazır (vaadler yumuşatıldı)
- [ ] Uygulama: Max Conv stabilize olunca (18-21 Haz hedef, kriter bazlı)
- [ ] Müşteri vaad detayları (çalışma saati, hafta sonu keşif) netleştirilecek (13-14 Haz)

---

## 11. Notlar

- Max Conversions geçişi 7 Haz akşam yapıldı → öğrenme 17-20 Haz civarı oturur
- 65 bölgesel keyword zaten doğru /bolgeler sayfasına yönlü
- 6 dönüşüm eylemi birincil; gerçek aramalar doğrulandı (7 Haz: 13:00 ve 17:36)
- Bu plan reklam metni yenilemenin TEK seferde, tek RSA değişikliğiyle yapılmasını öngörür
