# 📲 iOS Kısayolu ile SMS'ten Harcama Ekleme

## Önce dürüst gerçekler (oku!)
- **Hiçbir uygulama (PWA dâhil) iPhone'da gelen SMS'i kendi başına okuyamaz.** Bu yüzden uygulama, SMS'in geldiğini veya Vakıfbank'tan olduğunu **kendisi anlayamaz**.
- "Vakıfbank'tan mı geldi?" filtresini **iOS Kısayolları (Shortcuts)** yapar — gönderici olarak Vakıfbank'ı sen seçersin. Kısayol, SMS'in **metnini** uygulamaya verir; uygulama da metni çözümler.
- Bu yol **yarı-otomatiktir** ve iOS'in kısıtlarına tabidir:
  - "Mesaj" otomasyonu iOS sürümüne göre **çalışmadan önce bir bildirim/dokunuş** isteyebilir ("Hemen Çalıştır" açık olsa bile).
  - Otomasyon mesajın metnini değişken olarak her sürümde aynı şekilde vermeyebilir.
  - Ana ekrana eklenen PWA ile Safari, bazı iOS sürümlerinde **ayrı veri deposu** kullanır; bu durumda Kısayol'un eklediği kayıt, ana ekrandaki uygulamada görünmeyebilir. (Çözüm: aşağıdaki B planı.)

> **En güvenilir yol** hâlâ **Ekstre içe aktarma**dır (haftada bir dosya yükle). Aşağıdaki Kısayol bir kolaylıktır, garanti değildir.

---

## A planı — "Mesaj" otomasyonu (en otomatik, ama kısıtlı)
1. **Kısayollar** uygulaması → **Otomasyon** → **+** → **Kişisel Otomasyon Oluştur**.
2. **Mesaj** tetikleyicisini seç.
   - **Gönderen:** Vakıfbank'ın SMS gönderdiği isim/numara (gelen kutundaki başlık; ör. `VakifBank` veya kısa numara).
   - İstersen **"Şunu içeriyor"** → `TL` ekleyerek yalnız harcama SMS'lerini yakala.
3. **Hemen Çalıştır** seç (mümkünse "Çalıştırmadan önce sor"u kapat).
4. Eylem ekle → **URL** (Metin) ve şunu yaz (kendi adresinle):
   ```
   https://SENIN-ADRESIN/harcama-takip/index.html#auto=1&sms=
   ```
   Sonuna **Kısayol Girişi / Mesaj metni** değişkenini ekle (URL'in en sonunda dursun).
5. Eylem ekle → **URL'leri Aç**.
6. Kaydet. Artık eşleşen SMS geldiğinde uygulama açılıp harcamayı **otomatik** ekler (`#auto=1`).

> `#auto=1` olmadan (`...index.html#sms=` + metin) uygulama harcamayı **eklemeden önce sana gösterir**, sen onaylarsın. Daha güvenli olan budur.

---

## B planı — "Paylaş/Kopyala" Kısayolu (en güvenilir)
SMS otomasyonu sende çalışmazsa veya onay isteyerek eklemek istersen:

1. **Kısayollar** → **+** (yeni kısayol) → adını "Harcama Ekle" koy.
2. Eylem: **Panoyu Al** (Get Clipboard).
3. Eylem: **URL** (Metin):
   ```
   https://SENIN-ADRESIN/harcama-takip/index.html#sms=
   ```
   Sonuna **Pano** değişkenini ekle.
4. Eylem: **URL'leri Aç**.
5. Kullanımı: Vakıfbank SMS'ine **bas-tut → Kopyala** → bu kısayolu çalıştır (ana ekrana da eklenebilir). Uygulama açılır, harcama hazır gelir, onaylayıp eklersin.

---

## C planı — En basiti (kısayol bile gerekmez)
Uygulamada **Ayarlar → SMS / dekonttan ekle** → SMS'i **yapıştır** → **Ayrıştır** → **Ekle**. %100 çalışır.

---

### URL'deki adres ne olacak?
`SENIN-ADRESIN` yerine uygulamayı yayınladığın adresi yaz. Örn. GitHub Pages kullanıyorsan:
`https://kullaniciadi.github.io/asansortakip-pro/harcama-takip/index.html#sms=`
