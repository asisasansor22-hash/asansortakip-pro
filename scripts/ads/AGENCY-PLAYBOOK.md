# Asis Asansör — Google Ads Agency Playbook

> Bu dosya hesabın bağlamını, geçmişini, yol haritasını ve metodolojisini içerir.
> Her yeni Claude session'ı önce bunu okumalı. Sıfırdan kontekst kurmaya gerek kalmaz.

---

## 1. Müşteri ve İşletme Bağlamı

- **Firma:** Asis Asansör (İstanbul)
- **Hizmet:** Asansör aylık bakım, onarım, revizyon, tamir
- **Tecrübe:** 7 yıl
- **Portföy:** 480+ apartman
- **Sertifika:** TS EN 81-20
- **WhatsApp:** 0 543 507 07 94
- **Web:** asisasansor.com
- **İletişim sayfası:** /iletisim
- **Hizmet bölgeleri:** Yeşilköy, Beylikdüzü, Esenyurt, Küçükçekmece, Güngören, Bahçelievler, Bakırköy, Bağcılar, Zeytinburnu, Avcılar, Esenler
- **Ofis konumu:** Yenibosna civarı (ana operasyon merkezi)

## 2. Hesap Bilgileri

- **Customer ID:** 7840558523
- **Kampanya:** Asansör- Aylık Bakım (id: 23493351493)
- **Günlük bütçe:** 1.700₺
- **Bidding strategy (mevcut):** Maximize Clicks (TARGET_SPEND), max CPC 100₺
- **Bidding strategy (hedef):** Maximize Conversions (TechSol gelince)

## 3. Müşterinin Hedefleri

