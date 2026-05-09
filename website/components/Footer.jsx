import Image from "next/image";
import Link from "next/link";
import { contact, navItems } from "@/lib/siteData";

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <Link className="brand" href="/" aria-label="Asis Asansör">
              <Image src="/asis-logo.webp" alt="Asis Asansör" width={380} height={109} />
            </Link>
            <p className="muted" style={{ marginTop: 16 }}>İstanbul Avrupa Yakası'nda bakım, montaj, revizyon ve arıza servisi.</p>
          </div>
          <div>
            <div className="footer-title">Sayfalar</div>
            <ul className="footer-list">
              {navItems.slice(1).map((item) => <li key={item.href}><Link href={item.href}>{item.label}</Link></li>)}
            </ul>
          </div>
          <div>
            <div className="footer-title">Hizmetler</div>
            <ul className="footer-list"><li>Asansör Bakım</li><li>Asansör Montaj</li><li>Asansör Revizyon</li><li>Asansör Onarım</li></ul>
          </div>
          <div>
            <div className="footer-title">İletişim</div>
            <ul className="footer-list">
              <li>{contact.address}</li>
              {contact.phones.map((phone, index) => <li key={phone}><a href={`tel:${contact.phoneLinks[index]}`}>{phone}</a></li>)}
              {contact.emails.map((email) => <li key={email}><a href={`mailto:${email}`}>{email}</a></li>)}
            </ul>
          </div>
        </div>
        <div className="footer-bottom"><span>© {new Date().getFullYear()} Asis Asansör. Tüm hakları saklıdır.</span><span>asisasansor.com</span></div>
      </div>
    </footer>
  );
}
