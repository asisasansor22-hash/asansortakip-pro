import React from "react";

// Eklemli (articulated) SVG iskelet figürü.
// Her uzuv bir <g> grubudur ve sabit bir eklem noktası (transform-origin) etrafında döner.
// Hareketin kendisi index.css içindeki ".fig-<type>" keyframe'leriyle tanımlanır.
//
// İskelet koordinatları (viewBox 0 0 200 230):
//   omuz (100,78) · dirsek (100,104) · el (100,130)
//   kalça (100,130) · diz (100,168) · ayak bileği (100,205)
//
// type: benchpress | pushup | squat | curl | crunch | jumpingjack |
//       lunge | shoulderpress | deadlift | calfraise | pullup | plank | idle

const LYING = { benchpress: true, crunch: true };
const ON_FLOOR = { pushup: true, plank: true };

export default function ExerciseAnimation({ type = "idle", size = 180, color = "#22d3ee" }) {
  const t = type || "idle";
  const lying = LYING[t];
  const floor = ON_FLOOR[t];

  return (
    <svg
      className={"exfig fig-" + t}
      viewBox="0 0 200 230"
      width={size}
      height={size}
      role="img"
      aria-label={"Egzersiz animasyonu: " + t}
    >
      {/* zemin / sehpa */}
      {!lying && !floor && <line className="ground" x1="55" y1="208" x2="145" y2="208" />}
      {floor && <line className="ground" x1="30" y1="208" x2="170" y2="208" />}
      {lying && <rect className="bench" x="45" y="150" width="110" height="10" rx="3" />}

      <g className="figure" stroke={color}>
        {/* BACAK (kalçadan döner) */}
        <g className="leg">
          <line className="bone thigh" x1="100" y1="130" x2="100" y2="168" />
          <g className="shin">
            <line className="bone" x1="100" y1="168" x2="100" y2="205" />
            <line className="bone foot" x1="100" y1="205" x2="120" y2="205" />
          </g>
        </g>

        {/* ÜST GÖVDE (kalçadan döner: gövde + baş + kol) */}
        <g className="upperbody">
          <line className="bone torso" x1="100" y1="130" x2="100" y2="78" />
          <circle className="head" cx="100" cy="62" r="14" fill={color} stroke="none" />

          <g className="arm">
            <line className="bone" x1="100" y1="78" x2="100" y2="104" />
            <g className="forearm">
              <line className="bone" x1="100" y1="104" x2="100" y2="130" />
              <circle className="hand" cx="100" cy="132" r="4" fill={color} stroke="none" />
            </g>
          </g>
        </g>
      </g>
    </svg>
  );
}
