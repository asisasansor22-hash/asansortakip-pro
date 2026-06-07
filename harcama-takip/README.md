# 👛 Cüzdan — Harcama Takip

Günlük ve aylık harcamalarını **saniyeler içinde** tutman için yazılmış, iPhone öncelikli, bağımsız bir uygulama. Kurulum/derleme gerektirmez; tek bir klasör statik dosyadan ibarettir.

> Bu, depodaki asansör takip uygulamasından **tamamen ayrı** bir programdır. Ona hiç dokunmaz, kendi verisini ayrı tutar.

---

## ✨ Neler yapar?

- **Çok hızlı manuel giriş:** Büyük tuş takımıyla tutarı yaz → kategoriye dokun → bitti (2–3 saniye).
- **Günlük & aylık özet:** Bugün ne harcadın, bu ay toplam ne kadar, bütçenin ne kadarı kaldı.
- **Aylık rapor:** Kategori dağılımı, geçen aya göre değişim, günlük grafik, günlük ortalama.
- **Sabit (aylık) giderler:** Kira, abonelik, aidat… bir kez ekle, her ay otomatik sayılsın.
- **Düzenle / sil / geri al:** Yanlış girdiğin her şeyi tek dokunuşla düzelt.
- **İnternet yedeği:** Kendine ait (ayrı) bir Firebase ile tüm cihazlarda senkron + güvenli yedek. Bkz. [`KURULUM.md`](KURULUM.md).
- **Vakıfbank'tan toplu içe aktarma:** Ekstreyi (CSV) yükle → harcamalar otomatik girilir ve kategorilenir.
- **SMS/dekont yapıştırma:** Harcama SMS'ini yapıştır → tutar/işyeri/tarih otomatik dolar. (Bkz. aşağıdaki dürüst not.)
- **Yedek dosyası:** JSON yedek al/geri yükle, CSV (Excel) dışa aktar.
- **Açık/Koyu tema**, Türkçe arayüz, çevrimdışı da açılır (PWA).

---

## 📱 iPhone'a kurma (ana ekrana ekleme)

1. Önce uygulamayı bir **web adresinde yayınla** (aşağıdaki "Yayınlama").
2. iPhone'da **Safari** ile o adresi aç.
3. Alttaki **Paylaş** (kare + ok) → **Ana Ekrana Ekle**.
4. Artık ana ekranda **Cüzdan** ikonu var; normal uygulama gibi tam ekran açılır.

---

## 🌐 Yayınlama (en kolay yollar)

İnternet yedeği ve "ana ekrana ekle" için uygulamanın bir **HTTPS adresinde** olması gerekir.

**GitHub Pages (ücretsiz):** Depo → **Settings → Pages** → *Deploy from a branch* → bu branch'i ve kök dizini seç. Adres şöyle olur:
`https://<kullanıcı>.github.io/asansortakip-pro/harcama-takip/`

**Netlify (sürükle-bırak):** [app.netlify.com/drop](https://app.netlify.com/drop) adresine `harcama-takip` klasörünü bırak.

**Bilgisayarda denemek için:**
```bash
cd harcama-takip
python3 -m http.server 8000
# tarayıcıda: http://localhost:8000
```

---

## 💳 Vakıfbank harcamaları — dürüst açıklama

**Tam otomatik, canlı "ben harcadıkça kendiliğinden işlensin" mümkün değildir.** Sebepleri:
- Bir bankanın hesap hareketlerine programlı erişim Türkiye'de **BDDK lisansı** gerektirir; bireysel uygulama Vakıfbank API'sine bağlanamaz.
- **iPhone, hiçbir uygulamanın gelen SMS'leri okumasına izin vermez.** Bu yüzden bir web/uygulama, SMS'in geldiğini veya kimden geldiğini kendi başına anlayamaz.
- Banka şifrenle giriş yapıp ekran kazımak (scraping) yasaktır ve güvensizdir — yapılmaz.

**Bunun yerine çalışan yöntemler:**
1. **Ekstre içe aktarma (en güvenilir, en tembel):** Haftada/ayda bir Vakıfbank'tan ekstreni CSV indir → Ayarlar → *Ekstre içe aktar* → hepsi otomatik girilir. Elle hiçbir şey yazmazsın.
2. **SMS yapıştırma:** Harcama SMS'ini kopyala → *SMS / dekonttan ekle* → tutar/işyeri/tarih otomatik dolar, onayla.
3. **iOS Kısayolu (yarı-otomatik):** SMS'i yakalayıp uygulamaya verir; "Vakıfbank'tan mı geldi" filtresini **iOS yapar**. Kısıtları ve kurulumu: [`KISAYOL-REHBERI.md`](KISAYOL-REHBERI.md).

---

## 🔒 Gizlilik

- Veriler yalnızca **senin cihazında** (tarayıcı deposunda) ve kurarsan **senin kendi bulutunda** (Firebase) tutulur.
- Banka şifren **hiçbir yerde istenmez**, hiçbir yere gönderilmez.

---

## 🛠️ Teknik

- Saf HTML + CSS + JavaScript. Çerçeve yok, derleme yok, bağımlılık yok.
- `index.html`, `styles.css`, `app.js` (arayüz/mantık), `sync.js` (bulut yedek), `sw.js` + `manifest.json` (PWA), `icons/` (ikonlar).
- İkonları yeniden üretmek için: `python3 scripts/make_icons.py`
