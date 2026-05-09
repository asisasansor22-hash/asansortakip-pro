import Reveal from "@/components/Reveal";
import { districts } from "@/lib/siteData";

export const metadata = {
  title: "Hizmet Bölgeleri",
  description: "Asis Asansör İstanbul geneli hizmet bölgeleri — tüm ilçelerde asansör bakım ve servis."
};

export default function AreasPage() {
  return (
    <main>
      <section className="page-hero"><div className="container"><div className="breadcrumb">Ana Sayfa / Bölgeler</div><h1>İstanbul'un tüm ilçelerinde aktif servis.</h1><p className="lead">Bahçelievler merkezli ekiplerimizle İstanbul'un tüm ilçelerindeki apartman, site ve işletmelere bakım ve arıza desteği sağlıyoruz.</p></div></section>
      <section className="section"><div className="container split"><Reveal><div className="eyebrow">İlçeler</div><h2>Servis verdiğimiz bölgeler.</h2><p className="lead">Bölgeniz listede yoksa yine de arayın. Yakın lokasyonlarda program uygunluğuna göre destek sağlanır.</p></Reveal><div className="districts">{districts.map((district) => <Reveal as="span" className="pill" key={district}>{district}</Reveal>)}</div></div></section>
      <section className="section alt"><div className="container grid-3"><Reveal className="card"><h3>Apartmanlar</h3><p>Aylık bakım ve arıza müdahalesi için düzenli servis.</p></Reveal><Reveal className="card"><h3>Siteler</h3><p>Birden fazla asansöre sahip alanlarda planlı bakım yönetimi.</p></Reveal><Reveal className="card"><h3>İşletmeler</h3><p>Yük ve insan asansörlerinde kesintiyi azaltan servis yaklaşımı.</p></Reveal></div></section>
    </main>
  );
}
