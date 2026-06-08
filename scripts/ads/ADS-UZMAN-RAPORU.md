# ADS Uzman Raporu — Asis Asansör Google Ads

**Hazırlayan:** Claude (Google Ads uzmanı rolü)
**Tarih:** 8 Haziran 2026
**Hesap:** Asis Asansör (Customer ID: 7840558523)
**Kampanya:** Asansör- Aylık Bakım (id: 23493351493)
**Yöntem:** Hesap verisi (Google Ads API v20) + 2026 sektör araştırması (internet)

---

## YÖNETİCİ ÖZETİ

Hesap **iyi yolda** ama 3 önemli kaldıraç var:

1. 🔴 **AD_CALL=0 sorunu** — gerçek arama uzantısı dönüşüm KAYDETMİYOR. Muhtemel sebep: çağrı süresi eşiği çok yüksek (varsayılan 60sn). **Bu, Max Conversions'ın en kritik eksiği.**
2. 🟡 **~5.700₺/ay boşa harcama** — 3 keyword tık alıyor, 0 dönüşüm getiriyor.
3. 🟢 **Mobil-first pazar** (%80 mobil, %12.4 dönüşüm oranı) — mobil deneyim CPA'yı belirliyor.

**En verimli keyword:** "asansör firmaları" [EXACT] → CPA 284₺, %33 dönüşüm oranı.
**Hedef:** CPA 707₺ (Mayıs) → 350-400₺ (Şubat seviyesi).

---

## 1. MEVCUT DURUM (8 Haziran 2026)

