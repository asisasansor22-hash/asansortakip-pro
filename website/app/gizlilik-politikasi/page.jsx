import Link from "next/link";
import { contact } from "@/lib/siteData";

export const metadata = {
  title: "Gizlilik Politikası",
  description: "Asis Asansör — web sitesi ve hizmetlerimiz kapsamında kişisel verilerinizin nasıl korunduğuna ilişkin gizlilik politikası."
};

export default function GizlilikPage() {
  const primaryEmail = contact.emails[0];
  return (
    <main>
      <section className="page-hero">
        <div className="container">
          <div className="breadcrumb">Ana Sayfa / Gizlilik Politikası</div>
          <h1>Gizlilik Politikası</h1>
          <p className="lead">Asis Asansör olarak kişisel verilerinizin gizliliğine ve güvenliğine önem veriyoruz.</p>
        </div>
      </section>

      <section className="section">
        <div className="container" style={{ maxWidth: 880 }}>
          <article className="legal-doc">
            <p><strong>Son güncelleme:</strong> {new Date().toLocaleDateString("tr-TR", { year: "numeric", month: "long", day: "numeric" })}</p>

            <h2>1. Genel Bilgi</h2>
            <p>Bu gizlilik politikası, Asis Asansör&apos;ün (&ldquo;biz&rdquo;, &ldquo;şirket&rdquo;) asisasansor.com web sitesi ve sunduğu hizmetler aracılığıyla topladığı kişisel verilerin nasıl kullanıldığını, saklandığını ve korunduğunu açıklamak amacıyla hazırlanmıştır. Detaylı KVKK aydınlatma metni için <Link href="/kvkk-aydinlatma-metni">KVKK Aydınlatma Metni</Link> sayfasını inceleyebilirsiniz.</p>

            <h2>2. Toplanan Bilgiler</h2>
            <p>Web sitemizi kullandığınızda veya bizimle iletişime geçtiğinizde aşağıdaki bilgileri toplayabiliriz:</p>
            <ul>
              <li>İletişim formunda paylaştığınız ad, soyad, telefon, e-posta ve ilçe/adres bilgileri,</li>
              <li>Hizmet talebinize ilişkin mesaj içeriği,</li>
              <li>Web sitesi ziyaretiniz sırasında otomatik olarak oluşan log ve çerez verileri (IP, tarayıcı, ziyaret tarihi),</li>
              <li>Google Ads ve Google Analytics gibi pazarlama/analitik araçların ürettiği anonim ölçüm verileri.</li>
            </ul>

            <h2>3. Bilgilerin Kullanım Amacı</h2>
            <ul>
              <li>Talep ettiğiniz teklif, bakım, montaj, revizyon veya arıza müdahalesi hizmetinin sunulması,</li>
              <li>Sizinle iletişim kurulması ve sözleşme süreçlerinin yürütülmesi,</li>
              <li>Yasal yükümlülüklerimizin yerine getirilmesi,</li>
              <li>Web sitesinin güvenliği, performansı ve kullanıcı deneyiminin iyileştirilmesi,</li>
              <li>Açık rızanız bulunduğu takdirde pazarlama ve tanıtım faaliyetleri.</li>
            </ul>

            <h2>4. Bilgi Paylaşımı</h2>
            <p>Kişisel verilerinizi yasal zorunluluklar haricinde üçüncü kişilerle paylaşmayız. Yalnızca hizmetin gereği olarak yetkili kamu kurumları, A tipi muayene kuruluşları, mali ve hukuki danışmanlarımız, web sitesi altyapı sağlayıcılarımız ile sınırlı şekilde aktarım yapılabilir. Verilerinizi reklam amacıyla üçüncü kişilere satmayız.</p>

            <h2>5. Google Ads API Kullanımı</h2>
            <p>Asis Asansör, yalnızca <strong>kendi Google Ads reklam hesabını</strong> programatik olarak yönetmek ve performans raporlarını alabilmek amacıyla Google Ads API hizmetini kullanmaktadır. Bu kapsamda işlenen veriler şunlarla sınırlıdır:</p>
            <ul>
              <li>Asis Asansör&apos;e ait Google Ads hesabının kampanya, reklam grubu, anahtar kelime ve dönüşüm verileri,</li>
              <li>Reklam performans metrikleri (gösterim, tıklama, maliyet, dönüşüm sayısı),</li>
              <li>API çağrılarını gerçekleştirmek için kullanılan OAuth 2.0 yetkilendirme token bilgileri.</li>
            </ul>
            <p><strong>Google Ads API üzerinden alınan veriler:</strong></p>
            <ul>
              <li>Yalnızca yetkili Asis Asansör personeli tarafından, kendi reklam yönetimi ve raporlama amacıyla görüntülenir.</li>
              <li>HTTPS üzerinden şifreli olarak iletilir; Firebase Authentication ile korunan sistemlerde saklanır.</li>
              <li><strong>Hiçbir koşulda üçüncü taraflara satılmaz, kiralanmaz, paylaşılmaz veya pazarlama amacıyla aktarılmaz.</strong></li>
              <li>Reklam müşterilerine ait son kullanıcı (web sitesi ziyaretçisi) kişisel verileriyle eşleştirilmez.</li>
              <li>Yalnızca işleme amacının gerektirdiği süre boyunca saklanır; ihtiyaç sona erdiğinde silinir.</li>
            </ul>
            <p>Asis Asansör, Google Ads API kullanımında <a href="https://developers.google.com/google-ads/api/docs/policy" target="_blank" rel="noopener noreferrer">Google Ads API Required Minimum Functionality</a> ve <a href="https://developers.google.com/terms" target="_blank" rel="noopener noreferrer">Google APIs Terms of Service</a> politikalarına tam uyum göstermeyi taahhüt eder.</p>

            <h2>6. Çerezler</h2>
            <p>Web sitemiz, kullanıcı deneyimini iyileştirmek ve trafiği analiz etmek için çerezler kullanmaktadır. Çerez kullanımına ilişkin detaylı bilgi için <Link href="/cerez-politikasi">Çerez Politikası</Link> sayfasını inceleyebilirsiniz.</p>

            <h2>7. Veri Güvenliği</h2>
            <p>Kişisel verilerinizin ve Google Ads API üzerinden alınan reklam hesabı verilerinin yetkisiz erişime, kayba veya değişikliğe karşı korunması için aşağıdaki teknik ve idari tedbirleri alıyoruz:</p>
            <ul>
              <li>Tüm veri iletimi HTTPS/TLS şifrelemesi ile gerçekleştirilir.</li>
              <li>Sistemlere erişim Firebase Authentication ve rol bazlı yetkilendirme ile sınırlandırılmıştır.</li>
              <li>OAuth 2.0 yetkilendirme token&apos;ları güvenli ortamda saklanır ve düzenli olarak yenilenir.</li>
              <li>Verilere yalnızca işin gereği bilmesi gereken yetkili personel erişebilir.</li>
              <li>Düzenli güvenlik gözden geçirmeleri yapılır.</li>
            </ul>
            <p>Ancak internet üzerinden yapılan hiçbir iletim %100 güvenli olmadığı için mutlak güvenlik garanti edilemez.</p>

            <h2>8. Saklama Süresi</h2>
            <p>Verileriniz; yasal saklama süreleri ve işleme amacı ile sınırlı olarak saklanır. Amaç sona erdiğinde silinir, yok edilir veya anonim hâle getirilir.</p>

            <h2>9. Haklarınız</h2>
            <p>6698 sayılı KVKK kapsamında kişisel verilerinize ilişkin haklarınızı kullanmak için <a href={`mailto:${primaryEmail}`}>{primaryEmail}</a> adresine başvurabilirsiniz. Haklarınızın tamamı için <Link href="/kvkk-aydinlatma-metni">KVKK Aydınlatma Metni</Link> sayfamıza bakabilirsiniz.</p>

            <h2>10. İletişim</h2>
            <p>
              Gizlilik politikası ile ilgili her türlü soru ve talebiniz için bize ulaşabilirsiniz:
              <br />Adres: {contact.address}
              <br />E-posta: <a href={`mailto:${primaryEmail}`}>{primaryEmail}</a>
              <br />Telefon: {contact.phones.join(" / ")}
            </p>

            <h2>11. Değişiklikler</h2>
            <p>Asis Asansör, bu politikada gerekli gördüğü değişiklikleri yapma hakkını saklı tutar. Güncellenen metin bu sayfada yayımlandığı anda yürürlüğe girer.</p>

            <hr style={{ margin: "3rem 0 2rem", border: "none", borderTop: "1px solid #e5e7eb" }} />

            <h2 id="english-summary">English Summary</h2>
            <p><em>This is a brief English summary of our Privacy Policy. The Turkish version above is the authoritative text.</em></p>

            <h3>1. Data Controller</h3>
            <p>Asis Asansör (the &ldquo;Company&rdquo;) operates the asisasansor.com website and provides elevator maintenance, installation, modernization, and repair services in Istanbul, Türkiye.
              <br />Address: {contact.address}
              <br />Contact: <a href={`mailto:${primaryEmail}`}>{primaryEmail}</a> · {contact.phones.join(" / ")}
            </p>

            <h3>2. Data We Collect</h3>
            <ul>
              <li>Identity and contact details voluntarily submitted via the contact form (name, phone, email, district).</li>
              <li>Service request details (selected service type, message content).</li>
              <li>Automatic log data when you visit our website (IP address, browser type, visit timestamp, referrer).</li>
              <li>Cookies and anonymous measurement data from Google Analytics and Google Ads.</li>
            </ul>

            <h3>3. How We Use Your Data</h3>
            <ul>
              <li>To respond to your service request and prepare offers (maintenance, installation, modernization, repair).</li>
              <li>To fulfill contractual and legal obligations (e.g. elevator periodic inspection records, invoicing).</li>
              <li>To improve website security and performance.</li>
              <li>For marketing and advertising activities, only with your explicit consent.</li>
            </ul>

            <h3>4. How We Protect Your Data</h3>
            <ul>
              <li>All data transmission is encrypted using HTTPS/TLS.</li>
              <li>Access to our systems is restricted via Firebase Authentication and role-based authorization.</li>
              <li>OAuth 2.0 tokens are stored securely and rotated periodically.</li>
              <li>Only authorized personnel with a legitimate business need can access the data.</li>
              <li>Regular security reviews are conducted.</li>
            </ul>

            <h3>5. Third-Party Sharing</h3>
            <p>We <strong>do not sell, rent, or share</strong> your personal data with third parties for marketing purposes. Limited sharing may occur only where required for service delivery (e.g. authorized public authorities, A-type inspection bodies, accountants and legal advisors, hosting providers such as Cloudflare and Google) or where mandated by law.</p>

            <h3>6. Google Ads API Usage</h3>
            <p>Asis Asansör uses the Google Ads API <strong>solely to manage its own Google Ads account</strong> and retrieve performance reports. Data accessed via the Google Ads API is limited to our own campaigns, ad groups, keywords, conversion metrics, and the OAuth 2.0 authorization tokens required for API calls.</p>
            <p>Google Ads API data:</p>
            <ul>
              <li>Is accessed only by authorized Asis Asansör personnel for our own advertising management and reporting.</li>
              <li>Is transmitted over HTTPS and stored in systems protected by Firebase Authentication.</li>
              <li><strong>Is never sold, rented, shared, or transferred to any third party for any purpose, including marketing.</strong></li>
              <li>Is not combined with end-user personal data collected from our website visitors.</li>
              <li>Is retained only as long as necessary for the stated purpose and is deleted thereafter.</li>
            </ul>
            <p>Our use of the Google Ads API complies with the <a href="https://developers.google.com/google-ads/api/docs/policy" target="_blank" rel="noopener noreferrer">Google Ads API Required Minimum Functionality</a> and the <a href="https://developers.google.com/terms" target="_blank" rel="noopener noreferrer">Google APIs Terms of Service</a>.</p>

            <h3>7. Cookies</h3>
            <p>Our website uses cookies for essential site functionality, anonymous analytics (Google Analytics), and advertising conversion tracking (Google Ads). For details and opt-out instructions, see our <Link href="/cerez-politikasi">Cookie Policy</Link>.</p>

            <h3>8. Your Rights</h3>
            <p>Under the Turkish Personal Data Protection Law (KVKK, Law No. 6698), you have the right to access, correct, delete, or restrict the processing of your personal data, and to object to automated decision-making. To exercise these rights, contact <a href={`mailto:${primaryEmail}`}>{primaryEmail}</a>. Requests are answered within 30 days.</p>

            <h3>9. Data Retention &amp; Deletion</h3>
            <p>Personal data is retained only for the period required by law or by the purpose of processing. Once the purpose ceases, data is deleted, destroyed, or anonymized.</p>

            <h3>10. Contact</h3>
            <p>For any privacy-related questions or requests, contact us at <a href={`mailto:${primaryEmail}`}>{primaryEmail}</a> or by post at {contact.address}.</p>

            <h3>11. Updates</h3>
            <p>We may update this policy from time to time. The current version is always published on this page and becomes effective upon posting.</p>
          </article>
        </div>
      </section>
    </main>
  );
}