1. **Quality Score'u 3-4 bandından 7-9 bandına çıkarmak** (uzun vadeli)
2. **Dönüşüm başı maliyeti düşürmek** (Nisan'da 581₺ idi)
3. **Aynı bütçeyle daha fazla dönüşüm almak**
4. **Gerçek telefon aramalarını artırmak** (en değerli dönüşüm türü)

## 4. Dönüşüm Takibi

### Aktif dönüşüm tipleri — 6 adet, tümü BİRİNCİL (5 Haz 2026 itibarıyla)

| # | Dönüşüm Adı | Tür | Açıklama | Değer |
|---|---|---|---|---|
| 1 | Tıkla ve ara | CLICK_TO_CALL | Siteden telefon butonuna basınca — **en çok çalışan (%80)** | — |
| 2 | WhatsApp İletişimi | WEBPAGE | Siteden WhatsApp butonuna tıklayınca | — |
| 3 | Reklamlardan sesli arama | AD_CALL | Reklamdaki numaradan direkt arama (Google native, TechSol değil) | — |
| 4 | Potansiyel müşteri formu | LEAD_FORM_SUBMIT | Reklamdaki Google formu | — |
| 5 | Clicks to call | GOOGLE_HOSTED | Google Harita / İşletme Profili'nden arama | — |
| 6 | Local - Directions | GOOGLE_HOSTED | Google Harita'da "yol tarifi" al | — |

### ⚠️ Önemli uyarı: 6'sı da "birincil"
Tümü birincil olduğunda algoritma **yol tarifini** de gerçek müşteri adayıyla aynı ağırlıkta sayar.
Directions (yol tarifi) düşük niyet sinyali — CPA hesaplamalarını ve bidding kararlarını kirletir.
**Önerilecek aksiyon (ileride):** Directions → ikincil (secondary) yap; telefon + form birincil kalsın.

### TechSol durumu
- TechSol 5 Haziran 2026'da kalıcı iptal edildi (müşteri kararı)
- AD_CALL (#3) TechSol üzerinden değil, Google'ın native call asset mekanizmasıyla çalışıyor
- Önceki "0 dönüşüm" dönemlerinde AD_CALL takibi eksikti; artık aktif

### Konvansiyon değerleri (önerilmiş, henüz atanmadı)
- CLICK_TO_CALL: 200₺ (en değerli — %80 hacim)
- AD_CALL: 200₺
- LEAD_FORM_SUBMIT: 150₺
- WhatsApp: 100₺
- GOOGLE_HOSTED calls: 150₺
- GOOGLE_HOSTED directions: 30₺ (düşük niyet)
- Toplam atanınca → **Maximize Conversion Value** stratejisine geçilebilir.

## 5. Yapısal Durum Snapshot (21 Mayıs 2026)

### Aktif reklam grupları (7 grup)

| Grup | Reklam | Strength | 30g Imp | 30g Cost | QS Ort |
|---|---|---|---:|---:|---:|
| Aylık Bakım - Genel | 1 aktif | GOOD | 284 | 941₺ | 4.8 |
| Genel Bakım | 1 aktif | AVERAGE | 203 | 1762₺ | 3.0 |
| Firma & Tamir (PAUSED grup) | 1 aktif | GOOD | 149 | 1446₺ | 3.0 |
| Bölgesel Bakım | 1 aktif | AVERAGE | 20 | 0₺ | — |
| Aylık Bakım - Bölgesel | 0 aktif ⚠️ | — | 0 | 0₺ | 5.0 |
| Aylık Bakım - Esenyurt | 1 aktif (yeni açıldı) | EXCELLENT | 6 | 0₺ | — |
| Aylık Bakım - Avcılar | 1 aktif (yeni açıldı) | EXCELLENT | 2 | 0₺ | — |
| Aylık Bakım - Beylikdüzü | 1 aktif (yeni açıldı) | EXCELLENT | 2 | 0₺ | — |

### Bilinen yapısal sorunlar
- **Tüm reklamlarda path1/path2 boş** (//) → Aşama 1'de doldurulacak
- **4 reklamda {KeyWord:...} şablonu var** → Aşama 1'de kaldırılacak
- **"Aylık Bakım - Bölgesel" grubunda aktif reklam yok** (1 pasif var)
- **Genel Bakım ve Firma & Tamir QS=3** → landing page ve creative iyileştirme şart
- **10 grup fragmente** → algoritma her grupta yeterli sinyal alamıyor

## 6. Geçmiş Olaylar Kronolojisi

| Tarih | Olay |
|---|---|
| Nisan | İyi performans: günde ~1.5 dönüşüm, CPA 581₺, TechSol açık |
| 14-16 May | Eski yapı, 4 dönüşüm/3 gün |
| 17 May | Düşük gün (öğrenme) |
| 18 May | 1 dönüşüm |
| **19 May 16:40-16:43** | **Büyük değişiklik:** 19 URL değişti, 3 yeni reklam, 30+ keyword düzenleme, negatifler eklendi, geo daraltıldı |
| 19 May (tarih net değil) | **TechSol kaldırıldı** (önceki Claude session'ı yanlışlıkla kaldırmış) |
| 5 Haz 2026 | **TechSol kalıcı iptal** (müşteri kararı) — AD_CALL takibi sonlandı |
| 19-21 May | 0 dönüşüm/gün (takip kopuk) |
| 21 May 19:00 | Bidding strategy: Max Conversions → **Max Clicks (max CPC 100₺)** geçişi |
| 21 May 19:30 | 3 bölgesel grup (Esenyurt/Avcılar/Beylikdüzü) aktif edildi |

## 7. Yol Haritası

### ✅ Tamamlananlar
- [x] Negatif keyword listesi genişletildi (rakip firmalar, kalitesiz aramalar)
- [x] "en iyi", "en kaliteli" negatiften çıkarıldı (müşteri kararı)
- [x] Bazı yüksek hacimli keyword'ler EXACT yapıldı
- [x] Geo targeting daraltıldı (uzak bölgeler temizlendi)
- [x] Yüksek-QS keyword'lerin türevleri eklendi
- [x] Asset extension temizliği (5 sitelink, 3 callout silindi; 3 yeni callout eklendi)
- [x] Bidding: Max Conversions → Max Clicks (geçici, 21 May)
- [x] Bölgesel ad gruplar aktif edildi (21 May)
- [x] Routine kurulumu (her sabah 09:00 GitHub issue + email)

### 🟡 Bekleyenler — müşteri aksiyonu gerekli
- [x] ~~TechSol kurulumu geri istenecek~~ — **iptal edildi (5 Haz)**; alternatif arama takibi çözümü değerlendirilecek
- [ ] **Lead Form review** durumu kontrol edilecek (20 May'dan beri)
- [ ] **Google Business Profile** Location extension için bağlanmalı
- [ ] **Conversion value** atamaları (250/200/100₺)
- [ ] Site içerik geliştirmeleri (LocalBusiness schema, bölgeler sayfası, fiyat bilgisi)

### 🔵 Aşama 1 — 26 Mayıs (planlı)
**Hedef:** QS 3-4 → 5-6, CPC 94→80₺, CPA 1498→1200₺

Müdahale alanı: **reklam asset'leri**
1. URL düzeltme & www tutarlılığı
2. Path1/Path2 doldurma
3. `{KeyWord:...}` şablonunun kaldırılması

Detay: `scripts/ads/OPTIMIZATION-PLAN-AŞAMA1.md`

### 🔵 Aşama 2 — Haziran başı (planlanacak)
**Hedef:** Reklam metni yenileme
- Her gruba özel başlık/açıklama
- Asset performance verilerine göre düşük performanslı assetleri at
- 1 grup başına 2 RSA (A/B test)
- Pinning stratejisi (1-2 başlık brand'e, gerisi serbest)

### 🔵 Aşama 3 — Haziran ortası (landing page)
**Hedef:** Post-click QS BELOW_AVERAGE → AVERAGE+
- LocalBusiness JSON-LD schema
- Bölgesel landing page'ler (asisasansor.com/bolgeler/...)
- Sayfa hızı (PageSpeed Insights 70+)
- İçerik genişletme (keyword'lerle uyumlu)
- WhatsApp butonu visible
- Form simplification

### 🔵 Aşama 4 — Audience & strateji
- In-market audience layer
- Remarketing kampanyası
- Customer Match listesi
- Maximize Conversion Value geçişi (değer atamaları sonrası)

## 8. Ajans Metodolojisi — Karar Kuralları

### Anomali tanımı (yanlış alarm vermemek için)
- **Tek tıklı keyword'leri anomali sayma** — en az 10 tık veya 30 günlük veri
- **2x bütçe aşımı NORMAL** (Max Conv/Max Clicks 2x esnek harcama yapar)
- **0 dönüşüm günleri** — TechSol kapalıyken takip kopuk, landing page suçu değil
- **CPC ortalaması max CPC'nin %20'sine kadar üstünde olabilir** (Google auction toleransı)

### Aksiyon eşikleri
- **Keyword pause:** ≥10 tık, 0 dönüşüm, CPC hesap ortalamasının 1.5x'i
- **Keyword bid azaltma:** ≥20 tık, dönüşüm var ama CPA hesap ortalamasının 2x'i
- **Yeni keyword ekleme:** Search Terms'te ≥5 dönüşüm gelen yeni terim
- **Negatif ekleme:** ≥20 gösterim, 0 dönüşüm, ilgisiz arama (manuel review)

### Sıralama prensibi
1. **Önce takip** (TechSol) — ölçemediğini optimize edemezsin
2. **Sonra yapı** (grup/keyword düzeni, fragmentation azaltma)
3. **Sonra creative** (RSA başlık/açıklama/path)
4. **En son landing page** (en uzun süreli, en yüksek etki)

### Bekleme süreleri
- Bidding strategy değişikliği: **5-7 gün** öğrenme bekle
- Yeni RSA: **3-5 gün** mini öğrenme
- Negatif ekleme: **2-3 gün** etkinin yerleşmesi
- Bütçe değişikliği: **1-2 gün** algoritmanın adapte olması

## 9. Sabah Raporu Bağlamı

Routine her sabah 09:00 Europe/Istanbul'da çalışır, GitHub issue açar.
Routine prompt'unda şu bağlam HER ZAMAN olmalı:

```
- Bidding: Maximize Clicks, max CPC 100₺ (geçici, TechSol bekleniyor)
- TechSol 19 May'dan beri kapalı → dönüşüm sayıları eksik
- 2x bütçe aşımları normal (Max Clicks esnekliği)
- Tek tıklı keyword'ler anomali değil (≥10 tık eşiği)
- Aşama 1 planı: 26 May (scripts/ads/OPTIMIZATION-PLAN-AŞAMA1.md)
- Mutate (set_budget/pause/status) YASAK — sadece rapor
```

## 10. Audit Listesi (haftalık yapılacak analizler)

1. **Search Terms Report** — yeni negatif/keyword fırsatları
2. **Auction Insights** — rekabet durumu (kim ne yapıyor)
3. **Cihaz dağılımı** — mobil/desktop bid adjustment
4. **Saat/gün dağılımı** — ad schedule bid adjustment
5. **Asset performance** — RSA başlık/açıklama hangileri çalışıyor
6. **Quality Score değişimi** — hangi keyword'ler iyileşti/kötüleşti
7. **Conversion lag** — dönüşümlerin geç gelme oranı
8. **IS trendi** — gösterim payı zaman içinde nasıl değişiyor

## 11. Tool ve CLI

- **CLI:** `/tmp/gads/ads.py` (SessionStart hook ile her session başında provisioned)
- **Komutlar:** `campaigns`, `keywords`, `set_budget`, `pause`, `enable`
- **Mutate operasyonları:** açıkça onay alınmadan yapılmaz
- **Daha karmaşık sorgular:** `/tmp/q.py` veya `/tmp/m.py` adhoc scriptler ile

## 12. İletişim Stili

Müşteri pratik, hızlı kararlar veriyor. Tercih:
- Önce karar, sonra detay
- Tablo > paragraf
- Türkçe, samimi ama profesyonel ton
- Aşırı uyarı/disclaimer yok — net görüş
- Karar veremediğin yerde 2-3 seçenek sun, önerini söyle
