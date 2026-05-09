"use client";

import { useEffect, useRef, useState } from "react";

const clamp = (v, min = 0, max = 1) => Math.min(max, Math.max(min, v));
const lerp  = (a, b, t) => a + (b - a) * t;

// Faz 1 (0→0.38): kapılar açılır, kabin içi görünür
// Faz 2 (0.38→1):  parçalar ayrışır (exploded view)
function phases(progress) {
  const p       = clamp(progress);
  const open    = clamp(p / 0.38);
  const explode = clamp((p - 0.38) / 0.62);
  return { open, explode };
}

function PremiumElevator({ progress = 0 }) {
  const { open, explode } = phases(progress);

  const doorLeft = {
    transform: `translateX(${lerp(0, -84, open) + lerp(0, -42, explode)}px)`,
    opacity: clamp(1 - explode * 0.72),
    animation: "none",
  };
  const doorRight = {
    transform: `translateX(${lerp(0, 84, open) + lerp(0, 42, explode)}px)`,
    opacity: clamp(1 - explode * 0.72),
    animation: "none",
  };
  const mainPhoto = {
    opacity: lerp(0.06, 1, open) * lerp(1, 0.28, explode),
  };
  const piece = (x, y, scl = 1, baseOpacity = 1) => ({
    transform: `translate3d(${x * explode}px, ${y * explode}px, 0) scale(${lerp(1, scl, explode)})`,
    opacity: lerp(0, baseOpacity, explode),
  });
  const label = (x, y) => ({
    transform: `translate3d(${x * explode}px, ${y * explode}px, 0)`,
    opacity: lerp(0, 0.92, explode),
  });

  return (
    <div className="premium-elevator">
      <div className="render-glow" />
      <div className="blueprint-notes" aria-hidden="true">
        <span>MRL-630</span>
        <span>DOOR DRIVE</span>
        <span>GUIDE RAIL</span>
      </div>
      <div className="real-lift-photo photo-main"   style={mainPhoto} />
      <div className="real-lift-photo photo-left"   style={piece(-118, 14,  1.02, 0.96)} />
      <div className="real-lift-photo photo-right"  style={piece( 118, 14,  1.02, 0.96)} />
      <div className="real-lift-photo photo-top"    style={piece(   0,-126, 1.01, 0.92)} />
      <div className="real-lift-photo photo-bottom" style={piece(   0, 122, 1.01, 0.90)} />
      <div className="glass-door glass-door-left"  style={doorLeft}  />
      <div className="glass-door glass-door-right" style={doorRight} />
      <div className="render-outline" />
      <div className="tech-tag tag-a" style={label(-92,-112)}>MAKİNE</div>
      <div className="tech-tag tag-b" style={label(122, -36)}>KAPI MOTORU</div>
      <div className="tech-tag tag-c" style={label(-124, 92)}>KABİN PANELİ</div>
      <div className="tech-tag tag-d" style={label( 92, 126)}>RAY & HALAT</div>
    </div>
  );
}

export default function PremiumElevatorShowcase() {
  const sectionRef = useRef(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      const el = sectionRef.current;
      if (!el) return;
      const rect   = el.getBoundingClientRect();
      const travel = Math.max(1, rect.height - window.innerHeight);
      setProgress(clamp(-rect.top / travel));
    };
    const onScroll = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => { cancelAnimationFrame(frame); window.removeEventListener("scroll", onScroll); window.removeEventListener("resize", onScroll); };
  }, []);

  const { open, explode } = phases(progress);
  const stageLabel =
    open    < 0.15 ? "Kapılar kapalı"           :
    open    < 0.85 ? "Kabin açılıyor…"           :
    explode < 0.15 ? "Kabin içi"                 :
    explode < 0.6  ? "Bileşenler ayrışıyor…"     :
                     "Teknik görünüm";

  return (
    <section className="premium-scroll" ref={sectionRef}>
      <div className="premium-sticky">
        <div className="container premium-layout">
          <div className="premium-copy">
            <div className="eyebrow">Teknik Tasarım</div>
            <h2>17 yılın birikimi, her projede görünür hale gelir.</h2>
            <p className="lead">
              Sahada kazanılan deneyim, titiz teknik kadromuz ve kayıtlı servis
              süreçlerimizle binanızın asansörünü güvenli, konforlu ve uzun ömürlü tutuyoruz.
            </p>
            <div className="premium-metrics" aria-label="Kurumsal göstergeler">
              <span><strong>17+</strong>Yıl deneyim</span>
              <span><strong>7/24</strong>Acil servis</span>
              <span><strong>CE</strong>Standart</span>
            </div>
          </div>

          <div className="premium-stage" style={{ "--scroll-progress": progress }}>
            <div className="stage-grid" />
            <div className="scan-line" />
            <PremiumElevator progress={progress} />
            <div className="stage-status-label">{stageLabel}</div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── Hero panelindeki yeni kabin renderı ── */
export function HeroElevatorRender() {
  return (
    <div className="cabin-render-wrap" aria-label="Asis Asansör — kabin renderı">
      {/* Tavan */}
      <div className="cr-ceiling">
        <div className="cr-ceiling-strip" />
        <div className="cr-ceiling-light" />
        <div className="cr-ceiling-light cr-ceiling-light-b" />
      </div>

      {/* Sahne */}
      <div className="cr-scene">
        {/* Sol duvar */}
        <div className="cr-wall cr-wall-left">
          <div className="cr-wall-panel" />
          <div className="cr-wall-panel" />
        </div>

        {/* Kapılar */}
        <div className="cr-doors">
          <div className="cr-door cr-door-left">
            <div className="cr-door-groove" />
            <div className="cr-door-groove" />
          </div>
          <div className="cr-door cr-door-right">
            <div className="cr-door-groove" />
            <div className="cr-door-groove" />
          </div>
          {/* Kapı arası çizgi */}
          <div className="cr-door-seam" />
        </div>

        {/* Sağ duvar + gösterge paneli */}
        <div className="cr-wall cr-wall-right">
          <div className="cr-indicator">
            <div className="cr-indicator-screen">
              <span className="cr-floor-num">5</span>
              <span className="cr-floor-arrow">▲</span>
            </div>
            <div className="cr-btn-col">
              <div className="cr-btn cr-btn-up" />
              <div className="cr-btn cr-btn-dn" />
            </div>
          </div>
        </div>
      </div>

      {/* Zemin */}
      <div className="cr-floor">
        <div className="cr-floor-reflection" />
      </div>

      {/* Sistem etiketi */}
      <div className="cr-sys-label">
        <span className="cr-sys-dot" />
        ASIS LIFT SYSTEM
      </div>
    </div>
  );
}
