# Google Ads — Pratik Referans

> Bu hesabı yöneten herkes (Claude veya insan) için Google Ads konseptlerinin
> özet referansı. Asis Asansör senaryosuyla örneklenmiştir.

---

## 1. Quality Score (Kalite Skoru)

### Tanım
Her keyword için 1-10 arası puan. 3 bileşenden oluşur:

| Bileşen | Türkçe | Etkisi |
|---|---|---|
| `searchPredictedCtr` | Beklenen tıklama oranı | Keyword + reklam ilgisi |
| `creativeQualityScore` | Reklam alaka düzeyi | RSA başlık/açıklama keyword'le uyumu |
| `postClickQualityScore` | Açılış sayfası deneyimi | Landing page kalitesi |

Her bileşen: BELOW_AVERAGE / AVERAGE / ABOVE_AVERAGE.

### QS neden önemli?
- **Ad Rank = Bid × QS** → düşük QS demek yüksek CPC
- QS=10 ile QS=5 arasında CPC farkı **2-3x'e** kadar çıkabilir
- QS=1-3 olan keyword'ler genelde gösterim bile alamaz

### QS iyileştirme stratejisi
1. **Search Predicted CTR** → Daha alakalı RSA başlıkları, EXACT match'e geçiş
2. **Creative Quality** → Keyword'ü başlığa koy (örn. "Esenyurt Asansör Bakım")
3. **Post-Click** → Landing page keyword'le uyumlu, hızlı, mobil-uyumlu, açık CTA

## 2. Bidding Strategies

| Strateji | Ne yapar | Ne zaman kullan |
|---|---|---|
| **Manual CPC** | Sen teklif verirsin | Çok az veri varsa, tam kontrol gerekiyorsa |
| **Enhanced CPC** | Manual + Google ±%30 oynar | Dönüşüm var ama hacim az |
| **Maximize Clicks (TARGET_SPEND)** | Bütçe içinde max tık | Trafik gerek, dönüşüm takibi yok/bozuk |
| **Maximize Conversions** | Bütçe içinde max dönüşüm | Dönüşüm takibi sağlam, ≥30 dönüşüm/ay |
| **Target CPA** | Belirli CPA'da max dönüşüm | ≥50 dönüşüm/ay, CPA biliniyor |
| **Maximize Conversion Value** | Toplam değeri maksimize | Dönüşüm tiplerine farklı değer atadıysan |
| **Target ROAS** | Belirli getiri oranında çalış | E-ticaret tipik; hizmet için uygun değil |

### Strateji geçişleri ve öğrenme süresi
- Her geçiş **5-7 gün öğrenme** dönemini tetikler
- Öğrenme sırasında performans dalgalanır, müdahale etme
- Sık değiştirme = sürekli öğrenme = sürekli kötü performans

## 3. Match Types (Eşleme Türleri)

| Tür | Notasyon | Örnek arama eşleşmesi |
|---|---|---|
| **Broad** | asansör bakım | "asansör bakım", "asansör tamiri", "lift servisi", "elevator", "bina yönetimi" |
| **Phrase** | "asansör bakım" | "asansör bakım fiyatı", "esenyurt asansör bakım" — sırayla geçmeli |
| **Exact** | [asansör bakım] | sadece "asansör bakım" ve çok yakın varyantları |

### Negatif keyword'ler
- **Broad negative:** `asansör fabrikası` → "asansör" geçen TÜM aramaları engellemez, sadece tam ifadeyi içerenleri
- **Phrase negative:** `"asansör fabrikası"` → sırayla geçenleri engeller
- **Exact negative:** `[asansör fabrikası]` → sadece tam aramayı engeller

> **Önemli:** Negatif keyword'lerde Broad farklı çalışır — pozitif keyword Broad gibi tüm varyantları engellemez. Negatif olarak Phrase veya Exact daha tahmin edilebilir.

## 4. Responsive Search Ads (RSA)

### Limitler
- **15 başlık** (en az 3, 30 karakter limit)
- **4 açıklama** (en az 2, 90 karakter limit)
- **2 path** (15 karakter limit her biri)
- **1 final URL**

### RSA değiştirilemez
Bir RSA oluşturulunca **path, headline, description değiştirilemez** — yeni RSA yarat, eskiyi pause.
- Yeni RSA = mini öğrenme dönemi (3-5 gün)
- Eski RSA performans geçmişi korunur
- Yeni RSA için QS sıfırdan başlar

### Pinning
- Başlık/açıklama belirli pozisyona sabitlenebilir
- Ör: Brand adını her zaman 1. başlık olarak göstermek
- **Çok sabitleme = düşük Ad Strength** (Google çeşitlilik ister)
- Kural: En fazla 2-3 asset pin'le, gerisi serbest

