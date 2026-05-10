"use client";

import { reportWhatsAppConversion } from "@/components/GoogleAdsTracking";

export default function ContactForm() {
  function submit(event) {
    event.preventDefault();
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
      <button className="btn btn-primary" type="submit">WhatsApp ile Gönder</button>
    </form>
  );
}
