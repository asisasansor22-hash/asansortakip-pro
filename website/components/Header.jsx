"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { contact, navItems } from "@/lib/siteData";

export default function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.classList.toggle("menu-open", open);
    return () => document.body.classList.remove("menu-open");
  }, [open]);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <>
      <div className="topbar">
        <div className="container">
          <div className="topbar-links">
            <a href={`tel:${contact.phoneLinks[0]}`}>{contact.phones[0]}</a>
            <a href={`tel:${contact.phoneLinks[1]}`}>{contact.phones[1]}</a>
            <span>Yenibosna / İstanbul</span>
          </div>
          <div className="topbar-status"><span className="status-dot" />7/24 servis hattı açık</div>
        </div>
      </div>
      <header className="site-header">
        <div className="container header-main">
          <Link className="brand" href="/" aria-label="Asis Asansör ana sayfa">
            <Image src="/asis-logo.webp" alt="Asis Asansör" width={380} height={109} priority />
          </Link>
          <nav className="nav" aria-label="Ana menü">
            {navItems.map((item) => {
              const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
              return (
                <Link key={item.href} className={active ? "is-active" : ""} href={item.href} aria-current={active ? "page" : undefined}>
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="header-actions">
            <a className="btn btn-outline" href={`https://wa.me/${contact.phoneLinks[0].replace("+", "")}`}>WhatsApp</a>
            <a className="btn btn-dark" href={`tel:${contact.phoneLinks[0]}`}>Hemen Ara</a>
            <button className="menu-toggle" type="button" aria-label="Menüyü aç" aria-expanded={open} onClick={() => setOpen((value) => !value)}>
              <span /><span /><span />
            </button>
          </div>
        </div>
      </header>
    </>
  );
}