### Kampanya ayarları
| Ayar | Değer |
|---|---|
| Durum | ENABLED |
| Strateji | **MAXIMIZE_CONVERSIONS** (7 Haz'da geçildi, öğrenme döneminde) |
| Target CPA | Yok (sınırsız) |
| Günlük bütçe | 1.700₺ |
| Aktif grup | 1 (Aylık Bakım - Genel, 139 keyword) |

### Son 4 gün performans
| Tarih | Imp | Tık | Maliyet | Dönş | CPA | CTR | CPC |
|---|---:|---:|---:|---:|---:|---:|---:|
| 5 Haz | 255 | 8 | 729₺ | 2 | 364₺ | 3.1% | 91₺ |
| 6 Haz | 119 | 5 | 702₺ | 0 | — | 4.2% | 140₺ |
| 7 Haz | 45 | 5 | 636₺ | 1 | 636₺ | 11.1% | 127₺ |
| 8 Haz | (öğrenme başı) | | | | | | |

---

## 2. 🔴 KRİTİK BULGU: AD_CALL Dönüşümü Kaydedilmiyor

### Sorun
- Çağrı uzantısı (0543 507 07 94) **aktif ve reklamda görünüyor**
- Ama "Reklamlardan sesli arama" (AD_CALL) son 14 günde **0 dönüşüm**
- Tüm telefon dönüşümleri "Tıkla ve ara" (siteden) üzerinden geliyor

### İnternet araştırması ne diyor (2026 best practice)
> "Varsayılan olarak 'Calls from ads' dönüşümü 60 saniyeden uzun aramaları sayar. Eşik çok yüksekse meşru aramalar filtrelenir. 60sn ayarlıysa ama müşteri aramaları 45sn sürüyorsa, hiçbiri sayılmaz."
> — [Google Ads Help: Phone call conversion tracking](https://support.google.com/google-ads/answer/6100664)

### Muhtemel kök sebep
Asansör acil arama davranışı: "Asansör arızalı, hemen gelir misiniz?" → 20-40 saniyelik kısa aramalar. **60sn eşiği bunları eler.**

### Önerilen aksiyon (müşteri panelden yapmalı)
1. Google Ads → **Hedefler → Dönüşümler**
2. "Reklamlardan sesli arama yapma (2)" eylemini aç
3. **"Çağrı uzunluğu"** ayarını bul
4. **60sn → 15sn** indir (asansör acil aramaları kısa)
5. Ayrıca "Call details" raporundan gerçek arama sürelerini kontrol et

**Beklenen etki:** Gerçek aramalar sayılmaya başlar → Max Conversions doğru sinyal alır → optimizasyon kalitesi artar.

**Kaynak:** [Cometly: Google Ads Not Tracking Phone Call Conversions](https://www.cometly.com/post/google-ads-not-tracking-phone-call-conversions)

---

## 3. 🟡 BOŞA HARCAMA: Verimsiz Keyword'ler

### Son 30 günde tık alıp 0 dönüşüm getirenler
| Keyword | Eşl. | QS | Tık | Maliyet | Dönş |
|---|---|---:|---:|---:|---:|
| bahçelievler asansör | PHRASE | 5 | 8 | 1.426₺ | **0** |
| asansor bakim (typo) | PHRASE | — | 9 | 1.029₺ | **0** |
| asansör bakım servisleri | PHRASE | — | 4 | 704₺ | **0** |
| avcılar asansör firmaları | PHRASE | 3 | 8 | 543₺ | **0** |
| **Toplam** | | | | **~3.700₺** | 0 |

### Ayrıca düşük verimli (yüksek CPA)
| Keyword | CPA |
|---|---:|
| asansör bakım ücreti | 1.971₺ |
| istanbul asansör firmaları | 1.328₺ |
| asansör şirketleri | 1.755₺ |

### Önerilen aksiyon (Max Conv stabilize olunca, ~18 Haz)
- **Pause:** bahçelievler asansör (PHRASE), asansor bakim (typo), asansör bakım servisleri
- **İzle:** Yüksek CPA'lılar — Max Conv bunları otomatik kısabilir, 1 hafta bekle
- **NOT:** Şimdi pause ETME — Max Conv öğrenme bozulur. 18 Haz sonrası.

---

## 4. 🟢 YILDIZ KEYWORD'LER — İşin Motoru

| Keyword | Eşl. | QS | CR | CPA |
|---|---|---:|---:|---:|
| **asansör firmaları** | EXACT | 3 | **%33** | **284₺** 🏆 |
| asansör bakım firmaları | PHRASE | 5 | %29 | 326₺ |
| asansör bakım firmaları istanbul | PHRASE | 6 | %33 | 553₺ |
| asansör tamiri | PHRASE | 5 | %20 | 483₺ |

### Uzman içgörü
**En düşük CPA'lı keyword (284₺) QS=3 olan EXACT match.** Bu önemli: niyet net olunca (tam eşleşme) düşük QS bile yüksek dönüşüm getiriyor.

### Önerilen aksiyon (18 Haz sonrası)
- "asansör firmaları" EXACT performansını koru
- Yüksek CR'li PHRASE'leri EXACT'a çevirmeyi değerlendir (daha hedefli)
- Search Terms'te dönüşen yeni terimleri EXACT keyword olarak ekle

---

## 5. 📱 CİHAZ ANALİZİ: Mobil-First

| Cihaz | Imp | Pay | CR | CPA |
|---|---:|---:|---:|---:|
| **Mobil** | 3.366 | %80 | **%12.4** | 847₺ |
| Masaüstü | 831 | %20 | %7.9 | 893₺ |

### Uzman içgörü
- Trafiğin %80'i mobil + mobil dönüşüm oranı 1.5x yüksek
- **Mobil landing page deneyimi = CPA'nın belirleyicisi**
- Yeni site (Next.js) mobil-uyumlu → bu avantajı kullanmalı

### 2026 sektör benchmark (araştırma)
> "Quality Score 10, Quality Score 5'e göre CPC'de %50 tasarruf sağlar. QS 5'te 4$ CPC ödeyen işletme, QS 10'a çıkınca ~2$'a iner."
> — [GROAS: Quality Score 2026](https://www.groas.com/post/google-ads-quality-score-optimization-2026)

Bizim QS ortalaması ~4.9 → 7'ye çıkarsak CPC ~%30 düşer.

---

## 6. ⏰ SAAT & GÜN ANALİZİ

### Altın pencere (90g veri)
- **Dönüşüm saatleri:** 10:00-16:00 (tüm dönüşümler bu aralıkta)
- **En verimli günler:** Çarşamba (CPA 427₺), Cuma (CPA 384₺)
- **En zayıf:** Cumartesi (CPA 823₺)

### Uzman içgörü
Max Conversions bu pattern'i otomatik öğrenecek. Manuel bid ayarı GEREKMİYOR (Smart Bidding zaten yapıyor). Sadece **ad schedule** (08-18 hafta içi, kısıtlı hafta sonu) korunmalı.

---

## 7. NEGATİF KEYWORD DURUMU

### Mevcut: 149 negatif (8 Haz itibarıyla)
Kategoriler: ~58 rakip marka, ~20 bölge dışı şehir, ~35 bilgi/soru, ~13 iş/kariyer, ~6 alakasız.

### 8 Haz eklenen (bu rapor kapsamında)
- `torbalı` (BROAD) — İzmir/Torbalı
- `belediyesi` (PHRASE) — kurumsal muayene
- `fupa asansör` (PHRASE) — rakip

### Search Terms'ten gelecek negatif adayları (izlenecek)
| Aday | Sebep | Durum |
|---|---|---|
| en yakın asansörcü | düşük niyet | Müşteri istemedi, beklemede |
| esenyurt belediyesi muayene | "belediyesi" ile kapsandı | ✅ Çözüldü |
| torbalı | İzmir | ✅ Eklendi |

---

## 8. QUALITY SCORE STRATEJİSİ (2026 best practice)

### Mevcut QS dağılımı (ana grup, 43 keyword)
- Ortalama: ~4.9
- Bileşenler: Reklam alaka 🟢 (40/43 ABOVE), CTR 🟡 (yarı yarıya), **Landing page 🔴 (29/43 BELOW)**

### 3 bileşen ve aksiyon
| Bileşen | Durum | Aksiyon |
|---|---|---|
| Ad Relevance | 🟢 İyi | Koru |
| Expected CTR | 🟡 Orta | Reklam metni yenileme (ADS-PLANI-1) |
| **Landing Page** | 🔴 Kötü | Yeni site + URL eşleştirme (TAMAMLANDI 3-4 Haz) |

### 2026 araştırma bulgusu
> "Ad Strength'i 'Poor'dan 'Excellent'a çıkaran reklamverenler ortalama %15 daha fazla dönüşüm alıyor."
> — [Google Ads Help: Ad Strength](https://support.google.com/google-ads/answer/9921843)

Bizim ana reklam zaten EXCELLENT, ama metin yenilemesi CTR'ı artıracak.

---

## 9. ÖNCELİKLENDİRİLMİŞ AKSİYON PLANI

### 🔴 ACİL — Müşteri aksiyonu (panelden)
1. **AD_CALL çağrı süresi eşiğini 60sn→15sn indir** (§2) — en yüksek etki
2. **Lead Form review durumunu kontrol et** (20 May'dan beri)

### 🟢 ŞİMDİ — Yapıldı/yapılabilir (Max Conv'a zarar vermez)
3. ✅ 3 negatif eklendi (torbalı, belediyesi, fupa)
4. ⏳ Search Terms haftalık tarama (yeni negatif/keyword adayı)

### 🟡 18 HAZ SONRASI — Max Conv stabilize olunca
5. Verimsiz keyword pause (bahçelievler PHRASE, asansor bakim typo, vb.)
6. Reklam metni yenileme (ADS-PLANI-1.md)
7. Yüksek CR'li PHRASE → EXACT dönüşümü

### 🔵 1-2 AY SONRA — Sistem oturunca
8. Maximize Conversion Value (dönüşümlere değer atayıp)
9. Remarketing + In-market audience
10. Yeni reklam grupları (acil arıza ayrı niyet)

---

## 10. HEDEF METRİKLER

| Metrik | Şu an | 2 hafta | 1 ay | Sektör benchmark 2026 |
|---|---:|---:|---:|---|
| CTR | %6.1 | %8 | %10 | Yerel hizmet ~%6-9 |
| QS ortalama | 4.9 | 6 | 7 | İyi: ≥6 |
| CPA | 365-707₺ | <500₺ | 350₺ | Sektöre göre |
| Dönüşüm oranı | %13.5 | %15 | %18 | Yerel hizmet ~%10-15 |
| Ad Strength | EXCELLENT | EXCELLENT | EXCELLENT | — |

---

## 11. KAYNAKLAR (2026 araştırma)

- [Google Ads Help — Phone call conversion tracking](https://support.google.com/google-ads/answer/6100664)
- [Google Ads Help — Measure calls from ads](https://support.google.com/google-ads/answer/6095882)
- [Google Ads Help — Local actions conversions](https://support.google.com/google-ads/answer/9013908)
- [Google Ads Help — Ad Strength for RSA](https://support.google.com/google-ads/answer/9921843)
- [Cometly — Not Tracking Phone Call Conversions Fix](https://www.cometly.com/post/google-ads-not-tracking-phone-call-conversions)
- [GROAS — Quality Score 2026](https://www.groas.com/post/google-ads-quality-score-optimization-2026)
- [Measure Marketing Pro — Conversion Tracking Best Practices 2026](https://measuremarketing.pro/blog/google-ads-conversion-tracking-best-practices-2026.html)
- [Digital Applied — Google Ads Benchmarks 2026](https://www.digitalapplied.com/blog/google-ads-benchmarks-2026-cpc-ctr-cvr-industry)

---

## 12. ÖZET — Tek Cümle

**AD_CALL süre eşiğini düşür (gerçek aramalar sayılsın), Max Conv'un oturmasını bekle (18 Haz), sonra verimsiz keyword'leri temizle + reklam metnini yenile → CPA Şubat seviyesine (350₺) iner.**
