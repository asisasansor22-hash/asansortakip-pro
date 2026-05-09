"use client";

import { useEffect, useRef, useState } from "react";

const clamp = (v, min = 0, max = 1) => Math.min(max, Math.max(min, v));

export default function PremiumElevatorShowcase() {
  const sectionRef = useRef(null);
  const videoRef   = useRef(null);
  const [progress, setProgress] = useState(0);
  const [ready, setReady]       = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const onLoaded = () => setReady(true);
    video.addEventListener("loadedmetadata", onLoaded);
    if (video.readyState >= 1) setReady(true);
    return () => video.removeEventListener("loadedmetadata", onLoaded);
  }, []);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      const el    = sectionRef.current;
      const video = videoRef.current;
      if (!el) return;
      const rect   = el.getBoundingClientRect();
      const travel = Math.max(1, rect.height - window.innerHeight);
      const p      = clamp(-rect.top / travel);
      setProgress(p);
      if (video && video.duration && ready) {
        // Only use first 80% of video duration — last portion has sparse keyframes
        // and causes browser freeze. Map scroll 0→0.80 to video 0→80% duration.
        const safeEnd = video.duration * 0.80;
        const videoP = Math.min(p / 0.80, 1);
        const target = videoP * safeEnd;
        // Skip tiny seeks — avoids stutter from async decode latency
        if (Math.abs(video.currentTime - target) > 0.08) {
          video.currentTime = target;
        }
      }
    };
    const onScroll = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => { cancelAnimationFrame(frame); window.removeEventListener("scroll", onScroll); window.removeEventListener("resize", onScroll); };
  }, [ready]);

  const textOpacity  = progress < 0.18 ? progress / 0.18 : progress > 0.72 ? 1 - (progress - 0.72) / 0.28 : 1;
  const textY        = progress < 0.18 ? 24 * (1 - progress / 0.18) : 0;

  return (
    <section className="video-showcase" ref={sectionRef}>
      <div className="video-showcase-sticky">
        {/* Video */}
        <video
          ref={videoRef}
          className="showcase-video"
          src="/elevator-cabin.mp4"
          preload="auto"
          muted
          playsInline
          aria-hidden="true"
        />

        {/* Gradyan örtü */}
        <div className="showcase-overlay" />

        {/* İçerik */}
        <div
          className="showcase-copy"
          style={{
            opacity: textOpacity,
            transform: `translateY(${textY}px)`,
          }}
        >
          <div className="eyebrow eyebrow-light">Teknik Tasarım</div>
          <h2 className="showcase-heading">
            7 yılın birikimi,<br />her projede görünür hale gelir.
          </h2>
          <p className="showcase-lead">
            Sahada kazanılan deneyim, titiz teknik kadromuz ve kayıtlı servis
            süreçlerimizle binanızın asansörünü güvenli, konforlu ve uzun ömürlü tutuyoruz.
          </p>
          <div className="showcase-metrics">
            <span><strong>7+</strong>Yıl deneyim</span>
            <span><strong>7/24</strong>Acil servis</span>
            <span><strong>CE</strong>Standart</span>
          </div>
        </div>

        {/* Scroll ilerleme çubuğu */}
        <div className="showcase-progress-bar">
          <div className="showcase-progress-fill" style={{ transform: `scaleX(${progress})` }} />
        </div>

        {/* Scroll ipucu */}
        {progress < 0.05 && (
          <div className="scroll-hint">
            <span>Keşfet</span>
            <div className="scroll-hint-arrow" />
          </div>
        )}
      </div>
    </section>
  );
}

export function HeroElevatorRender() {
  return (
    <div className="cabin-render-wrap" aria-label="Asis Asansör — kabin renderı">
      <div className="cr-ceiling">
        <div className="cr-ceiling-strip" />
        <div className="cr-ceiling-light" />
        <div className="cr-ceiling-light cr-ceiling-light-b" />
      </div>
      <div className="cr-scene">
        <div className="cr-wall cr-wall-left">
          <div className="cr-wall-panel" />
          <div className="cr-wall-panel" />
        </div>
        <div className="cr-doors">
          <div className="cr-door cr-door-left">
            <div className="cr-door-groove" />
            <div className="cr-door-groove" />
          </div>
          <div className="cr-door cr-door-right">
            <div className="cr-door-groove" />
            <div className="cr-door-groove" />
          </div>
          <div className="cr-door-seam" />
        </div>
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
      <div className="cr-floor">
        <div className="cr-floor-reflection" />
      </div>
      <div className="cr-sys-label">
        <span className="cr-sys-dot" />
        ASIS LIFT SYSTEM
      </div>
    </div>
  );
}
