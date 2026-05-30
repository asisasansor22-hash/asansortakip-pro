import { contact } from "@/lib/siteData";

export const metadata = {
  title: "KVKK Aydınlatma Metni",
  description: "Asis Asansör — 6698 sayılı Kişisel Verilerin Korunması Kanunu kapsamında veri sorumlusu sıfatıyla yapılan aydınlatma metni."
};

export default function KvkkPage() {
  const primaryEmail = contact.emails[0];
  return (
    <main>
      <section className="page-hero">
        <div className="container">
          <div className="breadcrumb">Ana Sayfa / KVKK Aydınlatma Metni</div>
          <h1>KVKK Aydınlatma Metni</h1>
          <p className="lead">6698 sayılı Kişisel Verilerin Korunması Kanunu (&ldquo;KVKK&rdquo;) kapsamında veri sorumlusu sıfatıyla bilgi vermek amacıyla hazırlanmıştır.</p>
        </div>
      </section>

      <section className="section">
        <div className="container" style={{ maxWidth: 880 }}>
          <article className="legal-doc">
            <p><strong>Son güncelleme:</strong> {new Date().toLocaleDateString("tr-TR", { year: "numeric", month: "long", day: "numeric" })}</p>

            <h2>1. Veri Sorumlusu</h2>
            <p>
              İşbu aydınlatma metni kapsamında veri sorumlusu <strong>Asis Asansör</strong>&apos;dür.
              <br />Adres: {contact.address}
              <br />E-posta: <a href={`mailto:${primaryEmail}`}>{primaryEmail}</a>
              <br />Telefon: {contact.phones.join(" / ")}
            </p>

            <h2>2. İşlenen Kişisel Veriler</h2>
            <p>Asis Asansör, sunduğu hizmetler ve web sitesi (asisasansor.com) üzerinden aşağıdaki kişisel verileri işleyebilir:</p>
            <ul>
              <li><strong>Kimlik bilgileri:</strong> ad, soyad.</li>
              <li><strong>İletişim bilgileri:</strong> telefon numarası, e-posta adresi, ilçe/bina adresi.</li>
              <li><strong>Müşteri işlem bilgileri:</strong> talep edilen hizmet türü (bakım, montaj, revizyon, onarım), mesaj içeriği.</li>
              <li><strong>İşlem güvenliği bilgileri:</strong> web sitesini ziyaret sırasında oluşan log kayıtları, IP adresi, çerez verileri.</li>
              <li><strong>Pazarlama ve analitik:</strong> Google Ads dönüşüm verisi, Google Analytics ölçüm verisi (kişisel kimliğe bağlanmadan).</li>
            </ul>

            <h2>3. Kişisel Verilerin İşlenme Amaçları</h2>
            <ul>
              <li>Talep edilen teklif, bakım, montaj, revizyon veya arıza müdahalesi hizmetlerinin sunulması,</li>
              <li>Müşteri ile iletişim kurulması ve sözleşme süreçlerinin yürütülmesi,</li>
              <li>Yasal yükümlülüklerin yerine getirilmesi (asansör periyodik kontrol kayıtları, fatura/muhasebe vb.),</li>
              <li>Hizmet kalitesinin geliştirilmesi ve şikâyetlerin değerlendirilmesi,</li>
              <li>Web sitesinin güvenliğinin sağlanması ve analitik amaçlı kullanımının ölçülmesi,</li>
              <li>Açık rıza verilmesi halinde pazarlama ve tanıtım faaliyetleri.</li>
            </ul>

            <h2>4. İşlemenin Hukuki Sebepleri</h2>
            <p>Kişisel verileriniz KVKK m.5 ve m.6 kapsamında aşağıdaki hukuki sebeplerden bir veya birkaçına dayanılarak işlenir:</p>
            <ul>
              <li>Bir sözleşmenin kurulması veya ifası için gerekli olması,</li>
              <li>Veri sorumlusunun hukuki yükümlülüğünü yerine getirebilmesi için zorunlu olması,</li>
              <li>İlgili kişinin temel hak ve özgürlüklerine zarar vermemek kaydıyla veri sorumlusunun meşru menfaatleri için zorunlu olması,</li>
              <li>Açık rızanızın bulunması.</li>
            </ul>

            <h2>5. Kişisel Verilerin Aktarılması</h2>
            <p>Kişisel verileriniz; hizmetin gereği olarak yetkili kamu kurum ve kuruluşlarına (örn. A tipi muayene kuruluşları, Sanayi ve Teknoloji Bakanlığı), mali müşavir, hukuk ve muhasebe danışmanlarına, ödeme/banka kuruluşlarına, web sitesi altyapı ve hosting hizmet sağlayıcılarına ve mevzuat gereği aktarılması zorunlu mercilere KVKK m.8 ve m.9 hükümlerine uygun olarak aktarılabilir. Açık rızanız olmaksızın yurt dışına veri aktarımı yapılmaz; ancak web sitesi altyapısı kapsamında kullanılan hizmet sağlayıcıların (örn. Cloudflare, Google) sunucularının yurt dışında bulunabileceği bilgilendirilir.</p>

            <h2>6. Kişisel Verilerin Toplanma Yöntemi</h2>
            <p>Kişisel verileriniz; web sitemiz üzerindeki iletişim formu, e-posta, telefon, WhatsApp, fiziksel sözleşme imzalama ve saha keşfi gibi otomatik ve otomatik olmayan yollarla toplanmaktadır.</p>

            <h2>7. Saklama Süresi</h2>
            <p>Kişisel verileriniz; ilgili mevzuatta belirlenen veya işlendikleri amaç için gerekli olan süre kadar saklanır. Mevzuatta belirlenen sürenin sonunda veya işleme amacının ortadan kalkması halinde kişisel verileriniz silinir, yok edilir veya anonim hâle getirilir.</p>

            <h2>8. İlgili Kişi Olarak Haklarınız</h2>
            <p>KVKK m.11 uyarınca kişisel verilerinize ilişkin aşağıdaki haklara sahipsiniz:</p>
            <ul>
              <li>Kişisel verilerinizin işlenip işlenmediğini öğrenme,</li>
              <li>İşlenmişse buna ilişkin bilgi talep etme,</li>
              <li>İşlenme amacını ve bunların amacına uygun kullanılıp kullanılmadığını öğrenme,</li>
              <li>Yurt içinde veya yurt dışında aktarıldığı üçüncü kişileri bilme,</li>
              <li>Eksik veya yanlış işlenmiş ise düzeltilmesini isteme,</li>
              <li>KVKK&apos;nın 7. maddesinde öngörülen şartlar çerçevesinde silinmesini veya yok edilmesini isteme,</li>
              <li>Yapılan düzeltme, silme veya yok etme işlemlerinin verilerin aktarıldığı üçüncü kişilere bildirilmesini isteme,</li>
              <li>İşlenen verilerin münhasıran otomatik sistemler vasıtasıyla analiz edilmesi suretiyle aleyhinize bir sonucun ortaya çıkmasına itiraz etme,</li>
              <li>Kanuna aykırı işleme nedeniyle zarara uğramanız hâlinde zararın giderilmesini talep etme.</li>
            </ul>

            <h2>9. Başvuru Yöntemi</h2>
            <p>
              Yukarıdaki haklarınızı kullanmak için talebinizi; kimliğinizi tespit edici belgelerle birlikte ıslak imzalı olarak <strong>{contact.address}</strong> adresine yazılı şekilde gönderebilir veya <a href={`mailto:${primaryEmail}`}>{primaryEmail}</a> e-posta adresine iletebilirsiniz. Başvurunuz, KVKK m.13 uyarınca en geç otuz gün içinde sonuçlandırılır.
            </p>

            <p className="muted" style={{ marginTop: 32 }}>
              Asis Asansör, bu aydınlatma metninde mevzuat ve uygulamaya bağlı olarak değişiklik yapma hakkını saklı tutar. Güncel metin her zaman bu sayfada yayımlanır.
            </p>
          </article>
        </div>
      </section>
    </main>
  );
}
