# Gelir Gider — kasa ve kâr/zarar defteri

AsansörTakip'ten **bağımsız**, kendi başına çalışan bir gelir-gider uygulaması.
Herhangi bir işletme (ya da kişisel bütçe) için kullanılabilir: asansöre özel
kavram içermez ve AsansörTakip verisine bağlanmaz.

## Ne yapar

- **İşlem defteri** — gelir, gider ve hesaplar arası transfer. Kategori,
  hesap, kişi/firma, belge no ve KDV oranı ile.
- **Hesaplar** — nakit kasa, banka, kredi kartı… Açılış bakiyesi verilir,
  bakiye işlemlerden hesaplanır; toplam varlık tek bakışta görünür.
- **Tekrarlayan işlemler** — kira, maaş, abonelik gibi kalemler bir kez
  tanımlanır; aylık, haftalık veya yıllık olarak deftere kendiliğinden işler.
  Geçmiş dönemlerin eksikleri tamamlanır, ileri tarihli kayıt oluşturulmaz.
- **Bütçe** — gider kategorilerine aylık üst sınır; aşan kalem kırmızıya döner.
- **Raporlar** — ay ay kâr/zarar tablosu, KDV özeti, kategori kalemleri,
  kişi/firma dökümü, CSV dışa aktarma (Excel'de doğru açılır).
- **Özet** — dönem seçici, net kâr, kâr marjı, gelir/gider dengesi ve
  son ayların gelir-gider-net grafiği.
- Koyu/açık tema, Türkçe sayı biçimi (`1.250,50`), telefona kurulabilir (PWA),
  çevrimdışı çalışır.

## Veri nerede duruyor

Yalnızca **cihazın tarayıcı deposunda** (localStorage). Sunucu, hesap ve
internet bağlantısı gerekmez; veri hiçbir yere gönderilmez.

Bunun karşılığı: tarayıcı verisini temizlersen ya da başka cihaza geçersen
defter gitmez, **gelmez de**. Ayarlar → **Yedek al** ile JSON dosyası indir,
diğer cihazda **Geri yükle** ile aç.

## Geliştirme

```bash
cd gelirgider
npm install
npm run dev        # http://localhost:5173
npm test           # hesap motoru testleri (32 test)
npm run build      # dist/
npm run simgeler   # public/simge.svg → PWA png simgeleri
```

Hesap mantığının tamamı `src/finans.js` içinde saf fonksiyonlar hâlinde durur
ve testleri `test/finans.test.mjs` içindedir; arayüz yalnızca gösterim yapar.
Depolama katmanı `src/depo.js`.

## Yayınlama

Ayrı bir site olarak bağlanır (kökteki AsansörTakip dağıtımını etkilemez):

| Ayar | Değer |
|---|---|
| Kök / base dizini | `gelirgider` |
| Derleme komutu | `npm run build` |
| Çıktı dizini | `dist` |

Netlify için `netlify.toml`, Cloudflare Pages/Netlify başlıkları için
`public/_headers` hazır. Tek sayfa uygulaması olduğu için bilinmeyen yollar
`index.html`'e yönlendirilir.
