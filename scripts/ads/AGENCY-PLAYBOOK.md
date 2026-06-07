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

### Aktif dönüşüm tipleri (sayılan)
- WEBPAGE (form gönderimi)
- CLICK_TO_CALL (siteden tıkla-ara butonu)
- LEAD_FORM_SUBMIT (Google Ads lead form — onay bekliyor, 20 May'dan beri)

### KAPALI dönüşüm tipleri (eksik!)
- **AD_CALL (TechSol)** — 19 Mayıs'ta kaldırıldı. Bu **gerçek arama takibinin** tek yolu.
  Müşteri TechSol'u Google Ads müşteri hizmetleri telefon desteği ile kurmuştu.
  **Kritik aksiyon:** 444 4 600 ara, TechSol kurulumunu geri iste.

### Konvansiyon değerleri (önerilmiş, henüz atanmadı)
- LEAD_FORM_SUBMIT: 250₺
- AD_CALL: 200₺
- CLICK_TO_CALL: 100₺
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
- [ ] **TechSol kurulumu geri istenecek** (444 4 600)
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

---

## 13. CPA Düşürme Planı (1 Haziran 2026 — aktif hedef)

### Ana hedef
Asıl sorun **CTR çöküşü → QS düşüşü → CPC artışı → CPA artışı** zinciri.
Müşterinin net talebi: "ucuzlatmak." Hedef: CPA'yı tekrar 300-400₺ bandına çekmek.

### Aylık TAM tablo (2026) — CTR ve dönüşüm oranı dahil
| Ay | Gösterim | Tık | CTR | Maliyet | Dönş | Dönş.Oranı | CPA |
|---|---:|---:|---:|---:|---:|---:|---:|
| Ocak | 4.539 | 383 | 8.4% | 7.050₺ | 13 | 3.4% | 542₺ |
| Şubat | 2.694 | 323 | **12.0%** | 6.342₺ | 27 | 8.4% | **235₺** (en iyi) |
| Mart | 2.686 | 229 | 8.5% | 13.198₺ | 33 | **14.4%** | 400₺ |
| Nisan | 1.974 | 194 | 9.8% | 16.275₺ | 28 | **14.4%** | 581₺ |
| Mayıs | 5.048 | 284 | **5.6%** | 24.762₺ | 35 | 12.3% | **707₺** (en kötü) |

**DÜZELTİLMİŞ tespit (önceki "dönüşüm stabil, sadece CPA" özeti EKSİKTİ):**
- Dönüşüm SAYISI stabil (27-35) AMA asıl sinyal CTR ve dönüşüm oranında.
- **CTR Şubat %12 → Mayıs %5.6'ya yarılandı.** Reklam ilgi çekmiyor.
- Mayıs'ta gösterim patladı (5.048) ama tık oranı düştü → çok gösterim/az ilgi.
- Dönüşüm oranı Mart-Nisan zirvesi %14.4 → Mayıs %12.3'e geriledi.
- Sebep: 19 May büyük değişiklikler (yeni reklamlar, {KeyWord}, fragmentasyon) CTR'ı bozdu.
- **CPA artışının kökü: maliyet 4x (6K→24K) + CTR yarılanması → QS↓ → CPC↑.**

**CPA düşürmenin kökü = CTR'ı Şubat seviyesine (%12) geri yükseltmek → QS↑ → CPC↓.**

### Dönüşüm takibi DURUMU (1 Haz itibarıyla — DÜZELTME)
"Dönüşüm yok" paniği abartıydı. 6 kanal AKTİF çalışıyor:
- AD_CALL (2) — call reporting AÇIK, gerçek aramalar sayılıyor ✅
- CLICK_TO_CALL (siteden ara) ✅
- WhatsApp İletişimi ✅
- LEAD_FORM_SUBMIT ✅
- Google Hosted: Directions + Clicks to call (GBP bağlı) ✅
Son 30 gün: 34 dönüşüm. TechSol şart değil — AD_CALL zaten gerçek aramayı yakalıyor.
Eski TechSol action'ları REMOVED ama temel sayım çalışıyor.

### Gün bazlı verim (Mart-Haziran, 90g)
| Gün | Dönüşüm | CPA | Not |
|---|---:|---:|---|
| Çarşamba | 22 | 427₺ | 🥇 En çok + verimli |
| Cuma | 15 | 384₺ | 🥈 En düşük CPA |
| Pazar | 8 | 464₺ | Az hacim, verimli |
| Perşembe | 12 | 519₺ | Dengeli |
| Pazartesi | 16 | 726₺ | Çok tık, pahalı |
| Salı | 14 | 746₺ | Pahalı |
| Cumartesi | 11 | 823₺ | 🔴 En verimsiz |

**Aksiyon (ileride):** Çarşamba/Cuma bid +, Cumartesi bid −. Max Conversions otomatik öğrenir.

### CPA düşürme kaldıraçları (öncelik sırası)
1. **Max Conversions'a dön** — algoritma CPA optimize eder, verimli gün/saat/cihazı öğrenir.
   Takip çalıştığı için ARTIK mümkün. (Müşteri "sonra dönelim" dedi — birkaç gün veri sonrası.)
2. **Yeni site (PR #51 merged)** — QS↑ → CPC↓ → CPA↓. Next.js SSG + bölge sayfaları + schema.
3. **Reklam URL eşleştirme** — bölge keyword'leri → /bolgeler/<ilce> sayfalarına. QS↑.
4. **CPC dalgalanması** — Max Clicks tavansız 60₺↔250₺ savruluyor. Oturmazsa yumuşak cap (150₺).
5. **Aşama 1 creative** — sosyal kanıt (7 yıl, 480+ apartman), path, {KeyWord} temizliği. CTR↑ → QS↑.

### Yapısal değişiklik (29-31 May yapıldı)
- 8 grup → 1 aktif grup ("Aylık Bakım - Genel"). Kanibalizasyon bitti.
- Diğer gruplar PAUSED (Genel Bakım, bölgeseller, Bölgesel Bakım, Firma & Tamir).
- Sebep: 139 keyword'lük Genel grup zaten her bölgeyi kapsıyordu, küçük grupları eziyordu.

### Site/deploy durumu
- asisasansor.com = website/ klasörü, Next.js, **Netlify'a** deploy (Cloudflare DEĞİL — o ayrı, takip programı)
- ⚠️ Netlify production branch yanlış (claude/qs-landing-optimization), main OLMALI.
  Düzeltilmezse main'e merge'ler otomatik yayınlanmaz.
- PR #51 merged (1 Haz) — yeni site main'de, manuel publish ile canlıda.

### Bekleyen müşteri aksiyonları
- Netlify production branch → main (UI'dan)
- (Opsiyonel) Google'ı telefonla ara, eski TechSol detay raporlaması için — ama kritik değil

---

## 14. 3-4 Haziran 2026 — Tamamlanan İşler

### Dönüşüm takibi düzeltmesi (3 Haz)
- "Tıkla ve ara" (CLICK_TO_CALL, id 7605108620) **primary_for_goal=True** yapıldı.
  Önceden ikincildi → gerçek telefon aramaları (14 günde 4 adet) bidding'e dahil değildi.
  Artık 6 dönüşüm eyleminin hepsi birincil. Max Conversions geçişi için önkoşul tamamlandı.
- Panel "Conversions" sütunu sadece birincilleri gösterdiği için müşteri 1 görüyordu;
  all_conversions 8'di. Şimdi düzeldi.

### CPC tavan (3 Haz)
- Max Clicks tavansızken CPC 60₺↔250₺ savruluyordu (4 gün dalgalanma).
- **130₺ CPC tavan** kondu (TARGET_SPEND cpc_bid_ceiling). Strateji değişmedi.
- Amaç: pahalı patlamaları kesmek, bütçeyi güne yaymak, CPA düşürmek.

### Site + URL eşleştirme (3-4 Haz) — TAMAMLANDI
- Netlify production branch claude/qs-landing-optimization → **main** yapıldı (müşteri UI'dan).
- Yeni Next.js site (PR #51, d40c058) main'den otomatik yayında. asisasansor.com canlı.
- Bölge sayfaları doğrulandı: /bolgeler/esenyurt kusursuz (H1 keyword'lü, bölgesel
  içerik, tel+WhatsApp, 7yıl/45dk/garanti, SSS, teklif CTA, schema).
- **65 bölgesel keyword** aktif grupta (190360442605) kendi /bolgeler/<ilce> sayfasına
  yönlendirildi (11 bölge: esenyurt, avcilar, beylikduzu, bahcelievler, kucukcekmece,
  zeytinburnu, bagcilar, bakirkoy, gungoren, esenler, buyukcekmece).
- 74 genel keyword ana sayfada kaldı (doğru).

### Beklenen etki (1-2 hafta)
Bölgesel keyword → bölgesel sayfa = post-click QS↑ (önceden 29/43 BELOW_AVERAGE idi).
QS 3-5 → 6-7 hedefi. QS↑ → CPC↓ → CPA↓.

### Hâlâ sırada
- Max Conversions geçişi (birkaç gün 130₺ tavanlı stabil veri sonrası)
- QS bileşenlerini tekrar ölç (1-2 hafta sonra, landing etkisi otursun)
- Netlify branch deploys "None" (opsiyonel, gürültü temizliği)

### Güncel ayarlar (4 Haz itibarıyla)
- Kampanya: ENABLED, Max Clicks (TARGET_SPEND), CPC tavan 130₺, bütçe 1.700₺
- Tek aktif grup: Aylık Bakım - Genel (139 kw), diğerleri PAUSED
- 6 dönüşüm eylemi, hepsi birincil

---

## 15. Bölge Performansı (son 30g — 4 Haz itibarıyla)

12 hedef ilçe (İstanbul Avrupa Yakası). Gerçek performans:

| Bölge | Gös | Tık | Maliyet | Dönş | CPA | Not |
|---|---:|---:|---:|---:|---:|---|
| Esenyurt | 1120 | 81 | 7.583₺ | 12 | 632₺ | 🥇 Ana pazar |
| Zeytinburnu | 457 | 33 | 2.705₺ | 5 | 541₺ | Dengeli (+%10 teklif) |
| Küçükçekmece | 406 | 30 | 3.180₺ | 4 | 795₺ | +%15 teklif ama pahalı |
| Beylikdüzü | 777 | 29 | 2.823₺ | 3 | 941₺ | |
| Bağcılar | 107 | 8 | 716₺ | 3 | **239₺** | 🏆 En verimli! |
| Bahçelievler | 1129 | 37 | 3.848₺ | 2 | **1.924₺** | ⚠️ Çok pahalı, +%10 hak etmiyor |
| Bakırköy | 246 | 9 | 773₺ | 2 | 387₺ | |
| Yeşilköy | 122 | 5 | 356₺ | 1 | 356₺ | Mahalle (dar) |
| Büyükçekmece | 56 | 6 | 562₺ | 1 | 562₺ | Yeni eklendi (22 May) |
| Avcılar | 126 | 12 | 904₺ | 0 | — | Mahalle (dar), 0 dönüşüm |
| Güngören | 37 | 3 | 446₺ | 0 | — | Neredeyse ölü |
| Esenler | 20 | 1 | 87₺ | 0 | — | Neredeyse ölü |

**Teklif ayarı tutarsızlığı:** Küçükçekmece +%15, Bahçelievler +%10, Zeytinburnu +%10
alıyor. Ama en verimliler (Bağcılar 239₺, Zeytinburnu 541₺) ile pahalılar (Bahçelievler
1.924₺) karışık. Max Conversions'a geçince algoritma bunu otomatik düzeltir — elle dokunma.

**Avcılar & Yeşilköy "Neighborhood" tipinde** (İlçe değil) → dar kapsam. Google'da
Avcılar district kaydı yok, neighborhood zaten tüm ilçeyi kapsıyor (reach 813K), sorun değil.

Müşteri kararı (4 Haz): Bilgi olarak kalsın, bölge bazlı aksiyon alınmadı.

---

## 16. 7 Haziran 2026 — Max Conversions'a Geçiş

### Karar
TARGET_SPEND (Max Clicks, 130TL tavan) → **MAXIMIZE_CONVERSIONS** (sınırsız target CPA)
Tarih: 7 Haziran 2026, akşam.

### Tetikleyici doğrulama
Müşteri 2 gerçek arama aldığını teyit etti (13:00 ve 17:36).
"Tıkla ve ara" dönüşümlerinin gerçek aramalarla eşleştiği doğrulandı.

### Veri yeterliliği (son 30g)
- Birincil dönüşüm: 26 (min eşik 15, optimum 30, stabil 50)
- Tüm dönüşüm: 33
- Sınırda ama yeterli. Hafta başı (Pzt) öncesi geçiş için iyi zaman.

### Beklentiler
- 5-7 gün öğrenme, CPC ve hacim dalgalı.
- CPC tavanı (130TL) artık geçersiz.
- Algoritma "kim arar" optimizasyonu yapar:
  - Saat: 10:00-16:00 altın pencere
  - Bölge: Esenyurt > Bağcılar (CPA 239TL) > Zeytinburnu
  - Gün: Çarşamba > Cuma > Cumartesi en kötü

### İzleme
- Müşteriden günlük teyit (gerçek arama geldi mi)
- 7 gün sonra CPA / dönüşüm karşılaştırması (Max Clicks dönemi vs Max Conv dönemi)
- Kötü giderse 2 hafta sonra geri Max Clicks'e dön

### Hâlâ açık
- "Local actions - Directions" birincil — gelecekte ikincil yapılabilir (panelden, API izin vermiyor)
- WhatsApp dönüşümlerinin gerçek mesaj oranı bilinmiyor
- AD_CALL (reklamdan direkt arama) hâlâ 0 — uzantı görünüyor ama ölçüm gelmiyor
