"use client";

import { useState } from "react";
import Link from "next/link";
import { reportWhatsAppConversion } from "@/components/GoogleAdsTracking";

export default function ContactForm() {
  const [kvkkOnay, setKvkkOnay] = useState(false);
  const [hata, setHata] = useState("");

  function submit(event) {
    event.preventDefault();
    if (!kvkkOnay) {
      setHata("Devam edebilmek için KVKK aydınlatma metnini onaylamanız gerekir.");
      return;
    }
    setHata("");
    const data = new FormData(event.currentTarget);
    const text = [
      "Merhaba Asis Asansör, web sitesi üzerinden iletişime geçiyorum.",
      `Ad Soyad: ${data.get("name") || ""}`,
      `Telefon: ${data.get("phone") || ""}`,
      `İlçe: ${data.get("district") || ""}`,
      `Hizmet: ${data.get("service") || ""}`,
      `Mesaj: ${data.get("message") || ""}`
    ].join("\n");
    reportWhatsAppConversion(`https://wa.me/905435070794?text=${encodeURIComponent(text)}`);
  }

  return (
    <form className="card form" onSubmit={submit}>
      <div><div className="card-kicker">Hızlı Form</div><h2>Bilgilerinizi bırakın, sizi arayalım.</h2></div>
      <div className="form-grid">
        <div className="field"><label htmlFor="name">Ad Soyad</label><input id="name" name="name" required autoComplete="name" /></div>
        <div className="field"><label htmlFor="phone">Telefon</label><input id="phone" name="phone" required autoComplete="tel" /></div>
        <div className="field"><label htmlFor="district">İlçe</label><input id="district" name="district" autoComplete="address-level2" /></div>
        <div className="field"><label htmlFor="service">Hizmet</label><select id="service" name="service"><option>Bakım</option><option>Montaj</option><option>Revizyon</option><option>Onarım</option><option>Diğer</option></select></div>
        <div className="field full"><label htmlFor="message">Mesaj</label><textarea id="message" name="message" placeholder="Bina adı, adres veya arıza bilgisini yazabilirsiniz." /></div>
      </div>
      <label className="kvkk-onay" style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 14, lineHeight: 1.5, marginTop: 4 }}>
        <input
          type="checkbox"
          checked={kvkkOnay}
          onChange={(e) => { setKvkkOnay(e.target.checked); if (e.target.checked) setHata(""); }}
          style={{ marginTop: 4, flexShrink: 0 }}
          required
        />
        <span>
          <Link href="/kvkk-aydinlatma-metni" target="_blank" rel="noopener noreferrer">KVKK Aydınlatma Metni</Link>&apos;ni okudum; iletişim formunda paylaştığım kişisel verilerimin teklif ve hizmet süreçlerinin yürütülmesi amacıyla işlenmesine açık rıza veriyorum.
        </span>
      </label>
      {hata && <div role="alert" style={{ color: "#dc2626", fontSize: 13, marginTop: -4 }}>{hata}</div>}
      <button className="btn btn-primary" type="submit">WhatsApp ile Gönder</button>
    </form>
  );
}
