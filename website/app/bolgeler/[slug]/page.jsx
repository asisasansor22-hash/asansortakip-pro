import Link from "next/link";
import { notFound } from "next/navigation";
import Reveal from "@/components/Reveal";
import { districts, contact } from "@/lib/siteData";

export function generateStaticParams() {
  return districts.map((d) => ({ slug: d.slug }));
}

export function generateMetadata({ params }) {
  const district = districts.find((d) => d.slug === params.slug);
  if (!district) return {};
  return {
    title: `${district.name} Asansör Bakım ve Servis | Asis Asansör`,
    description: `${district.name} ilçesinde asansör bakım, arıza ve revizyon hizmeti. Asis Asansör — 7/24 servis, yazılı garanti, raporlu bakım.`,
    alternates: { canonical: `/bolgeler/${district.slug}` },
    openGraph: {
      title: `${district.name} Asansör Servisi | Asis Asansör`,
      description: `${district.name} ilçesinde asansör bakım ve arıza servisi.`
    }
  };
}

export default function DistrictPage({ params }) {
  const district = districts.find((d) => d.slug === params.slug);
  if (!district) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: "Asis Asansör",
    description: `${district.name} ilçesinde asansör bakım, arıza ve revizyon hizmeti`,
    telephone: contact.phones[0],
    address: {
      "@type": "PostalAddress",
      addressLocality: district.name,
      addressRegion: "İstanbul",
      addressCountry: "TR"
    },
    areaServed: district.name,
    url: `https://asisasansor.com/bolgeler/${district.slug}`
  };

  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <section className="page-hero">
        <div className="container">
          <div className="breadcrumb">
            <Link href="/">Ana Sayfa</Link> / <Link href="/bolgeler">Bölgeler</Link> / {district.name}
          </div>
          <h1>{district.name} Asansör Bakım ve Servis</h1>
          <p className="lead">
            {district.name} ilçesindeki apartman, site ve işletmelere asansör bakım, arıza müdahalesi ve revizyon hizmeti sunuyoruz. Ortalama müdahale süremiz 45 dakikadır.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container split">
          <Reveal>
            <div className="eyebrow">{district.name} Hizmetleri</div>
            <h2>{district.name}'de sunduğumuz asansör hizmetleri.</h2>
            <ul className="check-list">
              <li>Aylık periyodik bakım ve yazılı raporlama</li>
              <li>7/24 acil arıza müdahalesi</li>
              <li>Asansör revizyon ve modernizasyon</li>
              <li>Yeni asansör montajı</li>
              <li>Periyodik muayene hazırlığı</li>
            </ul>
            <div style={{ marginTop: "2rem", display: "flex", gap: "1rem", flexWrap: "wrap" }}>
              <a className="btn btn-dark" href={`tel:${contact.phoneLinks[0]}`}>Hemen Ara</a>
              <Link className="btn btn-outline" href="/iletisim">Teklif İste</Link>
            </div>
          </Reveal>
          <Reveal>
            <div className="card">
              <div className="card-kicker">Neden Asis Asansör?</div>
              <ul className="plain-list">
                <li>7 yıllık saha deneyimi</li>
                <li>Her bakım sonrası yazılı rapor</li>
                <li>Ortalama 45 dk müdahale süresi</li>
                <li>Yazılı garanti ve şeffaf fiyatlandırma</li>
                <li>Yetki belgeli servis ekibi</li>
              </ul>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="section alt">
        <div className="container grid-3">
          <Reveal className="card">
            <h3>Bakım</h3>
            <p>{district.name} ilçesindeki asansörleriniz için aylık periyodik bakım ve yasal raporlama.</p>
          </Reveal>
          <Reveal className="card">
            <h3>Arıza Servisi</h3>
            <p>{district.name}'de acil arıza anında 7/24 müdahale. Ortalama sahaya ulaşma süresi 45 dakika.</p>
          </Reveal>
          <Reveal className="card">
            <h3>Revizyon</h3>
            <p>Eski ve sık arızalanan asansörlerde kapı, pano ve kumanda sistemi yenileme.</p>
          </Reveal>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <Reveal>
            <div className="article-cta">
              <h2>{district.name} için asansör bakım teklifi alın.</h2>
              <p>Binanızın adresini ve asansör bilgilerini bırakın, 48 saat içinde yazılı teklif sunalım.</p>
              <Link className="btn btn-dark" href="/iletisim">İletişime Geç</Link>
            </div>
          </Reveal>
        </div>
      </section>
    </main>
  );
}
