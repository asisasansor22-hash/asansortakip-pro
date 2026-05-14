import Link from "next/link";
import { contact } from "@/lib/siteData";

export const metadata = {
  title: "Çerez Politikası",
  description: "Asis Asansör — web sitesinde kullanılan çerezler ve bunların yönetimi hakkında bilgi."
};

export default function CerezPage() {
  const primaryEmail = contact.emails[0];
  return (
    <main>
      <section className="page-hero">
        <div className="container">
          <div className="breadcrumb">Ana Sayfa / Çerez Politikası</div>
          <h1>Çerez Politikası</h1>
          <p className="lead">asisasansor.com web sitemizde kullandığımız çerezler ve bunlar hakkında haklarınız.</p>
        </div>
      </section>

      <section className="section">
        <div className="container" style={{ maxWidth: 880 }}>
          <article className="legal-doc">
            <p><strong>Son güncelleme:</strong> {new Date().toLocaleDateString("tr-TR", { year: "numeric", month: "long", day: "numeric" })}</p>

            <h2>1. Çerez Nedir?</h2>
            <p>Çerez (cookie), ziyaret ettiğiniz web sitesi tarafından tarayıcınız aracılığıyla cihazınıza kaydedilen küçük metin dosyalarıdır. Çerezler; siteyi daha verimli kullanmanızı sağlamak, tercihlerinizi hatırlamak ve site trafiğini analiz etmek için kullanılır.</p>

            <h2>2. Hangi Çerezleri Kullanıyoruz?</h2>
            <ul>
              <li><strong>Zorunlu çerezler:</strong> Web sitesinin temel işlevlerinin (sayfa gezinme, form gönderimi, oturum yönetimi vb.) çalışması için gereklidir. Bu çerezler olmadan site düzgün çalışamaz.</li>
              <li><strong>Performans/Analitik çerezler:</strong> Google Analytics ve benzeri araçlar aracılığıyla ziyaretçi sayısı, sayfa görüntüleme, ziyaret süresi gibi anonim ölçüm verilerini toplar. Bu veriler kullanıcı deneyimini geliştirmek için kullanılır.</li>
              <li><strong>Reklam/Pazarlama çerezleri:</strong> Google Ads dönüşüm takip çerezleri (Google Ads Conversion Tracking) reklam etkinliğini ölçmek için kullanılır. WhatsApp tıklamaları gibi dönüşüm olayları izlenir.</li>
              <li><strong>Üçüncü taraf çerezleri:</strong> Web sitemizde Google&apos;a (Analytics, Ads), Cloudflare&apos;e (altyapı) ait üçüncü taraf çerezler bulunabilir. Bu sağlayıcılar kendi gizlilik politikalarına tabidir.</li>
            </ul>

            <h2>3. Çerezleri Yönetme</h2>
            <p>Çerezleri kabul etmek zorunda değilsiniz. Tarayıcınızın ayarları üzerinden çerezleri silebilir veya engelleyebilirsiniz. Ancak bazı çerezleri devre dışı bırakmanız sitenin bazı bölümlerinin çalışmamasına neden olabilir.</p>
            <ul>
              <li><strong>Chrome:</strong> Ayarlar &gt; Gizlilik ve güvenlik &gt; Çerezler ve diğer site verileri</li>
              <li><strong>Safari:</strong> Tercihler &gt; Gizlilik &gt; Çerezler ve web sitesi verileri</li>
              <li><strong>Firefox:</strong> Tercihler &gt; Gizlilik ve Güvenlik &gt; Çerezler ve Site Verileri</li>
              <li><strong>Edge:</strong> Ayarlar &gt; Çerezler ve site izinleri</li>
            </ul>
            <p>Google Analytics çerezlerini devre dışı bırakmak için <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer">Google Analytics Opt-out</a> aracını kullanabilirsiniz.</p>

            <h2>4. Toplanan Veriler ve Amaç</h2>
            <p>Çerezler aracılığıyla; IP adresi, tarayıcı tipi, işletim sistemi, ziyaret tarih ve saati, görüntülenen sayfalar, referans bağlantısı gibi veriler toplanabilir. Bu veriler; site güvenliğinin sağlanması, kullanım analizinin yapılması ve reklam performansının ölçülmesi amaçlarıyla işlenir.</p>

            <h2>5. KVKK Kapsamında Haklarınız</h2>
            <p>6698 sayılı Kişisel Verilerin Korunması Kanunu kapsamında haklarınızın tamamı için <Link href="/kvkk-aydinlatma-metni">KVKK Aydınlatma Metni</Link> sayfamızı inceleyebilirsiniz. Başvurularınızı <a href={`mailto:${primaryEmail}`}>{primaryEmail}</a> adresine iletebilirsiniz.</p>

            <h2>6. Politikadaki Değişiklikler</h2>
            <p>Asis Asansör bu çerez politikasını dilediği zaman güncelleyebilir. Güncel sürüm her zaman bu sayfada yayımlanır.</p>
          </article>
        </div>
      </section>
    </main>
  );
}
