# Dolaylı hacim: hangi hareket hangi kasa ne kadar sayılır?

Bu belge, uygulamanın hacim hesabındaki her katsayının **neden o değer olduğunu**
kaynağıyla birlikte yazar. Kanıtı olmayan yerlerde "tahmin" diye açıkça işaretlidir —
sessizce sayı uydurulmaz.

Kodda karşılığı: `src/data/muscles.js`.

---

## 1. Neden dolaylı çalışma sayılır?

Üç yöntem mümkün: dolaylı seti **1** saymak (`total`), **0,5** saymak (`fractional`),
ya da **0** saymak (`direct`).

**Pelland ve ark., *Sports Medicine* 2026;56(2):481-505** — 67 çalışma, 2058 katılımcı.
Üç yöntemi karşılaştırdılar; kas gelişimini en iyi açıklayan **0,5** oldu. Doğrudan ile
dolaylıyı ayırmak sonuçları öngörebilmek için *gerekli*.

Ölçülmüş doğrudan kanıt: **Mannarino ve ark. 2019 (JSCR)** — aynı kişide bir kol
dumbbell kürek, öbür kol dumbbell curl, hacim eşitlenmiş, 8 hafta. Dirsek fleksör
kalınlığı: curl **+%11,06**, kürek **+%5,16**. Kürek gerçekten curl'ün ~yarısı kadar.

**Ama "her yardımcı kas sayılır" demek değil.** Sınır şurada:

| Sayılır | Sayılmaz |
|---|---|
| Kas hareketin **kuvvet üreticilerinden** biri (bench press'te triceps) | Kas yalnızca **sabitliyor** (squat'ta karın) |
| Yük altında **kısalıp uzuyor** | Yalnızca **kavrıyor/tutuyor** (kürekte ön kol) |

Bu yüzden uygulamada **ön kol ve boyun hacim hesabına hiç girmez**: kavrama izometriktir,
yorgunluk yaratır ama hipertrofi uyaranı olarak sayılacak bir şey değildir.

---

## 2. Katsayılar ve dayanakları

### 2.1 Presler → Triceps: **0,5**

**Kanıt güçlü ve nüanslı.** Bench press triceps'i gerçekten büyütür — ama **yarısını**:

- Triceps ekstansiyonu içeren gruplarda triceps gelişimi, yalnız bench yapanların
  **yaklaşık iki katı**.
- Baş bazında ayrıştırıldığında: bench press **yan başı (lateral)** iyi büyütüyor,
  ama **uzun baş bench press ile HİÇ büyümüyor** — yalnızca ekstansiyon hareketiyle büyüyor.

Mekanizma: uzun baş çift eklemlidir (omuz + dirsek). Bench press'te omuz geride/nötr
olduğu için uzun baş zaten kısalmış durumdadır ve kuvvet üretemez.

- **Maeo ve ark. (EJSS)**: baş üstü uzatma vs pushdown, 12 hafta, aynı kişide.
  Uzun baş **+%28,5'e karşı +%19,6** (p<0,001); yan ve orta baş +%14,6'ya karşı +%10,5.

→ 0,5 doğru katsayı, ama **doğrudan set alt sınırı da şart**: kolun "yarısı" hiç
çalışmadan hacim hedefi dolabiliyor.

### 2.2 Çekişler → Biceps: **0,5**

Mannarino (yukarıda): kürek = curl'ün %47'si. Ölçülmüş katsayı.

**Chin-up ve barfiks daha yüksek yükler** (supinasyon + tam ROM), bu yüzden onlara
**0,6** verilir. Bu bir **tahmindir** — chin-up'ı curl'le karşılaştıran doğrudan bir
hipertrofi çalışması bulamadım; kavrama pozisyonunun dirsek fleksörü momentini
artırdığı biyomekanik olarak nettir ama büyüme farkı ölçülmemiştir.

### 2.3 Presler → Ön deltoid: **0,5**

Düz bench press'te göğüs, **ön deltoid** ve triceps birincil hareket ettiricilerdir.
Eğimli preste ön deltoid payı daha yüksektir → eğimli preslere **0,6** verilir (tahmin).

**Yan ve arka deltoid preslerde neredeyse hiç çalışmaz** — bu yüzden presler onlara
**0** katkı yapar. Uygulama omzu üç başa ayırdığı için bu artık ifade edilebiliyor;
eskiden tek "omuz" kovası olduğu için pres, omzun tamamını doldurmuş gibi görünüyordu.

