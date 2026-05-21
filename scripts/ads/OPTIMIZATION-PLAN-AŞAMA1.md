# Google Ads Optimizasyon Planı — Aşama 1

**Hesap:** Asis Asansör (Customer ID: 7840558523)
**Hazırlanış Tarihi:** 21 Mayıs 2026
**Uygulama Tarihi:** 26 Mayıs 2026 (öğrenme dönemi bittikten sonra)
**Hazırlayan:** Claude (Opus 4.7)

---

## 1. Amaç ve Kapsam

### Hedef
Quality Score'u 3-4 bandından 6-7 bandına çekmek (uzun vadede 8-9).

### Kapsam (Aşama 1)
Bu plan sadece **reklam asset'leri** ile ilgili 3 müdahaleyi kapsar:
1. **URL düzeltme & www tutarlılığı**
2. **Path1/Path2 doldurma**
3. **`{KeyWord:...}` şablonunun kaldırılması**

Reklam metni yenileme (Aşama 2) ve landing page revizyonu (Aşama 3) ayrı planlarda ele alınacaktır.

### Tahmini Etki
- Quality Score: 3-4 → **5-6** (2-3 hafta içinde)
- CTR: %5.4 → **%7-8**
- CPC: 94₺ → **~80₺**
- Dönüşüm başı maliyet: 1.498₺ → **~1.200₺**

---

## 2. Önemli Teknik Gerçek

**Google Ads RSA'ları (Responsive Search Ad) immutable'dır.** Path, headline, description gibi alanları değiştirmek için:
- ❌ Mevcut reklam **edit edilemez**
- ✅ Yeni reklam **oluştur**, eskisini **pause** et
- Eski reklamın performans geçmişi korunur, kalite skoru sıfırdan başlar

**Sonuç:** Yeni reklam → mini öğrenme dönemi (~3-5 gün). Bu yüzden:
- Tek seferde tüm değişiklikleri yap (parça parça öğrenmeyi tekrar tekrar sıfırlamamak için)
- Eski reklamları **silmek yerine pause** et (geri dönüş için)
- 26 May'da uygula → 31 May civarı sonuçları gör

---

## 3. Mevcut Durum Envanteri

### Aktif Reklamlar (12 adet)

