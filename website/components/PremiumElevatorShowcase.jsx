"use client";

import { useEffect, useRef, useState } from "react";

const clamp = (value) => Math.min(1, Math.max(0, value));

function PremiumElevator({ progress = 0, compact = false }) {
  const p = clamp(progress);
  const piece = (x, y, scale = 1, opacity = 1) => ({
    transform: `translate3d(${x * p}px, ${y * p}px, 0) scale(${1 + (scale - 1) * p})`,
    opacity: 1 - (1 - opacity) * p,
  });
  const label = (x, y, opacity = 0.92) => ({
    transform: `translate3d(${x * p}px, ${y * p}px, 0)`,
    opacity: 1 - (1 - opacity) * p,
  });

  return (
    <div className={compact ? "premium-elevator compact" : "premium-elevator"}>
      <div className="render-glow" />
      <div className="blueprint-notes" aria-hidden="true">
        <span>MRL-630</span>
        <span>DOOR DRIVE</span>
        <span>GUIDE RAIL</span>
      </div>
      <div className="real-lift-photo photo-main" style={piece(0, 0, 1, 0.34)} />
      <div className="real-lift-photo photo-left" style={piece(-118, 14, 1.02, 0.96)} />
      <div className="real-lift-photo photo-right" style={piece(118, 14, 1.02, 0.96)} />
      <div className="real-lift-photo photo-top" style={piece(0, -126, 1.01, 0.92)} />
      <div className="real-lift-photo photo-bottom" style={piece(0, 122, 1.01, 0.9)} />
      <div className="glass-door glass-door-left" style={piece(-84, 0, 1, 0.78)} />
      <div className="glass-door glass-door-right" style={piece(84, 0, 1, 0.78)} />
      <div className="render-outline" />
      <div className="tech-tag tag-a" style={label(-92, -112)}>MAKİNE</div>
      <div className="tech-tag tag-b" style={label(122, -36)}>KAPI MOTORU</div>
      <div className="tech-tag tag-c" style={label(-124, 92)}>KABİN PANELİ</div>
      <div className="tech-tag tag-d" style={label(92, 126)}>RAY & HALAT</div>
    </div>
  );
}

export default function PremiumElevatorShowcase() {
  const sectionRef = useRef(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let frame = 0;

    const update = () => {
      const section = sectionRef.current;
      if (!section) return;
      const rect = section.getBoundingClientRect();
      const travel = Math.max(1, rect.height - window.innerHeight);
      setProgress(clamp(-rect.top / travel));
    };

    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <section className="premium-scroll" ref={sectionRef}>
      <div className="premium-sticky">
        <div className="container premium-layout">
          <div className="premium-copy">
            <div className="eyebrow">Teknik Tasarım</div>
            <h2>Asansör anatomisi, kurumsal bir mühendislik diliyle görünür olur.</h2>
            <p className="lead">
              Sayfayı aşağı kaydırdıkça kabin, kapı, ray, motor, halat ve kontrol sistemi
              ayrışır; ziyaretçiye modern, pahalı ve teknik bir marka algısı verir.
            </p>
            <div className="premium-metrics" aria-label="Teknik öne çıkanlar">
              <span><strong>17+</strong> yıl</span>
              <span><strong>7/24</strong> servis</span>
              <span><strong>CE</strong> standart</span>
            </div>
          </div>
          <div className="premium-stage" style={{ "--scroll-progress": progress }}>
            <div className="stage-grid" />
            <div className="scan-line" />
            <PremiumElevator progress={progress} />
          </div>
        </div>
      </div>
    </section>
  );
}

export function HeroElevatorRender() {
  return (
    <div className="hero-render-card" aria-label="Modern asansör renderı">
      <div className="hero-render-top">
        <span>ASIS LIFT SYSTEM</span>
        <strong>ONLINE</strong>
      </div>
      <PremiumElevator compact progress={0} />
    </div>
  );
}