### 2.4 Squat → Hamstring: **0,15** (neredeyse yok)

**Bu, eski modelin en büyük hatasıydı.** Uygulama `bacak` diye tek kova tuttuğu için
20 set squat + leg press "Bacak 20 · ideal" gösteriyordu — hamstring hiç çalışmadan.

- **Çift bacak squat hamstringde anlamlı hipertrofi ÜRETMEZ.**
- Squat'ta hamstring motor ünite aktivitesi leg curl ve stiff-leg deadlift'in
  yaklaşık **yarısı** kadardır — ve bu EMG'dir, hipertrofi değil.

Mekanizma: squat'ta hamstring hem kalça ekstansiyonu (kısalma) hem diz fleksiyonu
(uzama) görevini aynı anda üstlenir; net boy değişimi çok azdır (Lombard paradoksu).
Uzunluk değişmeyen kas büyümez.

### 2.5 Kalça menteşesi (RDL, deadlift) → Hamstring: **0,7**

Squat'ın tersine menteşe hareketleri hamstringi gerçekten yükler ve RDL bazı
çalışmalarda leg curl'den **daha yüksek** hamstring aktivasyonu gösterir.

Ama **bölgesel fark var**: menteşe kalça-baskın (üst hamstring), leg curl diz-baskın
(alt hamstring). En iyi sonuç ikisini birden yapmakta. Bu yüzden RDL yüksek katsayı
alır ama leg curl'ün yerini **tam** tutmaz (0,7, 1 değil — bu bir tahmindir).

### 2.6 Squat / menteşe → Glute: **1,0 (DOĞRUDAN)**, makine varyantları 0,5

Squat glute'u gerçekten büyütür:

- Hip thrust ve back squat **benzer glute hipertrofisi** üretir (9 hafta).
- Başka bir çalışmada squat grubu glute hipertrofisinde hip thrust grubunu **geçti**;
  ayrıca quad kazancı da vardı.

EMG hip thrust'ı üstün gösterse de "yüksek EMG = yüksek hipertrofi" çıkarımı geçersizdir.

Önce 0,75 (dolaylı) verilmişti; ama o zaman uygulama "squat var, hip thrust yok →
glute eksik" diyordu. Kanıt "benzer hipertrofi" dediğine göre bu **yanlış pozitif**.
Bu yüzden derin, kalça-baskın hareketler (squat, lunge, bulgarian, pistol) ve tüm
kalça menteşeleri (RDL, deadlift, hip thrust, glute bridge) glute için **doğrudan**
sayılır.

Makine ve kısa ROM varyantları (leg press, hack squat) kalça ekstansiyon aralığı
sınırlı olduğu için **0,5** alır — bu bir **tahmindir**.

### 2.7 Squat / Deadlift → Karın (rektus abdominis): **0**

**Eskiden 0,25 verilmişti; kanıt bunu desteklemiyor.**

- Squat sırasında **rektus abdominis aktivitesi düşüktür** — %90 1RM'de bile kayda değer
  bir iş yapmaz.
- Buna karşılık **erektör spina squat'ta plank'tan 4 kat fazla** aktive olur.

Yani squat gövdeyi yükler ama yüklediği kas **bel (erektör spina)**, karın değil.
Uygulama artık erektörü ayrı bir kas grubu olarak tutuyor; squat/deadlift oraya **0,5**
katkı verir, karına **0** verir.