### Ad Strength
- POOR / AVERAGE / GOOD / EXCELLENT
- EXCELLENT olmak için: 11+ başlık, 4 açıklama, az pinning, keyword'lerin başlıkta geçmesi
- **Düşük Ad Strength = daha az gösterim**

## 5. Asset Extensions (Eskiden "Ad Extensions")

| Tip | Açıklama | Tipik kullanım |
|---|---|---|
| **Sitelink** | Alt linkler (örn. "Hakkımızda", "Bölgeler") | 4-6 adet, açıklamalı |
| **Callout** | Kısa avantaj cümleleri ("7/24 Hizmet") | 6-10 adet |
| **Structured Snippet** | Kategori listesi ("Hizmetler: Bakım, Onarım, ...") | 1-2 tip |
| **Call** | Telefon numarası direkt | Mobil için kritik |
| **Location** | Google Business Profile bağlantısı | Yerel arama için zorunlu |
| **Lead Form** | Reklamda form (Google'da kalır) | Form review onayı gerek |
| **Image** | Reklamda görsel | RSA üstünde görünür |
| **Price** | Hizmet/ürün fiyatları | Hizmette nadir |
| **Promotion** | Kampanya/indirim | Sezonsal |

### Asset performance terimleri
- **Best/Good/Low/Learning** — Google asset'i diğerleriyle karşılaştırır
- **Low** olan asset'ler değiştirilmeli
- **Learning** = yeterli veri yok, bekle

## 6. Impression Share (IS)

| Metrik | Açıklama |
|---|---|
| `search_impression_share` | Aldığın gösterim / alabileceğin toplam |
| `search_budget_lost_is` | Bütçe yetmediği için kaçırılan IS |
| `search_rank_lost_is` | Ad Rank düşük olduğu için kaçırılan IS |
| `search_top_is` | İlk 4 sırada görünme oranı |
| `search_absolute_top_is` | 1. sırada görünme oranı |

### Karar kuralları
- **IS < %50:** Hacim sorunu var, bütçe veya bid artır
- **IS %50-80:** Sağlıklı orta yer
- **IS > %80:** Doymuş, daha fazla bütçe atma — verim düşer
- **Budget lost > %10:** Bütçeyi artırmayı düşün
- **Rank lost > %20:** Bid veya QS artırma odaklan

## 7. Search Terms Report

**Reklamın gerçekte hangi aramalarda göründüğünü** gösterir. Keyword'lerin tetiklediği gerçek aramalar.

### Ne aranır
1. **Para harcanan ama dönüşmeyen aramalar** → negatif aday
2. **Beklenmedik dönüşen aramalar** → yeni keyword aday
3. **Yanlış match (broad'tan gelen alakasız)** → match type sıkılaştır
4. **Marka karması** (rakip markası tetikleniyorsa) → negatif marka

### Eylem eşiği
- ≥10 tık + 0 dönüşüm → negatif eklemeyi düşün (manuel review şart)
- ≥3 dönüşüm + iyi CTR → keyword olarak ekle

## 8. Auction Insights

Rekabet raporu — kimlerle aynı arama için yarışıyorsun.

### Metrikler
- **Impression Share:** Rakibin senle aynı sayfada görünme oranı
- **Overlap Rate:** Aynı anda gösterim alma oranı
- **Position Above Rate:** Senin üstünde olma oranı
- **Top of Page Rate:** Sayfanın üstünde olma oranı
- **Outranking Share:** Senin üstünde kalma oranı

### Karar kuralları
- Outranking share azalıyorsa → bid veya QS artır
- Yeni rakipler giriyorsa → strateji gözden geçir
- Sürekli üstünde kalan rakip → onun aldığı arama terimlerini incele (Search Terms ile)

## 9. Bid Adjustments

Belirli boyutlarda teklifin yüzdesel ayarı:

| Boyut | Tipik kullanım |
|---|---|
| **Device** | Mobil dönüşüm oranı yüksekse mobil +%20 |
| **Location** | En değerli bölgeye +%10-30 |
| **Audience** | In-market'a +%15, remarketing'e +%20 |
| **Ad schedule** | Yoğun saatlere +%10, gece -%20 |
| **Demographics** | (Arama için sınırlı veri) |

> Smart bidding (Max Conv, Target CPA) kullanıyorsan device/audience adjustment Google tarafından otomatik yapılır, manuel kapanmalı. **Sadece ad schedule ve location** manuel kontrol edilebilir.

## 10. Conversion Tracking Tipleri

| Tip | Nereden | Asis Asansör durumu |
|---|---|---|
| **WEBPAGE** | GTag site tarafında | ✅ Aktif (form gönderimi) |
| **CLICK_TO_CALL** | Site içi "tıkla-ara" butonu | ✅ Aktif |
| **AD_CALL** | Google forward number (TechSol) | ❌ **Kapalı (kritik!)** |
| **LEAD_FORM_SUBMIT** | Reklamdaki Google form | 🟡 Review'da |
| **IMPORT** | Offline (CRM'den) | Şu an yok |
| **SMART** | Google otomatik atama | Önerilmez |

### TechSol (forward number) ne işe yarar?
- Google sana bir geçici numara verir
- Reklamda o numara gösterilir, sen yine eski numarana yönlendirirsin
- Bu sayede **gerçek aramaları Google ölçer**
- Aramayı kim yaptı, ne kadar konuştu, hangi keyword'den geldi — hepsi takip edilir
- AD_CALL dönüşümü bu mekanizmadan gelir

## 11. Önemli GAQL (Google Ads Query Language) Örnekleri

### Son 7 gün kampanya performansı
```sql
SELECT campaign.name, metrics.clicks, metrics.cost_micros, metrics.conversions
FROM campaign
WHERE segments.date DURING LAST_7_DAYS
AND campaign.status != 'REMOVED'
```

### Cihaz dağılımı
```sql
SELECT segments.device, metrics.clicks, metrics.conversions, metrics.cost_micros
FROM campaign
WHERE segments.date DURING LAST_30_DAYS
AND campaign.id = 23493351493
```

### Saatlik dağılım
```sql
SELECT segments.hour, metrics.clicks, metrics.conversions
FROM campaign
WHERE segments.date DURING LAST_30_DAYS
```

### Search terms
```sql
SELECT search_term_view.search_term, metrics.clicks, metrics.cost_micros,
       metrics.conversions
FROM search_term_view
WHERE segments.date DURING LAST_30_DAYS
ORDER BY metrics.cost_micros DESC
LIMIT 50
```

### Quality Score per keyword
```sql
SELECT ad_group_criterion.keyword.text,
       ad_group_criterion.quality_info.quality_score,
       ad_group_criterion.quality_info.creative_quality_score,
       ad_group_criterion.quality_info.post_click_quality_score,
       ad_group_criterion.quality_info.search_predicted_ctr
FROM keyword_view
WHERE ad_group_criterion.status = 'ENABLED'
```

## 12. Yaygın Yanlışlar (Bu hesapta gözlenenler)

1. **{KeyWord:...} aşırı kullanımı** — Spam gibi görünür, dynamic keyword insertion CTR'ı düşürür
2. **Path1/Path2 boş bırakmak** — Görünür URL daha az ikna edici
3. **www tutarsızlığı** — Bazı URL'ler `www.x.com`, bazıları `x.com` → QS düşer
4. **Çok fragmente ad group yapısı** — Her grubun kendi öğrenmesi var, az veriyle hepsi başarısız
5. **TechSol gibi takip kurulumlarını silmek** — Optimization signal kaybedilir
6. **Sık bidding strategy değişimi** — Sürekli öğrenme döngüsünde kalmak
7. **Bütçesi az kampanyada Max Conversions** — Az veriyle algoritma öğrenemez
8. **Negatif keyword'leri Broad eklemek** — Beklenmedik aramaları engelleyebilir; Phrase/Exact tercih

## 13. Pratik Eşikler

| Metrik | Hesap için iyi |
|---|---|
| CTR (arama) | ≥%5 |
| CTR (yerel arama) | ≥%8 |
| Average CPC | Hizmet sektörü ortalamasının altı (asansör için ~70-90₺) |
| Quality Score | ≥6 |
| Impression Share | %60-85 |
| Conversion Rate | ≥%5 (form), ≥%10 (arama dahil) |
| CPA | Müşteri yaşam boyu değerinin %20-30'u |

## 14. Hesabın Karakteri (Asis için özel notlar)

- **Sektör:** Asansör bakım/onarım → B2B (apartman yönetimleri) + B2C (acil onarım)
- **Müşteri yolculuğu:** Çoğu **gerçek telefon araması** ile sonuçlanır, form ikincil
- **Sezonsallık:** Yaz aylarında acil arıza artışı, kış stabil
- **Coğrafya:** Avrupa yakası Bakırköy-Esenyurt hattı odak
- **Rekabet:** Yerel firmalar + büyük markalar (Otis, Kone, Schindler dolaylı)
- **Müşteri profili:** Bina yöneticileri (45-65 yaş, mobil ağırlıklı), acil arıza için ev sahipleri
- **Karar süresi:** Bakım sözleşmesi haftalar, acil onarım dakikalar
