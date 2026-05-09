import Reveal from "@/components/Reveal";
import MotionGraphic from "@/components/MotionGraphic";

export const metadata = {
  title: "Hakkımızda",
  description: "Asis Asansör hakkında."
};

export default function AboutPage() {
  return (
    <main>
      <section className="page-hero"><div className="container"><div className="breadcrumb">Ana Sayfa / Hakkımızda</div><h1>Asansör sistemlerinde güvenilir servis yaklaşımı.</h1><p className="lead">Asis Asansör, İstanbul Avrupa Yakası'nda bina yönetimleri, apartmanlar ve işletmeler için sürdürülebilir asansör hizmeti sağlar.</p></div></section>
      <section className="section"><div className="container split"><Reveal><div className="eyebrow">Kurumsal Yaklaşım</div><h2>Sadece arızayı değil, sistemi takip ederiz.</h2><p className="lead">Asansör güvenliği düzenli kontrol, doğru kayıt ve zamanında müdahale ister. Bu nedenle bakım ve servis süreçlerini sürekli takip edilen bir sorumluluk olarak ele alırız.</p><ul className="check-list"><li>Can güvenliği ve yönetmelik uyumu</li><li>Şeffaf teklif ve açık iletişim</li><li>Kalıcı onarım ve kaliteli malzeme</li><li>Hızlı servis ve düzenli bilgilendirme</li></ul></Reveal><Reveal><MotionGraphic title="Bakım Operasyon Grafiği" /></Reveal></div></section>
      <section className="section alt"><div className="container grid-3">{["Deneyim", "Takip", "Güven"].map((title, index) => <Reveal className="card" key={title}><div className="card-kicker">0{index + 1}</div><h3>{title}</h3><p>{index === 0 ? "Farklı marka ve kapasitelerdeki asansör sistemlerinde saha tecrübesi." : index === 1 ? "Bakım, arıza ve parça değişim süreçlerinde kayıtlı ilerleme." : "Yapılan işin arkasında duran, ulaşılabilir servis anlayışı."}</p></Reveal>)}</div></section>
    </main>
  );
}