Not: karın için `REGION_MIN = 6` indirimi bu gerekçeyle konmuştu ("bileşiklerde
izometrik yük alır"). Gerekçe hatalı olduğu için **indirim kaldırıldı**; karın da
diğer kaslar gibi 10 set eşiğine tabidir.

### 2.8 Kavrama → Ön kol: **0**

Kürek, deadlift ve barfikste ön kol izometrik kavrama yapar. Bu yorgunluk yaratır ama
kas boyu değişmediği için hipertrofi uyaranı olarak sayılmaz. Uygulama ön kolu hacim
hesabına hiç katmaz.

---

## 3. Uygulanan katsayı tablosu (özet)

Varsayılan: birincil kas **1,0**, ikincil kas **0,5**. Aşağıdakiler bilinçli sapmalardır.

| Hareket sınıfı | Kas | Katsayı | Dayanak |
|---|---|---|---|
| Yatay/eğimli pres | Triceps | 0,5 | Bench-only vs +ekstansiyon: ~2 kat fark; uzun baş büyümüyor |
| Yatay pres | Ön deltoid | 0,5 | Birincil hareket ettirici |
| Eğimli pres | Ön deltoid | 0,6 | Omuz fleksiyon açısı yüksek — **tahmin** |
| Pres (tümü) | Yan / arka deltoid | 0 | Preslerde çalışmaz |
| Kürek / pulldown | Biceps | 0,5 | Mannarino: %47 |
| Chin-up / barfiks | Biceps | 0,6 | Supinasyon + tam ROM — **tahmin** |
| Derin squat / lunge / menteşe | Glute | **1,0 (doğrudan)** | Hip thrust ile benzer glute hipertrofisi |
| Leg press / hack squat | Glute | 0,5 | Kalça ekstansiyon ROM'u sınırlı — **tahmin** |
| Squat türevleri | Hamstring | 0,15 | Anlamlı hipertrofi üretmiyor |
| Squat / deadlift | Erektör (bel) | 0,5 | Plank'ın 4 katı aktivasyon |
| Squat / deadlift | Karın | 0 | Rektus abdominis aktivitesi düşük |
| Menteşe (RDL/deadlift) | Hamstring | 0,7 | Yüksek aktivasyon; ama kalça-baskın — **kısmen tahmin** |
| Squat / menteşe | Baldır | 0 | Ayak bileğini sabitler, boyu değişmez |
| Herhangi | Ön kol / boyun | 0 | Kavrama izometrik, hipertrofi uyaranı değil |

---

## 4. Modelin bilinen sınırları

Bunlar dürüstlük için yazılıdır; "çözülmüş" gibi davranılmaz.

1. **Deltoid başları kaynak veride ayrı değil.** `exerciseMuscles.js` yalnızca "Omuz"
   diyor. Ön/yan/arka ayrımı hareket **tipinden** türetiliyor (pres → ön, yan kaldırış
   → yan, face pull / ters fly → arka). Küratörlü bir eşleme; kenar durumlarda hatalı olabilir.
2. **Bölgesel hipertrofi tam modellenmiyor.** Triceps uzun başı, hamstringin kalça-
   baskın kısmı gibi ayrımlar katsayıya kabaca yansıtıldı ama kas içi bölge ayrı ayrı
   sayılmıyor.
3. **Varyantlar arası ince farklar yok.** Geniş tutuş vs dar tutuş kürek biceps'e farklı
   yükler; model bunu ayırmıyor.
4. **Katsayıların çoğu tek bir çalışmaya dayanıyor.** Bu alanda çoğu eşleşme için
   hipertrofi RCT'si yok; EMG'den hipertrofi çıkarımı yapılamayacağı için EMG yalnızca
   "hiç çalışmıyor / gerçekten çalışıyor" ayrımı için kullanıldı, katsayı belirlemek için değil.

---

## Kaynaklar

- [Pelland ve ark. — The Resistance Training Dose Response, *Sports Medicine* 2026 (67 çalışma)](https://pubmed.ncbi.nlm.nih.gov/41343037/)
- [Mannarino ve ark. — Single-Joint Exercise Results in Higher Hypertrophy of Elbow Flexors Than Multijoint Exercise](https://pubmed.ncbi.nlm.nih.gov/31268995/)
- [Maeo ve ark. — Triceps brachii hypertrophy: overhead vs neutral arm position, *EJSS*](https://www.tandfonline.com/doi/full/10.1080/17461391.2022.2100279)
- [House of Hypertrophy — Is the Bench Press Enough for Triceps Hypertrophy?](https://houseofhypertrophy.com/bench-press-for-triceps/)
- [StrengthLog — Bench press is not enough for maximal triceps growth](https://www.strengthlog.com/bench-press-is-not-enough-for-maximal-triceps-growth/)
- [Plachy ve ark. — Hamstring EMG activity: leg curls vs hip extensions, *PLOS ONE*](https://journals.plos.org/plosone/article?id=10.1371%2Fjournal.pone.0245838)
- [Stronger by Science — Exercise selection for the hamstrings](https://www.strongerbyscience.com/exercise-selection-hamstrings/)
- [Plotkin ve ark. — Hip thrust and back squat elicit similar gluteus hypertrophy](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC10593473/)
- [Sci-Sport — Glutes hypertrophy: hip thrust or parallel squat?](https://sci-sport.com/en/glutes-hypertrophy-hip-thrust-or-parallel-squat-239/)
- [MuscleEvo — Do squats work your abs?](https://muscleevo.net/squats-work-your-abs/)
