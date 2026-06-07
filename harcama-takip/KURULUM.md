# ☁️ İnternet Yedeği Kurulumu (kendi Firebase'in — ~5 dk)

Bu adımlar, harcamalarının internette güvenle yedeklenmesi ve tüm cihazlarında senkron olması içindir. **Ayrı, sadece bu uygulamaya ait** bir Firebase projesi açarsın; asansör projesine dokunulmaz. Ücretsiz plan fazlasıyla yeter.

## 1) Proje oluştur
1. [console.firebase.google.com](https://console.firebase.google.com) → **Add project / Proje ekle**.
2. İsim ver (ör. `cuzdanim`). Google Analytics istersen kapatabilirsin. **Create**.

## 2) Realtime Database aç
1. Sol menü → **Build → Realtime Database**.
2. **Create Database** → bölge: **Belgium (europe-west1)** öner. → **Next**.
3. Başlangıç kuralı için **"Start in locked mode"** seç → **Enable**.
4. Üstteki **Rules** sekmesine geç ve şunu yapıştır, **Publish** de:

```json
{
  "rules": {
    "harcama": {
      "$uid": {
        ".read":  "auth != null && auth.uid === $uid",
        ".write": "auth != null && auth.uid === $uid"
      }
    }
  }
}
```

> Bu kural: sadece **giriş yapan kişi**, **kendi** verisini okuyup yazabilir. Başkası göremez.

## 3) E-posta/Şifre girişini aç
1. Sol menü → **Build → Authentication → Get started**.
2. **Sign-in method** sekmesi → **Email/Password** → **Enable** → **Save**.

## 4) Web uygulaması ekle ve bilgileri al
1. Sol üstte ⚙️ → **Project settings**.
2. Aşağıda **Your apps** → **Web** simgesine (`</>`) tıkla, bir takma ad ver, **Register app**.
3. Görünen `firebaseConfig` içinden iki değeri kopyala:
   - `apiKey`  → ör. `AIzaSy....`
   - `databaseURL` → ör. `https://cuzdanim-default-rtdb.europe-west1.firebasedatabase.app`

   > `databaseURL` görünmüyorsa Realtime Database sayfasının üstündeki adres odur.

## 5) Uygulamaya gir
1. Cüzdan → **Ayarlar → İnternet Yedeği → Bulut yedeği kur**.
2. `apiKey` ve `databaseURL`'i yapıştır.
3. Bir **e-posta** ve **en az 6 haneli yeni bir şifre** belirle (bu uygulamaya özel; istediğini yazabilirsin).
4. **Bağlan / Giriş yap**. İlk girişte hesap otomatik oluşur.

Artık her değişiklik birkaç saniye içinde buluta yedeklenir. Yeni bir telefonda aynı e-posta + şifre ile girersen tüm verilerin geri gelir. ✅

---

### Sık sorunlar
- **"İzin reddedildi"** → 2. adımdaki **Rules**'u yapıştırıp **Publish** etmeyi unuttun.
- **"E-posta/Şifre girişi kapalı"** → 3. adımı yap (Authentication → Email/Password → Enable).
- **"Bağlantı yok"** → `databaseURL` yanlış/eksik; başında `https://` ve sonu `.firebasedatabase.app` olmalı.
