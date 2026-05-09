import ContactForm from "@/components/ContactForm";
import Reveal from "@/components/Reveal";
import { contact } from "@/lib/siteData";

export const metadata = {
  title: "İletişim",
  description: "Asis Asansör iletişim, adres ve telefon bilgileri."
};

export default function ContactPage() {
  const mapSrc = `https://www.google.com/maps?q=${encodeURIComponent(contact.mapQuery)}&output=embed`;

  return (
    <main>
      <section className="page-hero"><div className="container"><div className="breadcrumb">Ana Sayfa / İletişim</div><h1>Servis, teklif ve bakım talebi için ulaşın.</h1><p className="lead">Asis Asansör ofisi Yenibosna'dadır. Telefon, WhatsApp veya form üzerinden hızlıca iletişime geçebilirsiniz.</p></div></section>
      <section className="section"><div className="container"><div className="contact-strip">{contact.phones.map((phone, index) => <Reveal as="a" className="contact-item" href={`tel:${contact.phoneLinks[index]}`} key={phone}><span>{index === 0 ? "Servis Hattı" : index === 1 ? "İkinci Hat" : "Sabit Telefon"}</span><strong>{phone}</strong></Reveal>)}{contact.emails.map((email) => <Reveal as="a" className="contact-item" href={`mailto:${email}`} key={email}><span>E-posta</span><strong>{email}</strong></Reveal>)}<Reveal className="contact-item"><span>Adres</span><strong>{contact.address}</strong></Reveal></div></div></section>
      <section className="section alt"><div className="container split"><ContactForm /><Reveal><div className="eyebrow">Ofis</div><h2>Zafer Mahallesi, Yenibosna.</h2><p className="lead">{contact.address}</p><iframe className="map-frame" title="Asis Asansör konum haritası" loading="lazy" src={mapSrc} /></Reveal></div></section>
    </main>
  );
}
