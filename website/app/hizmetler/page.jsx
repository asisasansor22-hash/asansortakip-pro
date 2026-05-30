import Reveal from "@/components/Reveal";
import MotionGraphic from "@/components/MotionGraphic";
import { services } from "@/lib/siteData";

export const metadata = {
  title: "Hizmetler",
  description: "Asis Asansör bakım, montaj, revizyon ve arıza onarım hizmetleri."
};

export default function ServicesPage() {
  return (
    <main>
      <section className="page-hero"><div className="container"><div className="breadcrumb">Ana Sayfa / Hizmetler</div><h1>Bakım, montaj, revizyon ve acil servis.</h1><p className="lead">Asansörünüzün teknik ömrünü, güvenliğini ve konforunu korumak için düzenli, belgeli ve uzman servis süreçleri.</p></div></section>
      <section className="section">
        <div className="container grid-2">
          {services.map((service) => (
            <Reveal as="article" className="card" id={service.id} key={service.id}>
              <div className="card-kicker">{service.num} / Hizmet</div>
              <h2>{service.title}</h2>
              <p>{service.desc}</p>
              <ul className="check-list">{service.bullets.map((item) => <li key={item}>{item}</li>)}</ul>
            </Reveal>
          ))}
        </div>
      </section>
      <section className="section alt"><div className="container split"><Reveal><div className="eyebrow">Teklif Süreci</div><h2>Önce keşif, sonra net teklif.</h2><p className="lead">Binanızın teknik durumu görülmeden ezbere fiyat verilmez. İhtiyaç netleşir, kapsam yazılır, süreç açık şekilde paylaşılır.</p></Reveal><Reveal className="card"><ul className="plain-list"><li>Adres ve hizmet bilgisi alınır.</li><li>Uygun ekip yönlendirilir.</li><li>Teknik tespit yapılır.</li><li>Onay sonrası işlem başlatılır.</li></ul></Reveal></div></section>
      <section className="section"><div className="container split"><Reveal><MotionGraphic title="Servis Döngüsü" /></Reveal><Reveal><div className="eyebrow">Dijital Servis Akışı</div><h2>Bakım takvimi ve arıza akışı tek merkezden ilerler.</h2><p className="lead">Bakım ve arıza müdahalesi tamamlandığında, sahada kullandığımız ve Asis Asansör'e özel geliştirdiğimiz <strong>Asansör Takip Pro</strong> yazılımı aracılığıyla bina yöneticisine otomatik bildirim mesajı gönderilir. Yapılan işlem, tarih ve bir sonraki bakım bilgisi anında iletilir.</p></Reveal></div></section>
    </main>
  );
}
