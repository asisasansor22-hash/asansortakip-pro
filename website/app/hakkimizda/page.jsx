import Reveal from "@/components/Reveal";

export const metadata = {
  title: "Hakkımızda",
  description: "Asis Asansör hakkında — 17 yıllık saha deneyimi, İstanbul geneline hizmet."
};

export default function AboutPage() {
  return (
    <main>
      <section className="page-hero">
        <div className="container">
          <div className="breadcrumb">Ana Sayfa / Hakkımızda</div>
          <h1>Asansör sistemlerinde güvenilir servis yaklaşımı.</h1>
          <p className="lead">Asis Asansör; ofisi Yenibosna'da, hizmet alanı İstanbul genelinde olan, bina yönetimleri ve sakinleri için güvenilir asansör servis firmasıdır.</p>
        </div>
      </section>

      <section className="section">
        <div className="container split">
          <Reveal>
            <div className="eyebrow">Kurumsal Yaklaşım</div>
            <h2>Sadece arızayı değil, sistemi takip ederiz.</h2>
            <p className="lead">Asansör güvenliği düzenli kontrol, doğru kayıt ve zamanında müdahale ister. Bu nedenle bakım ve servis süreçlerini sürekli takip edilen bir sorumluluk olarak ele alırız.</p>
            <ul className="check-list">
              <li>Can güvenliği ve yönetmelik uyumu</li>
              <li>Şeffaf teklif ve açık iletişim</li>
              <li>Kalıcı onarım ve kaliteli malzeme</li>
              <li>Hızlı servis ve düzenli bilgilendirme</li>
            </ul>
          </Reveal>
          <Reveal>
            <div className="about-stats-grid">
              <div className="about-stat-card">
                <strong>2007</strong>
                <span>Kuruluş yılı</span>
              </div>
              <div className="about-stat-card">
                <strong>17+</strong>
                <span>Yıl saha deneyimi</span>
              </div>
              <div className="about-stat-card">
                <strong>480+</strong>
                <span>Aktif bakım sözleşmesi</span>
              </div>
              <div className="about-stat-card">
                <strong>İstanbul</strong>
                <span>Geneline hizmet</span>
              </div>
              <div className="about-stat-card about-stat-wide">
                <strong>CE Standart</strong>
                <span>Tüm hizmetler yönetmeliklere uygun yürütülür</span>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="section alt">
        <div className="container grid-3">
          {[
            { num: "01", title: "Deneyim", desc: "Farklı marka ve kapasitelerdeki asansör sistemlerinde 17 yıllık saha tecrübesi." },
            { num: "02", title: "Takip", desc: "Tüm bakım, arıza ve parça değişim süreçleri dijital sistemimizle kayıt altında ilerler." },
            { num: "03", title: "Güven", desc: "Yapılan her işin arkında durur, yazılı garanti ve raporla teslim ederiz." }
          ].map((item) => (
            <Reveal className="card" key={item.title}>
              <div className="card-kicker">{item.num}</div>
              <h3>{item.title}</h3>
              <p>{item.desc}</p>
            </Reveal>
          ))}
        </div>
      </section>
    </main>
  );
}
