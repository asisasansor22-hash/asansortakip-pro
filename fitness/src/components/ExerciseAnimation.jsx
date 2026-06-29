import React, { useState, useEffect } from "react";
import Lottie from "lottie-react";
import { getLottie } from "../data/lottieMap";
import { exerciseFrames } from "../data/exerciseImages";

// Gerçek egzersiz fotoğrafı: başlangıç (0) ve bitiş (1) kareleri arasında
// yumuşak geçişle (cross-fade) döner -> gerçek hareket animasyonu.
function PhotoFlip({ frames, size, onError }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((p) => (p === 0 ? 1 : 0)), 1100);
    return () => clearInterval(t);
  }, []);
  const imgStyle = {
    position: "absolute", inset: 0, width: "100%", height: "100%",
    objectFit: "cover", borderRadius: 12, transition: "opacity .4s ease",
  };
  return (
    <div style={{ position: "relative", width: size, height: size, borderRadius: 12, overflow: "hidden" }}>
      <img src={frames[0]} alt="" loading="lazy" onError={onError}
        style={{ ...imgStyle, opacity: i === 0 ? 1 : 0 }} />
      <img src={frames[1]} alt="" loading="lazy" onError={onError}
        style={{ ...imgStyle, opacity: i === 1 ? 1 : 0 }} />
    </div>
  );
}

// Egzersiz animasyonu.
// 1) lottieMap.js'te profesyonel Lottie tanımlıysa onu oynatır (birebir kalite).
// 2) Yoksa kaslı (bodybuilder) stilize SVG karakterine düşer; eklemler index.css'teki
//    ".fig-<type>" keyframe'leriyle canlanır.
//
// "gear" (ekipman) verilirse harekete uygun ekipman çizilir:
//   barbell (halter) · dumbbell · machine (istasyon/kablo) · plate (plaka) · pullbar (tepe barı)
//
// Eklemler (viewBox 0 0 200 230):
//   omuz (100,78) · dirsek (100,104) · el (100,132)
//   kalça (100,130) · diz (100,168) · ayak bileği (100,205)

const LYING = { benchpress: true, crunch: true };
const ON_FLOOR = { pushup: true, plank: true };

const SKIN = "#b9c2cb";     // gri ten
const SHORTS = "#262b36";   // koyu şort
const LINE = "rgba(33,42,54,.40)"; // kas çizgisi / gölge
const METAL = "#3a4458";    // bar/sap
const PLATE = "#1b2230";    // ağırlık plakası
const CABLE = "#64748b";    // kablo/çerçeve

// Ekipman tipini "equip" metninden çıkar
function gearType(equip) {
  if (!equip) return null;
  if (/halter/i.test(equip)) return "barbell";
  if (/dumbbell/i.test(equip)) return "dumbbell";
  if (/makine/i.test(equip)) return "machine";
  if (/plaka/i.test(equip)) return "plate";
  if (/(^|[^a-z])bar($|[^a-z])/i.test(equip)) return "pullbar"; // "Bar" (barfiks vb.)
  return null;
}

// Elde tutulan ekipman (forearm grubu içinde, el ~ 100,134)
function InHandGear({ gt }) {
  if (gt === "dumbbell") {
    return (
      <g className="gear">
        <rect x="86" y="131.5" width="28" height="5" rx="2.5" fill={METAL} stroke="none" />
        <rect x="80" y="125" width="9" height="18" rx="2.5" fill={PLATE} stroke="none" />
        <rect x="111" y="125" width="9" height="18" rx="2.5" fill={PLATE} stroke="none" />
      </g>
    );
  }
  if (gt === "barbell") {
    return (
      <g className="gear">
        <rect x="50" y="132" width="100" height="4.5" rx="2" fill={METAL} stroke="none" />
        <rect x="52" y="123" width="7" height="22" rx="2" fill={PLATE} stroke="none" />
        <rect x="61" y="126" width="6" height="16" rx="2" fill={PLATE} stroke="none" />
        <rect x="141" y="123" width="7" height="22" rx="2" fill={PLATE} stroke="none" />
        <rect x="133" y="126" width="6" height="16" rx="2" fill={PLATE} stroke="none" />
      </g>
    );
  }
  if (gt === "plate") {
    return (
      <g className="gear">
        <circle cx="100" cy="134" r="13" fill={PLATE} stroke={CABLE} strokeWidth="2" />
        <circle cx="100" cy="134" r="4" fill="#0d1118" stroke="none" />
      </g>
    );
  }
  return null;
}

