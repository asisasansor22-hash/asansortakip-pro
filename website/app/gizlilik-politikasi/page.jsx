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

            <h2>5. Çerezler</h2>
            <p>Web sitemiz, kullanıcı deneyimini iyileştirmek ve trafiği analiz etmek için çerezler kullanmaktadır. Çerez kullanımına ilişkin detaylı bilgi için <Link href="/cerez-politikasi">Çerez Politikası</Link> sayfasını inceleyebilirsiniz.</p>

            <h2>6. Veri Güvenliği</h2>
            <p>Kişisel verilerinizin yetkisiz erişime, kayba veya değişikliğe karşı korunması için makul teknik ve idari tedbirler alıyoruz. Ancak internet üzerinden yapılan hiçbir iletim %100 güvenli olmadığı için mutlak güvenlik garanti edilemez.</p>

            <h2>7. Saklama Süresi</h2>
            <p>Verileriniz; yasal saklama süreleri ve işleme amacı ile sınırlı olarak saklanır. Amaç sona erdiğinde silinir, yok edilir veya anonim hâle getirilir.</p>

            <h2>8. Haklarınız</h2>
            <p>6698 sayılı KVKK kapsamında kişisel verilerinize ilişkin haklarınızı kullanmak için <a href={`mailto:${primaryEmail}`}>{primaryEmail}</a> adresine başvurabilirsiniz. Haklarınızın tamamı için <Link href="/kvkk-aydinlatma-metni">KVKK Aydınlatma Metni</Link> sayfamıza bakabilirsiniz.</p>

            <h2>9. İletişim</h2>
            <p>
              Gizlilik politikası ile ilgili her türlü soru ve talebiniz için bize ulaşabilirsiniz:
              <br />Adres: {contact.address}
              <br />E-posta: <a href={`mailto:${primaryEmail}`}>{primaryEmail}</a>
              <br />Telefon: {contact.phones.join(" / ")}
            </p>

            <h2>10. Değişiklikler</h2>
            <p>Asis Asansör, bu politikada gerekli gördüğü değişiklikleri yapma hakkını saklı tutar. Güncellenen metin bu sayfada yayımlandığı anda yürürlüğe girer.</p>
          </article>
        </div>
      </section>
    </main>
  );
}
