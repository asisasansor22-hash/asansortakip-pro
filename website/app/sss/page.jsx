import Link from "next/link";
import Reveal from "@/components/Reveal";
import { faqItems } from "@/lib/siteData";

export const metadata = {
  title: "Sık Sorulan Sorular | Asis Asansör",
  description: "Asansör bakımı, revizyon, arıza ve periyodik muayene hakkında en çok sorulan sorular ve yanıtları.",
  alternates: { canonical: "/sss" }
};

export default function FaqPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.a
      }
    }))
  };

  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <section className="page-hero">
        <div className="container">
          <div className="breadcrumb">Ana Sayfa / SSS</div>
          <h1>Sık sorulan sorular.</h1>
          <p className="lead">
            Asansör bakımı, revizyon, arıza ve periyodik muayene hakkında en çok merak edilen sorular ve yanıtları.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="faq-list">
            {faqItems.map((item, i) => (
              <Reveal key={i} className="faq-item">
                <h2 className="faq-question">{item.q}</h2>
                <p className="faq-answer">{item.a}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section alt">
        <div className="container">
          <Reveal>
            <div className="article-cta">
              <h2>Sorunuz burada yoksa bizi arayın.</h2>
              <p>Asansörünüzle ilgili teknik sorularınızı doğrudan ekibimize iletebilirsiniz. Ücretsiz keşif ve teklif için iletişime geçin.</p>
              <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", justifyContent: "center" }}>
                <Link className="btn btn-dark" href="/iletisim">İletişime Geç</Link>
                <Link className="btn btn-outline" href="/blog">Blog Yazıları</Link>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </main>
  );
}