export default function ExerciseAnimation({ type = "idle", size = 180, color = SKIN, gear = null, exId = null }) {
  const t = type || "idle";
  const [imgFailed, setImgFailed] = useState(false);

  // 1) Profesyonel Lottie varsa onu kullan
  const lottie = getLottie(t);
  if (lottie) {
    return <Lottie animationData={lottie} loop autoplay style={{ width: size, height: size }} />;
  }

  // 2) Gerçek egzersiz fotoğrafı (varsa). Yüklenemezse SVG'ye düşer.
  const frames = !imgFailed && exId ? exerciseFrames(exId) : null;
  if (frames) {
    return <PhotoFlip frames={frames} size={size} onError={() => setImgFailed(true)} />;
  }

  // 3) Yedek: kaslı SVG karakter
  const lying = LYING[t];
  const floor = ON_FLOOR[t];
  const dx = -7; // arka uzuv ötelemesi (derinlik)

  const gt = gearType(gear);
  const shoulderBar = gt === "barbell" && t === "squat";          // squat -> bar omuzda
  const inHand = gt === "dumbbell" || gt === "plate" || (gt === "barbell" && t !== "squat");
  const station = gt === "machine";
  const pullbar = gt === "pullbar";

  return (
    <svg
      className={"exfig fig-" + t}
      viewBox="0 0 200 230"
      width={size}
      height={size}
      role="img"
      aria-label={"Egzersiz animasyonu: " + t}
    >
      {!lying && !floor && <line className="ground" x1="55" y1="208" x2="145" y2="208" />}
      {floor && <line className="ground" x1="30" y1="208" x2="170" y2="208" />}
      {lying && <rect className="bench" x="45" y="150" width="110" height="10" rx="3" />}

      {/* sabit ekipman (figürün arkasında) */}
      {pullbar && <rect x="48" y="12" width="104" height="6" rx="3" fill={METAL} stroke="none" />}
      {pullbar && <line x1="58" y1="6" x2="58" y2="15" stroke={CABLE} strokeWidth="3" />}
      {pullbar && <line x1="142" y1="6" x2="142" y2="15" stroke={CABLE} strokeWidth="3" />}
      {station && (
        <g>
          <rect x="42" y="8" width="116" height="6" rx="3" fill={CABLE} stroke="none" />
          <circle cx="100" cy="17" r="5" fill={CABLE} stroke="none" />
          <line x1="100" y1="18" x2="100" y2="58" stroke={CABLE} strokeWidth="2.5" />
          <rect x="86" y="56" width="28" height="6" rx="3" fill={METAL} stroke="none" />
        </g>
      )}

      <g className="figure" fill={color}>
        {/* ===== BACAK (kalçadan döner) ===== */}
        <g className="leg">
          <path className="part far" d={`M${85 + dx} 130 Q${80 + dx} 150 ${88 + dx} 170 L${110 + dx} 170 Q${116 + dx} 150 ${111 + dx} 130 Z`} />
          <path className="part" d="M89 130 Q83 150 90 170 L110 170 Q117 150 111 130 Z" />
          <path d="M100 138 Q104 152 100 168" fill="none" stroke={LINE} strokeWidth="1.6" />
          <path className="part" fill={SHORTS} d="M88 128 L112 128 L110 142 Q100 146 90 142 Z" />
          <g className="shin">
            <rect className="part far" x={92 + dx} y="166" width="15" height="42" rx="7" />
            <path className="part" d="M93 166 L107 166 Q110 182 104 206 L96 206 Q90 182 93 166 Z" />
            <ellipse cx="95" cy="182" rx="4" ry="9" fill={LINE} opacity="0.5" />
            <rect className="part" x="96" y="201" width="27" height="9" rx="4" />
          </g>
        </g>

        {/* ===== ÜST GÖVDE (kalçadan döner: gövde + baş + kol) ===== */}
        <g className="upperbody">
          <path className="part" d="M80 86 Q100 72 120 86 L110 132 Q100 137 90 132 Z" />
          <path d="M91 96 Q100 104 109 96" fill="none" stroke={LINE} strokeWidth="1.8" />
          <path d="M100 90 L100 100" fill="none" stroke={LINE} strokeWidth="1.4" />
          <path d="M100 104 L100 128" fill="none" stroke={LINE} strokeWidth="1.4" />
          <path d="M93 110 H107 M93 118 H107" fill="none" stroke={LINE} strokeWidth="1.2" />
          <path className="part" fill={SHORTS} d="M88 126 Q100 132 112 126 L112 138 Q100 143 88 138 Z" />

          <rect className="part" x="95" y="64" width="10" height="14" rx="4" />
          <circle className="part head" cx="100" cy="52" r="15" />
          <text x="100" y="50" fontSize="9" fontWeight="800" fill={LINE} textAnchor="middle">A</text>
          <path d="M94 56 l4 1 M106 56 l-4 1" stroke={LINE} strokeWidth="1.6" fill="none" strokeLinecap="round" />

          {/* squat -> omuz üstü bar */}
          {shoulderBar && (
            <g className="gear">
              <rect x="52" y="78" width="96" height="5" rx="2.5" fill={METAL} stroke="none" />
              <rect x="54" y="70" width="7" height="20" rx="2" fill={PLATE} stroke="none" />
              <rect x="139" y="70" width="7" height="20" rx="2" fill={PLATE} stroke="none" />
            </g>
          )}

          {/* kol (omuzdan döner) */}
          <g className="arm">
            <circle className="part" cx="100" cy="82" r="11" />
            <rect className="part far" x={93 + dx} y="80" width="15" height="28" rx="7" />
            <path className="part" d="M92 80 Q88 94 93 108 L107 108 Q112 94 108 80 Z" />
            <path d="M100 86 Q103 94 100 104" fill="none" stroke={LINE} strokeWidth="1.4" />
            <g className="forearm">
              <rect className="part far" x={94 + dx} y="104" width="13" height="30" rx="6" />
              <path className="part" d="M93 104 L107 104 Q108 120 104 134 L96 134 Q92 120 93 104 Z" />
              <circle className="part hand" cx="100" cy="134" r="7" />
              {inHand && <InHandGear gt={gt} />}
            </g>
          </g>
        </g>
      </g>
    </svg>
  );
}
