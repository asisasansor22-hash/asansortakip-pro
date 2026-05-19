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
    title: `${district.name} Asansör Bakım Firması | Asis Asansör`,
    description: `${district.name} ilçesinde profesyonel asansör bakım, arıza ve revizyon hizmeti. 7/24 servis, 45 dk müdahale, yazılı garanti. Hemen arayın: ${contact.phones[0]}`,
    alternates: { canonical: `/bolgeler/${district.slug}` },
    openGraph: {
      title: `${district.name} Asansör Bakım Firması | Asis Asansör`,
      description: `${district.name} ilçesinde 7/24 asansör bakım ve arıza servisi. Hemen arayın: ${contact.phones[0]}`
    }
  };
}

const faqs = (name) => [
  {
    q: `${name}'da asansör bakım hizmeti veriyor musunuz?`,
    a: `Evet, ${name} ilçesindeki tüm apartman, rezidans ve işyerlerine aylık periyodik bakım hizmeti sunuyoruz. Bakım ekibimiz her ay düzenli olarak gelir, kontrol listesini tamamlar ve yazılı rapor bırakır.`
  },
  {
    q: `${name}'da asansör arızasına ne kadar sürede gelirsiniz?`,
    a: `${name} ve çevresine ortalama 45 dakika içinde ulaşıyoruz. 7/24 arıza hattımız sürekli aktiftir; aramanızın ardından en yakın ekibimiz yönlendirilir.`
  },
  {
    q: "Bakım sözleşmesi şart mı?",
    a: "Hayır, tek seferlik bakım veya arıza müdahalesi de yapıyoruz. Ancak aylık sözleşmeli bakımda bina sahipleri yasal yükümlülüklerini karşılar ve beklenmedik arıza maliyetlerinden korunur."
  },
  {
    q: "Bakım sonrasında rapor alabilir miyiz?",
    a: "Her bakımdan sonra dijital ve yazılı kontrol raporu düzenliyoruz. Raporda yapılan kontroller, tespit edilen durumlar ve varsa öneriler yer alır."
  },
  {
    q: "Yetki belgeniz var mı?",
    a: "Evet. Ekibimiz Bakanlık onaylı A Tipi Muayene belgelerine sahiptir ve periyodik muayene süreçlerinde tam destek sağlar."
  }
];