| # | Reklam Grubu | Ad ID | URL | {KeyWord:} | Path | Son 7g CTR |
|---|---|---|---|---|---|---|
| 1 | Aylık Bakım - Genel | 809341192954 | www.asisasansor.com | ✓ var | yok | %3.92 |
| 2 | Firma & Tamir | 808936915842 | www.asisasansor.com/ | yok | yok | %9.4 |
| 3 | Firma & Tamir | 808971529141 | **asisasansor.com/** (www yok) | yok | yok | 0 |
| 4 | Genel Bakım | 808935847560 | **asisasansor.com/** (www yok) | yok | yok | 0 |
| 5 | Genel Bakım | 808936956213 | www.asisasansor.com/ | yok | yok | %10.36 |
| 6 | Aylık Bakım - Bölgesel | 799202876534 | www.asisasansor.com | ✓ var | asansor/aylik-bakim | 0 |
| 7 | Aylık Bakım - Esenyurt | 809341234006 | bolgeler/esenyurt | ✓ var | yok | 0 |
| 8 | Aylık Bakım - Avcılar | 809341234009 | bolgeler/avcilar | ✓ var | yok | 0 |
| 9 | Aylık Bakım - Beylikdüzü | 809341234012 | bolgeler/beylikduzu | ✓ var | yok | 0 |
| 10 | Bölgesel Bakım | 808972865734 | www.asisasansor.com/ | yok | yok | 0 |
| 11 | Bölgesel Bakım | 809052369770 | **asisasansor.com/** (www yok) | yok | yok | 0 |
| 12 | Montaj | 799094255688 | www.asisasansor.com | yok | asansor/kurulum | 0 |
| 13 | Revizyon | 799129947343 | www.asisasansor.com | yok | asansor/revizyon | 0 |

### Tespit Edilen Sorunlar
- **3 reklamda www yok** (#3, #4, #11)
- **5 reklamda `{KeyWord:...}` şablonu** var (#1, #6, #7, #8, #9)
- **8 reklamda Path1/Path2 boş** (#1-#5, #7-#11)
- **Duplikat reklamlar** var (Firma & Tamir grubunda 2 reklam aynı içerik)

---

## 4. Reklam Başına Detaylı Aksiyon Planı

### #1 — Aylık Bakım - Genel (Ad ID: 809341192954)

**Mevcut durum:**
- URL: `https://www.asisasansor.com` ✅ (www doğru)
- Path1/Path2: boş ❌
- `{KeyWord:Asansör Bakım Firması}` headline'da var ❌
- CTR %3.92 (zayıf)
- Son 7g: 8 tıklama, 204 gösterim

**Aksiyon:** **Yeni reklam oluştur, eskisini pause et.**

**Yeni reklam içeriği:**

| Alan | Değer |
|---|---|
| Final URL | `https://www.asisasansor.com` (ileride aylık bakım landing page'i yapıldığında: `/asansor-aylik-bakim`) |
| Path1 | `asansor-bakim` |
| Path2 | `istanbul` |

**Headlines (15 adet, çeşitlendirilmiş):**

*Anahtar kelime eşleme (4):*
1. `Asansör Aylık Bakım`
2. `Asansör Bakım Firması`
3. `Apartman Asansör Bakımı`
4. `Asansör Bakım Sözleşmesi`

*USP & Sosyal Kanıt (4):*
5. `15 Yıl Deneyimli Ekip` *(rakam doğru mu sen onayla)*
6. `TS EN 81-20 Sertifikalı`
7. `500+ Apartmanda Hizmet` *(rakam doğru mu sen onayla)*
8. `Lisanslı Asansör Firması`

*Fayda (3):*
9. `45 Dakikada Olay Yerinde`
10. `7/24 Acil Müdahale`
11. `Yazılı Garantili Bakım`

*Lokal (2):*
12. `Avrupa Yakası Asansör Bakım`
13. `İstanbul Asansör Servisi`

*CTA (2):*
14. `Ücretsiz Keşif Talep Et`
15. `WhatsApp'tan Teklif Al`

**Descriptions (4 adet):**
1. `İstanbul Avrupa Yakası'nda 15 yıl deneyimle apartman asansör bakımı. TS EN 81-20 uyumlu, yazılı garantili.`
2. `500+ apartmanda lisanslı ekibimizle aylık bakım sözleşmesi. 45 dk içinde sahada, 7/24 acil müdahale.`
3. `Asansörünüzün güvenliği için profesyonel bakım. Ücretsiz keşif ve teklif için WhatsApp'tan yazın.`
4. `Apartman asansör bakımında uzman firma. Sözleşmeli aylık bakım, revizyon ve onarım tek elden.`

**Uyarı:** Headline 5 ve 7'deki rakamlar **mutlaka doğrulanmalı** — yanlış sayı kullanmak Google policy violation. Doğru sayıları söyle, ona göre düzeltirim.

---

### #2 — Firma & Tamir (Ad ID: 808936915842) — En İyi Performans

**Mevcut durum:**
- URL: `https://www.asisasansor.com/` ✅
- Path: boş ❌
- {KeyWord:} yok ✅
- CTR %9.4 ✅ (iyi)

**Aksiyon:** **Sadece path ekle. Headlines/descriptions iyi durumda, dokunma.**

Path1: `asansor-tamiri`
Path2: `7-24-servis`

Path eklemek için yine yeni reklam oluşturmak gerekecek ama bu sefer **mevcut metni bire bir kopyalayıp** sadece path alanlarını dolduracağız.

---

### #3 — Firma & Tamir Duplicate (Ad ID: 808971529141)

**Mevcut durum:**
- URL: `https://asisasansor.com/` ❌ (www yok)
- 0 trafik
- Aynı içerik #2 ile

**Aksiyon:** **Bu reklamı sil (REMOVE).** Duplikat ve yanlış URL'li, gereksiz.

---

### #4 — Genel Bakım Duplicate (Ad ID: 808935847560)

**Mevcut durum:**
- URL: `https://asisasansor.com/` ❌ (www yok)
- 0 trafik
- Aynı içerik #5 ile

**Aksiyon:** **Sil (REMOVE).**

---

### #5 — Genel Bakım (Ad ID: 808936956213) — En İyi Performans

**Mevcut durum:**
- URL: `https://www.asisasansor.com/` ✅
- Path: boş ❌
- {KeyWord:} yok ✅
- CTR %10.36 ✅ (mükemmel)

**Aksiyon:** **Sadece path ekle.** Headlines iyi durumda.

Path1: `asansor-bakim`
Path2: `apartman`

---

### #6 — Aylık Bakım - Bölgesel (Ad ID: 799202876534)

**Mevcut durum:**
- URL: `https://www.asisasansor.com` ✅
- Path: `asansor/aylik-bakim` ✅ (zaten dolu)
- `{KeyWord:Asis Asansör}` var ❌
- 0 trafik

**Aksiyon:** **{KeyWord:} kaldır, çoklu bölge headline'larını koru.**

Path'i daha optimize edebiliriz:
Path1: `asansor-bakim` (mevcut: `asansor`)
Path2: `bolgesel-hizmet` (mevcut: `aylik-bakim`)

Headline'da `{KeyWord:Asis Asansör}` yerine: `Asis Asansör Bölgesel Bakım`

---

### #7-9 — Esenyurt / Avcılar / Beylikdüzü (Ad IDs: 809341234006, 809341234009, 809341234012)

**Mevcut durum:**
- URL: `/bolgeler/[ilce]` ✅ (doğru lokal sayfa)
- Path: boş ❌
- `{KeyWord:Asansör Bakım Firması}` var ❌
- Çok düşük trafik (algoritma temkinli)

**Aksiyon:** **Her biri için {KeyWord:} kaldır + path ekle.**

| İlçe | Path1 | Path2 |
|---|---|---|
| Esenyurt | `esenyurt` | `asansor-bakim` |
| Avcılar | `avcilar` | `asansor-bakim` |
| Beylikdüzü | `beylikduzu` | `asansor-bakim` |

`{KeyWord:Asansör Bakım Firması}` yerine: ilçe + spesifik bir headline (`Esenyurt'ta En Hızlı Servis` gibi).

---

### #10 — Bölgesel Bakım (Ad ID: 808972865734)

**Mevcut durum:**
- URL: `https://www.asisasansor.com/` ✅
- Path: boş ❌
- {KeyWord:} yok ✅
- 19 gösterim, 0 tıklama

**Aksiyon:** Path ekle.

Path1: `asansor-bakim`
Path2: `bolgesel`

---

### #11 — Bölgesel Bakım Duplicate (Ad ID: 809052369770)

**Mevcut durum:**
- URL: `https://asisasansor.com/` ❌ (www yok)
- Aynı içerik #10 ile
- 0 trafik

**Aksiyon:** **Sil (REMOVE).**

---

### #12 — Montaj (Ad ID: 799094255688)

**Mevcut durum:**
- URL: `https://www.asisasansor.com` ✅
- Path: `asansor/kurulum` ✅
- {KeyWord:} yok ✅
- 0 trafik (Montaj kampanyası genel olarak ölü — ayrı sorun)

**Aksiyon:** **Bu reklama dokunma.** Bu reklamla ilgili değil, kampanya seviyesinde sorun var (büyük ihtimal teklif/kelime sorunu). Ayrı bir incelemede ele alacağım.

---

### #13 — Revizyon (Ad ID: 799129947343)

**Mevcut durum:**
- URL: `https://www.asisasansor.com` ✅
- Path: `asansor/revizyon` ✅
- {KeyWord:} yok ✅
- 0 trafik

**Aksiyon:** **Bu reklama dokunma.** Yine kampanya seviyesinde sorun.

---

## 5. Uygulama Sırası (26 Mayıs)

### Adım 1: Yedek Al (5 dk)
- Mevcut tüm reklamların **JSON dökümünü** indir, repoya kaydet
- Geri dönüş gerekirse referans olacak

### Adım 2: Duplikatları Sil (5 dk)
- #3, #4, #11 → REMOVE
- Risk düşük: 0 trafik, duplikat

### Adım 3: Yeni Reklamları Oluştur (30 dk)
Sırayla:
1. #1 yerine yeni (Aylık Bakım - Genel)
2. #2 yerine yeni (Firma & Tamir — sadece path eklenmiş)
3. #5 yerine yeni (Genel Bakım — sadece path eklenmiş)
4. #6 yerine yeni (Bölgesel — {KeyWord:} temizlenmiş)
5. #7, #8, #9 yerine yeni (Esenyurt/Avcılar/Beylikdüzü)
6. #10 yerine yeni (Bölgesel Bakım — path eklenmiş)

### Adım 4: Eski Reklamları Pause Et (5 dk)
- Yeni reklamlar onaylandıktan **sonra** eskileri PAUSED yap
- Eski reklamların geçmiş verisini sakla, REMOVE etme

### Adım 5: Onaylandı mı Kontrolü (1 saat sonra)
- Tüm yeni reklamların `approvalStatus = APPROVED` olduğunu kontrol et
- Reddedilen olursa hemen söyle, düzeltelim

---

## 6. Risk Yönetimi

### Risk 1: Öğrenme Dönemi Çakışması
**Etki:** CPC geçici olarak %15-25 artabilir 3-5 gün
**Önlem:** Tüm değişiklikleri **tek günde** yap. Parça parça uygulamak öğrenmeyi tekrar tekrar sıfırlar.
**İzleme:** 31 May'da ilk sağlıklı veri gelir.

### Risk 2: Reklam Reddedilme
**Etki:** Yeni reklam REJECTED olursa o reklam grubunda gösterim durur
**Önlem:** Eski reklamı **PAUSE** et, REMOVE etme. Yeni reddedilirse eskiyi geri açarız.

### Risk 3: Yanlış Sayı/Bilgi
**Etki:** Headline'da "15 yıl deneyim" yazıyorsa ve doğru değilse Google policy violation
**Önlem:** Sayıları **sen onayla**, ben uydurmuyorum. Belirsiz olanları çıkaracağım.

### Risk 4: Performans Düşüşü
**Etki:** Yeni reklamlar eskisinden kötü gelebilir
**Önlem:** İlk 5 gün veriyle eskisini karşılaştır. Eğer:
- CTR %30+ düşerse → yeni reklamı pause, eskisini geri aç
- Dönüşüm %50+ düşerse → tam rollback

---

## 7. Ölçüm Planı (Uygulama Sonrası)

### Hangi metrikleri takip edeceğim?

**Günlük (5 gün):**
- CTR (hedef: %7+)
- CPC (hedef: 85₺ altı)
- Dönüşüm sayısı (hedef: günde 1+)
- Reddedilme/onay durumu

**Haftalık (4 hafta):**
- Quality Score değişimi (hedef: ortalama 5+)
- Dönüşüm başı maliyet (hedef: 1.300₺ altı)
- Search term raporu (yeni alakasız aramalar)

### Raporlama
Her sabah otomatik rapor (routine) içinde:
- "Optimizasyon sonrası" bandını göster
- Eski reklamlarla karşılaştır
- 5. günde **karar raporu** ver: devam mı, rollback mı, ek iyileştirme mi

---

## 8. Sonraki Aşamalar (Bu Plan Bittikten Sonra)

### Aşama 2 — Reklam Metni Yenileme (Haftalar 3-4)
- Tüm headline'ları yeniden yapılandır (fayda + USP + sosyal kanıt + CTA dengesi)
- A/B test: 2 farklı versiyon her grup için

### Aşama 3 — Landing Page Optimizasyonu (Haftalar 5-8)
- Site sahibi/geliştirici ile çalış
- Her hizmet için ayrı LP
- H1, form, CTA, hız iyileştirmeleri

### Aşama 4 — Negatif Kelime Çalışması (Hafta 2 paralel)
- Önceki rapordaki rakip + yanlış şehir + bilgi araması listesi
- Topluca negatif eklenecek

### Aşama 5 — Bölgesel Reklam Grubu Aktivasyonu
- Esenyurt/Avcılar/Beylikdüzü neden 0 gösterim alıyor? Teklif mi düşük, kelime mi az?

### Aşama 6 — Montaj & Revizyon Kampanyası
- Şu an ölü, neden? Bütçe paylaşımı + kelime stratejisi gerek

---

## 9. Onayın Gereken Kararlar

26 Mayıs'a kadar bana net cevap ver:

1. **Sayılar onayı:**
   - 15 yıl deneyim doğru mu? Doğru değilse kaç yıl?
   - 500+ apartman doğru mu? Doğru değilse yaklaşık kaç?
   - Hangi sertifikaları yazabiliriz? (TS EN 81-20 dışında ISO, OHSAS vb?)

2. **CTA tercihi:**
   - WhatsApp numarası var mı? Reklamda kullanalım mı?
   - "Ücretsiz keşif" tek mi? Yoksa "Ücretsiz fiyat teklifi" daha mı iyi?

3. **Path tercihi:**
   - Path'leri ben yukarıdaki gibi mi yapayım yoksa farklı öneriniz var mı?
   - "asansor-bakim" yerine "asansor-bakim-istanbul" gibi daha uzun mu olsun?

4. **Yeni landing page için:**
   - `/asansor-aylik-bakim` ve `/asansor-tamiri` gibi sayfalar açılabilir mi? (Site geliştirici ile konuşman lazım)

---

## 10. Plan Çalıştırma Checklist'i (26 Mayıs günü)

- [ ] Öğrenme dönemi tamamlanmış mı? (Performans verisini kontrol et)
- [ ] Cuma-Cumartesi-Pazar verilerine bak, anormallik var mı?
- [ ] Yedek alındı mı? (`/tmp/gads/backup-pre-optimization.json`)
- [ ] Kullanıcı onaylanan sayıları gönderdi mi?
- [ ] Duplikatlar silindi mi? (#3, #4, #11)
- [ ] Yeni reklamlar oluşturuldu mu? (11 adet)
- [ ] Yeni reklamlar approve mı oldu? (1 saat sonra kontrol)
- [ ] Eski reklamlar pause edildi mi? (Yeniler approve olduktan SONRA)
- [ ] Uygulama log'u repoya commit edildi mi?
- [ ] Routine'e "optimizasyon sonrası moda geçildi" notu eklendi mi?

---

**Bu planı 26 Mayıs sabahı tekrar gözden geçireceğim, gerekirse o günkü performansa göre revize edeceğim. Plan onayın bekliyor.**
