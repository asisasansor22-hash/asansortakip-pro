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

      {/* ── TAKİP PROGRAMI ── */}
      <section className="section tracker-section">
        <div className="container">
          <Reveal className="section-head">
            <div>
              <div className="eyebrow">Asis Asansör Takip Programı</div>
              <h2>Sahada teknisyen, ofiste yönetici — hepsi tek sistemde.</h2>
            </div>
            <p className="lead">Kendi geliştirdiğimiz takip yazılımı sayesinde saha ekibimiz ve yöneticilerimiz tüm iş akışını anlık olarak takip eder. Hiçbir bakım, arıza veya servis kaydı gözden kaçmaz.</p>
          </Reveal>
          <div className="grid-3 tracker-grid">
            <Reveal className="tracker-card" style={{ "--stagger": 0 }}>
              <div className="tracker-icon-wrap">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              </div>
              <h3>Teknisyen Takibi</h3>
              <p>Saha teknisyenlerimiz iş emirlerini program üzerinden alır, tamamlanan işleri dijital olarak raporlar. Hangi ekip nerede, anlık görülür.</p>
            </Reveal>
            <Reveal className="tracker-card" style={{ "--stagger": 1 }}>
              <div className="tracker-icon-wrap">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              </div>
              <h3>Bakım Takvimi</h3>
              <p>Her binanın periyodik bakım tarihleri sisteme girilir; otomatik hatırlatma ile hiçbir bakım seansı atlanmaz, gecikme oluşmaz.</p>
            </Reveal>
            <Reveal className="tracker-card" style={{ "--stagger": 2 }}>
              <div className="tracker-icon-wrap">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
              </div>
              <h3>Arıza ve Servis Kaydı</h3>
              <p>Her arıza bildirimi, müdahale süresi ve yapılan işlem sisteme kaydedilir. Bina yöneticisiyle paylaşılan raporlar şeffaflık sağlar.</p>
            </Reveal>
          </div>
          <Reveal className="tracker-banner">
            <div className="tracker-banner-left">
              <span className="tracker-live-dot" />
              <span>Sistem şu an aktif</span>
            </div>
            <p>Asis Asansör bünyesindeki tüm teknisyen ve yöneticiler bu yazılımı sahada ve ofiste günlük olarak kullanmaktadır.</p>
          </Reveal>
        </div>
      </section>

      {/* ── DİJİTAL SERVİS DENEYİMİ ── */}
      <section className="section">
        <div className="container split">
          <Reveal>
            <div className="eyebrow">Dijital Servis Deneyimi</div>
            <h2>Kurumsal, dijital ve fark yaratan bir servis yaklaşımı.</h2>
            <p className="lead">Her arıza bildirimi, bakım randevusu ve teknik rapor; kayıt altında, takip edilebilir ve şeffaf şekilde ilerler.</p>
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