export default function DistrictPage({ params }) {
  const district = districts.find((d) => d.slug === params.slug);
  if (!district) notFound();

  const faqList = faqs(district.name);

  const localBizLd = {
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
    url: `https://asisasansor.com/bolgeler/${district.slug}`,
    openingHoursSpecification: {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"],
      opens: "00:00",
      closes: "23:59"
    }
  };

  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqList.map(({ q, a }) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: { "@type": "Answer", text: a }
    }))
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(localBizLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />

      <main>
        {/* HERO */}
        <section className="page-hero">
          <div className="container">
            <div className="breadcrumb">
              <Link href="/">Ana Sayfa</Link> / <Link href="/bolgeler">Bölgeler</Link> / {district.name}
            </div>
            <h1>{district.name} Asansör Bakım Firması</h1>
            <p className="lead">
              {district.name} ilçesindeki apartman ve sitelere asansör bakım, arıza müdahalesi ve revizyon hizmeti sunuyoruz. Ortalama müdahale süremiz 45 dakikadır.
            </p>
            <div className="district-trust-bar">
              <span>✓ 7 Yıllık Deneyim</span>
              <span>✓ 45 Dk Müdahale</span>
              <span>✓ Yazılı Garanti</span>
              <span>✓ 7/24 Servis</span>
            </div>
            <div style={{ marginTop: "1.5rem", display: "flex", gap: "1rem", flexWrap: "wrap" }}>
              <a className="btn btn-dark" href={`tel:${contact.phoneLinks[0]}`}>Hemen Ara</a>
              <a className="btn btn-outline" href={`https://wa.me/${contact.phoneLinks[0].replace("+","")}`} target="_blank" rel="noopener noreferrer">WhatsApp</a>
            </div>
          </div>
        </section>

        {/* HİZMETLER */}
        <section className="section">
          <div className="container split">
            <Reveal>
              <div className="eyebrow">{district.name} Hizmetleri</div>
              <h2>{district.name}'de sunduğumuz asansör hizmetleri</h2>
              <p style={{ marginBottom: "1rem", color: "var(--muted)" }}>
                {district.name} ilçesinde faaliyet gösteren ekibimiz, hem bireysel hem kurumsal müşterilere zamanında ve belgelenmiş hizmet sunar.
              </p>
              <ul className="check-list">
                <li>Aylık periyodik bakım ve yazılı raporlama</li>
                <li>7/24 acil arıza müdahalesi</li>
                <li>Asansör revizyon ve modernizasyon</li>
                <li>Yeni asansör montajı</li>
                <li>Periyodik muayene hazırlığı ve A Tipi belge desteği</li>
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
                  <li>Aynı gün arıza müdahalesi</li>
                </ul>
              </div>
            </Reveal>
          </div>
        </section>

        {/* HİZMET KARTLARI */}
        <section className="section alt">
          <div className="container grid-3">
            <Reveal className="card">
              <h3>Periyodik Bakım</h3>
              <p>{district.name} ilçesindeki asansörleriniz için aylık periyodik bakım, yasal raporlama ve kontrol listesi hizmeti.</p>
            </Reveal>
            <Reveal className="card">
              <h3>Arıza Servisi</h3>
              <p>{district.name}'de acil arıza anında 7/24 müdahale. Ortalama sahaya ulaşma süresi 45 dakikadır.</p>
            </Reveal>
            <Reveal className="card">
              <h3>Revizyon</h3>
              <p>{district.name}'deki eski ve sık arızalanan asansörlerde kapı, pano ve kumanda sistemi yenileme.</p>
            </Reveal>
          </div>
        </section>

        {/* SSS */}
        <section className="section">
          <div className="container">
            <Reveal>
              <div className="eyebrow">Sık Sorulan Sorular</div>
              <h2>{district.name} Asansör Bakımı Hakkında</h2>
            </Reveal>
            <div className="faq-list">
              {faqList.map(({ q, a }, i) => (
                <Reveal key={i} className="faq-item">
                  <h3 className="faq-q">{q}</h3>
                  <p className="faq-a">{a}</p>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="section alt">
          <div className="container">
            <Reveal>
              <div className="article-cta">
                <h2>{district.name} için asansör bakım teklifi alın.</h2>
                <p>Binanızın adresini ve asansör bilgilerini bırakın, en kısa sürede dönelim.</p>
                <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginTop: "1.5rem" }}>
                  <a className="btn btn-dark" href={`tel:${contact.phoneLinks[0]}`}>Hemen Ara</a>
                  <Link className="btn btn-outline" href="/iletisim">Teklif İste</Link>
                </div>
              </div>
            </Reveal>
          </div>
        </section>
      </main>

      {/* MOBILE STICKY CTA */}
      <div className="district-sticky-cta">
        <a href={`tel:${contact.phoneLinks[0]}`} className="district-sticky-btn district-sticky-call">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M6.62 10.79a15.05 15.05 0 006.59 6.59l2.2-2.2a1 1 0 011.01-.24c1.12.37 2.33.57 3.58.57a1 1 0 011 1V20a1 1 0 01-1 1C9.61 21 3 14.39 3 6a1 1 0 011-1h3.5a1 1 0 011 1c0 1.25.2 2.45.57 3.57a1 1 0 01-.25 1.02l-2.2 2.2z"/></svg>
          Hemen Ara
        </a>
        <a href={`https://wa.me/${contact.phoneLinks[0].replace("+","")}`} target="_blank" rel="noopener noreferrer" className="district-sticky-btn district-sticky-wa">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.126 1.533 5.857L.057 23.886a.5.5 0 00.609.627l6.204-1.625A11.94 11.94 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22a9.95 9.95 0 01-5.073-1.384l-.361-.214-3.735.979.997-3.645-.235-.374A9.952 9.952 0 012 12C2 6.477 6.477 2 12 2s10 5.477 10 10-4.477 10-10 10z"/></svg>
          WhatsApp
        </a>
      </div>
    </>
  );
}
