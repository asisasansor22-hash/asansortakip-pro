import Link from "next/link";
import Counter from "@/components/Counter";
import MotionGraphic from "@/components/MotionGraphic";
import PremiumElevatorShowcase, { HeroElevatorRender } from "@/components/PremiumElevatorShowcase";
import Reveal from "@/components/Reveal";
import { services, testimonials } from "@/lib/siteData";

export default function HomePage() {
  return (
    <main>
      {/* ── HERO ── */}
      <section className="hero">
        <div className="hero-orb hero-orb-1" aria-hidden="true" />
        <div className="hero-orb hero-orb-2" aria-hidden="true" />
        <div className="container">
          <div className="hero-copy">
            <div className="eyebrow">İstanbul Avrupa Yakası · 17 Yıllık Deneyim</div>
            <h1 className="hero-heading">
              Asansörde güven,<br />
              <span className="heading-gradient">bakımda disiplin.</span>
            </h1>
            <p className="lead">Asis Asansör; bakım, montaj, revizyon ve arıza servisinde binanızın ihtiyacını tek elden, kayıtlı ve garantili şekilde yönetir.</p>
            <div className="hero-trust-row">
              <span className="trust-badge"><span className="trust-dot" />7/24 Servis</span>
              <span className="trust-badge"><span className="trust-dot" />Yazılı Garanti</span>
              <span className="trust-badge"><span className="trust-dot" />Raporlu Bakım</span>
            </div>
            <div className="hero-actions">
              <a className="btn btn-primary" href="tel:+905435070794">Servis Çağır</a>
              <Link className="btn btn-outline" href="/hizmetler">Hizmetleri İncele</Link>
            </div>
          </div>
          <aside className="hero-panel" aria-label="Öne çıkan hizmetler">
            <div className="hero-panel-title">Hızlı Erişim</div>
            <HeroElevatorRender />
            <ul className="hero-service-list">
              {services.map((service) => (
                <li key={service.id}><Link href={`/hizmetler#${service.id}`}>{service.title.replace("Asansör ", "")}<span>→</span></Link></li>
              ))}
            </ul>
          </aside>
        </div>
      </section>

      {/* ── KURUMSAL GÜVEN ŞERİDİ ── */}
      <div className="trust-strip">
        <div className="container trust-strip-inner">
          <Reveal className="trust-item"><strong>17+</strong><span>Yıl sahada</span></Reveal>
          <Reveal className="trust-item"><strong>480+</strong><span>Aktif sözleşme</span></Reveal>
          <Reveal className="trust-item"><strong>19</strong><span>Avrupa Yakası ilçesi</span></Reveal>
          <Reveal className="trust-item"><strong>7/24</strong><span>Acil müdahale</span></Reveal>
          <Reveal className="trust-item"><strong>%100</strong><span>Yazılı garanti</span></Reveal>
        </div>
      </div>

      {/* ── PREMIUM SHOWCASE ── */}
      <PremiumElevatorShowcase />

      {/* ── HİZMETLER ── */}
      <section className="section">
        <div className="container">
          <Reveal className="section-head">
            <div>
              <div className="eyebrow">Hizmetler</div>
              <h2>Asansörünüzün her aşaması için uzman ekip.</h2>
            </div>
            <p className="lead">Bakım sözleşmesinden komple revizyona kadar tüm süreçleri şeffaf teklif, saha kontrolü ve düzenli raporlama ile yürütüyoruz.</p>
          </Reveal>
          <div className="grid-4">
            {services.map((service, i) => (
              <Reveal as={Link} href={`/hizmetler#${service.id}`} className="card" key={service.id} style={{ "--stagger": i }}>
                <div className="service-card-top"><span className="service-num">{service.num}</span><span>↗</span></div>
                <h3>{service.title}</h3>
                <p>{service.short}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── NEDEN BİZ ── */}
      <section className="section alt why-us">
        <div className="container">
          <Reveal className="section-head">
            <div>
              <div className="eyebrow">Neden Asis Asansör?</div>
              <h2>Kurumsal güvenilirlik, saha hızı.</h2>
            </div>
            <p className="lead">17 yıllık tecrübeyle sektörde güven inşa ettik. Her müdahalede kayıt tutuyoruz, her işte sorumluluk alıyoruz.</p>
          </Reveal>
          <div className="grid-3">
            {[
              { icon: "📋", title: "Raporlu Her Bakım", desc: "Her bakım sonrasında yazılı rapor teslim edilir; ne kontrol edildiği, ne değiştirildiği kayıt altına alınır." },
              { icon: "🛡️", title: "Yazılı Garanti", desc: "Yapılan tüm işlemler garantilidir. Parça değişiminden montaja kadar her hizmet belgelidir." },
              { icon: "⚡", title: "Acil Müdahale", desc: "Arıza anında 7/24 servis hattımız aktiftir. Ekibimiz kısa sürede sahadadır." },
              { icon: "🗺️", title: "Geniş Hizmet Ağı", desc: "İstanbul Avrupa Yakası'nın 19 ilçesinde aktif saha ekibimizle hizmet veriyoruz." },
              { icon: "📞", title: "Şeffaf İletişim", desc: "Teklif aşamasından teslimata kadar her adımı sizinle paylaşıyoruz. Sürpriz maliyet yok." },
              { icon: "🔧", title: "Yetkili Teknik Kadro", desc: "Tüm teknisyenlerimiz sektörde deneyimli ve sürekli eğitim alan profesyonellerden oluşur." }
            ].map((item, i) => (
              <Reveal className="why-card" key={item.title} style={{ "--stagger": i }}>
                <div className="why-icon">{item.icon}</div>
                <h3>{item.title}</h3>
                <p>{item.desc}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── GERÇEK PROJE GÖRSELI ── */}
      <section className="section project-photo-section">
        <div className="container">
          <Reveal className="section-head">
            <div>
              <div className="eyebrow">Gerçek Projeler</div>
              <h2>Sahadan gelen kalite.</h2>
            </div>
            <p className="lead">Montajını yaptığımız her kabin, titiz işçilik ve seçkin malzeme anlayışının yansımasıdır. Görseller, tamamlanan gerçek projelerimizden.</p>
          </Reveal>
          <Reveal className="project-photo-wrap">
            <img
              src="/elevator-real.jpg"
              alt="Asis Asansör tarafından monte edilen cam ve paslanmaz çelik kabin"
              className="project-photo"
              loading="lazy"
            />
            <div className="project-photo-badge">
              <span className="project-photo-badge-dot" />
              Tamamlanan Proje
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── DİJİTAL SERVİS DENEYİMİ ── */}
      <section className="section">
        <div className="container split">
          <Reveal>
            <div className="eyebrow">Dijital Servis Deneyimi</div>
            <h2>Kurumsal, dijital ve fark yaratan bir servis yaklaşımı.</h2>
            <p className="lead">Ziyaretçilerinize sektörden ayrışan, dijital ve kurumsal bir deneyim sunuyoruz. Her arıza bildirimi, bakım randevusu ve teknik rapor; kayıt altında, takip edilebilir ve şeffaf şekilde ilerler.</p>
          </Reveal>
          <Reveal className="reveal-right">
            <MotionGraphic />
          </Reveal>
        </div>
      </section>

      {/* ── REFERANSLAR ── */}
      <section className="section alt testimonials-section">
        <div className="container">
          <Reveal className="section-head">
            <div>
              <div className="eyebrow">Müşteri Görüşleri</div>
              <h2>Binlerce bina yöneticisinin tercihi.</h2>
            </div>
            <p className="lead">Yıllar içinde inşa ettiğimiz güven, müşterilerimizin deneyimleriyle konuşuyor.</p>
          </Reveal>
          <div className="grid-2 testimonials-grid">
            {testimonials.map((t, i) => (
              <Reveal className="testimonial-card" key={t.name} style={{ "--stagger": i }}>
                <div className="testimonial-stars">{"★".repeat(t.stars)}</div>
                <p className="testimonial-text">"{t.text}"</p>
                <div className="testimonial-author">
                  <div className="testimonial-avatar">{t.name.charAt(0)}</div>
                  <div>
                    <strong>{t.name}</strong>
                    <span>{t.role} · {t.location}</span>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── ÇALIŞMA ŞEKLİ ── */}
      <section className="section">
        <div className="container split">
          <Reveal>
            <div className="eyebrow">Çalışma Şekli</div>
            <h2>Arızadan çözüme kontrollü süreç.</h2>
            <p className="lead">Çağrınız alındıktan sonra arıza türü netleştirilir, saha ekibi yönlendirilir, işlem raporlanır ve yapılan iş garanti altına alınır.</p>
          </Reveal>
          <Reveal className="card reveal-right">
            <ul className="check-list">
              <li>Telefon veya WhatsApp ile hızlı kayıt</li>
              <li>Yerinde teknik tespit ve açık bilgilendirme</li>
              <li>Onay sonrası bakım, onarım veya parça değişimi</li>
              <li>Yapılan işin raporlanması ve takibi</li>
            </ul>
          </Reveal>
        </div>
      </section>

      {/* ── CTA BAND ── */}
      <section className="cta-band">
        <div className="container cta-band-inner">
          <Reveal>
            <h2>Servis veya teklif için hemen ulaşın.</h2>
            <p className="cta-sub">Avrupa Yakası'nın 19 ilçesinde 7/24 hizmetinizdeyiz.</p>
          </Reveal>
          <div className="cta-actions">
            <a className="btn btn-primary" href="tel:+905435070794">Hemen Ara</a>
            <Link className="btn btn-dark" href="/iletisim">İletişim Bilgileri</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
