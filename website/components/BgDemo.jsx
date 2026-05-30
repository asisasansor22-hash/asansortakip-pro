"use client";

import { useState } from "react";
import PaintedBackground from "@/components/PaintedBackground";

const VARIANTS = [
  { id: "marble", label: "1 · Suluboya" },
  { id: "gradient", label: "2 · Mesh Gradyan" },
  { id: "beams", label: "3 · Dikey Işık" },
  { id: "grid", label: "4 · Teknik Izgara" },
  { id: "dots", label: "5 · Nokta Alanı" }
];

export default function BgDemo() {
  const [variant, setVariant] = useState("gradient");

  return (
    <>
      <PaintedBackground variant={variant} />
      <div className="story-fallback-bg" aria-hidden="true" />

      <div className="bgdemo-bar" role="group" aria-label="Arka plan seçenekleri">
        {VARIANTS.map((v) => (
          <button
            key={v.id}
            type="button"
            className={`bgdemo-btn${variant === v.id ? " is-active" : ""}`}
            onClick={() => setVariant(v.id)}
          >
            {v.label}
          </button>
        ))}
      </div>

      <section className="story-chapter">
        <div className="container">
          <div className="story-kicker">Arka plan denemesi</div>
          <h2 className="story-title">
            Profesyonel asansör<br />
            bakım ve servis hizmetleri
          </h2>
          <p className="story-lead">
            Aşağıdaki butonlardan farklı arka planları deneyin. İmleci sayfada gezdirin;
            arka plan imlece tepki verir. Beğendiğiniz numarayı bana iletin.
          </p>
          <ul className="story-bullets">
            <li>Aylık periyodik kontrol</li>
            <li>7/24 arıza servisi</li>
            <li>Raporlu bakım</li>
          </ul>
        </div>
      </section>
    </>
  );
}
