"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { paintState } from "@/lib/paintStore";

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const fragHeader = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform float uTime;
  uniform vec2 uMouse;
  uniform vec2 uRes;
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  uniform vec3 uAccent;

  float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }
  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    float a = hash(i), b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0)), d = hash(i + vec2(1.0, 1.0));
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
  }
  float fbm(vec2 p) {
    float v = 0.0, a = 0.5;
    for (int i = 0; i < 5; i++) {
      v += a * noise(p);
      p = p * 2.0 + vec2(1.7, 9.2);
      a *= 0.5;
    }
    return v;
  }
  // Triangular-PDF dithering — kills 8-bit gradient banding for a perfectly
  // smooth, bandless look across the whole canvas.
  vec3 dither(vec3 col, vec2 uv) {
    float r1 = hash(uv * uRes + uTime);
    float r2 = hash(uv * uRes - uTime * 1.37 + 17.0);
    float tri = (r1 + r2 - 1.0) / 255.0;
    return col + tri;
  }
`;

// Each variant is a self-contained main(); they share fragHeader + uniforms.
// All variants are tuned for a LIGHT/airy look: patterns appear as soft
// brand-tinted marks via mix() (no additive blow-out, no dark vignette).
const mains = {
  // Domain-warped fbm marble (soft watercolour)
  marble: /* glsl */ `
    void main() {
      vec2 aspect = vec2(uRes.x / uRes.y, 1.0);
      vec2 p = vUv * aspect * 1.6;
      float t = uTime * 0.06;
      vec2 q = vec2(fbm(p + t), fbm(p + vec2(5.2, 1.3) - t));
      vec2 r = vec2(
        fbm(p + 3.0 * q + vec2(1.7, 9.2) + 0.4 * t),
        fbm(p + 3.0 * q + vec2(8.3, 2.8) - 0.4 * t)
      );
      float f = fbm(p + 3.0 * r);
      vec3 col = mix(uColorA, uColorB, smoothstep(0.0, 1.0, clamp(f * 1.2, 0.0, 1.0)));
      col = mix(col, uAccent, smoothstep(0.0, 0.4, (r.x * r.y) * 0.9));
      vec2 m = uMouse * aspect;
      col = mix(col, uAccent, smoothstep(0.5, 0.0, distance(vUv * aspect, m)) * 0.14);
      // Soft depth vignette — barely-there, keeps the airy/light feel.
      float vig = 1.0 - 0.06 * dot(vUv - 0.5, vUv - 0.5) * 4.0;
      col *= clamp(vig, 0.0, 1.0);
      col = dither(col, vUv);
      gl_FragColor = vec4(col, 1.0);
    }
  `,
  // Aurora — belirgin, akışkan ışık kurdeleleri + iki tonlu renk havuzları.
  // Hafif/kurumsal kalır ama mermerden çok daha zengin ve gözle görülür.
  aurora: /* glsl */ `
    void main() {
      vec2 aspect = vec2(uRes.x / uRes.y, 1.0);
      vec2 uv = vUv * aspect;
      float t = uTime * 0.085;

      // Organik hareket için domain-warp akış alanı.
      vec2 p = vUv * aspect * 1.4;
      vec2 q = vec2(fbm(p + vec2(0.0, t)), fbm(p + vec2(5.2, -t)));
      float flow = fbm(p + 1.8 * q + t * 0.5);
      float flow2 = fbm(p * 1.6 + 2.2 * q - t * 0.4);

      // Kurumsal ton için accent'e çok yakın, hafif serin bir ikinci mavi.
      vec3 accent2 = mix(uAccent, vec3(uAccent.r * 0.6, uAccent.g, uAccent.b), 0.6);

      // Taban degrade — sakin, havadar.
      vec3 col = mix(uColorA, uColorB, smoothstep(0.0, 1.0, vUv.y * 0.6 + flow * 0.4));

      // Yavaşça dolaşan renk havuzları — ölçülü ağırlıklar.
      vec2 c1 = vec2(0.28 + 0.15 * sin(t * 0.7), 0.34 + 0.12 * cos(t * 0.6)) * aspect;
      vec2 c2 = vec2(0.74 + 0.14 * sin(t * 0.5 + 2.0), 0.32 + 0.14 * cos(t * 0.8 + 1.0)) * aspect;
      vec2 c3 = vec2(0.55 + 0.17 * sin(t * 0.45 + 4.0), 0.76 + 0.12 * cos(t * 0.55 + 3.0)) * aspect;
      float w1 = exp(-2.3 * dot(uv - c1, uv - c1));
      float w2 = exp(-2.6 * dot(uv - c2, uv - c2));
      float w3 = exp(-2.4 * dot(uv - c3, uv - c3));

      // Akışla bükülen yumuşak kurdeleler — profesyonel, abartısız.
      float ribbon = smoothstep(0.34, 0.82, flow);
      float ribbon2 = smoothstep(0.40, 0.86, flow2);
      col = mix(col, uColorB, clamp(w1 * 0.75 + ribbon2 * 0.22, 0.0, 1.0));
      col = mix(col, uAccent, clamp(w2 * 0.40 + ribbon * 0.20, 0.0, 0.5));
      col = mix(col, accent2, clamp(w3 * 0.26 + ribbon2 * 0.10, 0.0, 0.34));

      // Akışın tepe noktalarında yumuşak beyaz parlama → havadar kalır.
      col = mix(col, vec3(1.0), smoothstep(0.76, 1.0, flow) * 0.10);

      // Sol/metin bölgesini bir tık aydınlat (başlık okunurluğu).
      col = mix(col, mix(col, vec3(1.0), 0.18), smoothstep(0.5, 0.0, vUv.x));

      // İmleç ışıltısı.
      vec2 m = uMouse * aspect;
      col = mix(col, uAccent, exp(-3.0 * dot(uv - m, uv - m)) * 0.18);

      // Çok yumuşak derinlik vignette'i.
      float vig = 1.0 - 0.06 * dot(vUv - 0.5, vUv - 0.5) * 4.0;
      col *= clamp(vig, 0.0, 1.0);

      col = dither(col, vUv);
      gl_FragColor = vec4(col, 1.0);
    }
  `,
  // Soft Stripe-like mesh gradient (calm, corporate)
  gradient: /* glsl */ `
    void main() {
      vec2 aspect = vec2(uRes.x / uRes.y, 1.0);
      vec2 uv = vUv * aspect;
      float t = uTime * 0.25;
      vec3 col = uColorA;
      vec2 c1 = vec2(0.35 + 0.18 * sin(t * 0.7), 0.40 + 0.16 * cos(t * 0.6)) * aspect;
      vec2 c2 = vec2(0.70 + 0.16 * sin(t * 0.5 + 2.0), 0.30 + 0.18 * cos(t * 0.8 + 1.0)) * aspect;
      vec2 c3 = vec2(0.55 + 0.20 * sin(t * 0.4 + 4.0), 0.70 + 0.14 * cos(t * 0.5 + 3.0)) * aspect;
      float w1 = exp(-2.2 * dot(uv - c1, uv - c1));
      float w2 = exp(-2.6 * dot(uv - c2, uv - c2));
      float w3 = exp(-2.4 * dot(uv - c3, uv - c3));
      col = mix(col, uColorB, clamp(w1 + w3 * 0.5, 0.0, 1.0));
      col = mix(col, uAccent, clamp(w2 * 0.55 + w3 * 0.3, 0.0, 0.5));
      vec2 m = uMouse * aspect;
      col = mix(col, uAccent, exp(-3.0 * dot(uv - m, uv - m)) * 0.18);
      col += (hash(vUv * uRes) - 0.5) * 0.012;
      gl_FragColor = vec4(col, 1.0);
    }
  `,
  // Vertical flowing light beams (elevator-shaft feel)
  beams: /* glsl */ `
    void main() {
      vec2 aspect = vec2(uRes.x / uRes.y, 1.0);
      float t = uTime * 0.5;
      vec3 col = mix(uColorB, uColorA, vUv.y);
      float flow = fbm(vec2(vUv.x * aspect.x * 3.0, vUv.y * 1.5 - t));
      float cols = 0.5 + 0.5 * sin(vUv.x * aspect.x * 36.0);
      float lines = pow(cols, 6.0) * smoothstep(0.3, 0.9, flow);
      col = mix(col, uAccent, lines * 0.32);
      col = mix(col, uAccent, pow(flow, 2.0) * 0.08);
      col = mix(col, uAccent, smoothstep(0.12, 0.0, abs(vUv.x - uMouse.x)) * 0.1);
      gl_FragColor = vec4(col, 1.0);
    }
  `,
  // Subtle technical / blueprint grid drifting upward
  grid: /* glsl */ `
    void main() {
      vec2 aspect = vec2(uRes.x / uRes.y, 1.0);
      float t = uTime * 0.5;
      vec3 col = mix(uColorA, uColorB, vUv.y * 0.6);
      vec2 coord = vUv * aspect * 14.0;
      coord.y += t;
      vec2 fr = abs(fract(coord) - 0.5);
      float g = smoothstep(0.47, 0.5, max(fr.x, fr.y));
      vec2 fr2 = abs(fract(coord / 4.0) - 0.5);
      float g2 = smoothstep(0.47, 0.5, max(fr2.x, fr2.y));
      col = mix(col, uAccent, g * 0.1 + g2 * 0.16);
      vec2 m = uMouse * aspect;
      col = mix(col, uAccent, smoothstep(0.5, 0.0, distance(vUv * aspect, m)) * 0.12);
      gl_FragColor = vec4(col, 1.0);
    }
  `,
  // Drifting dot / constellation field
  dots: /* glsl */ `
    void main() {
      vec2 aspect = vec2(uRes.x / uRes.y, 1.0);
      float t = uTime * 0.4;
      vec3 col = mix(uColorA, uColorB, vUv.y * 0.5);
      vec2 coord = vUv * aspect * 20.0;
      coord.y -= t;
      vec2 id = floor(coord);
      vec2 cell = fract(coord) - 0.5;
      float j = hash(id);
      float dot = smoothstep(0.22, 0.04, length(cell)) * (0.4 + 0.6 * j);
      col = mix(col, uAccent, dot * 0.4);
      vec2 m = uMouse * aspect;
      col = mix(col, uAccent, smoothstep(0.45, 0.0, distance(vUv * aspect, m)) * 0.1);
      gl_FragColor = vec4(col, 1.0);
    }
  `
};

const lerp = (a, b, t) => a + (b - a) * t;

export default function PaintedBackground({ variant = "aurora" }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
    } catch {
      return;
    }

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.8));

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    const uniforms = {
      uTime: { value: 0 },
      uMouse: { value: new THREE.Vector2(0.5, 0.5) },
      uRes: { value: new THREE.Vector2(1, 1) },
      uColorA: { value: new THREE.Vector3(...paintState.current.a) },
      uColorB: { value: new THREE.Vector3(...paintState.current.b) },
      uAccent: { value: new THREE.Vector3(...paintState.current.accent) }
    };

    const material = new THREE.ShaderMaterial({
      uniforms,
      vertexShader,
      fragmentShader: fragHeader + (mains[variant] || mains.marble)
    });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
    scene.add(mesh);

    const resize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      renderer.setSize(w, h, false);
      uniforms.uRes.value.set(w, h);
    };
    resize();
    window.addEventListener("resize", resize);

    const onMove = (e) => {
      paintState.mouseTarget.x = e.clientX / window.innerWidth;
      paintState.mouseTarget.y = 1 - e.clientY / window.innerHeight;
    };
    window.addEventListener("pointermove", onMove);

    const clock = new THREE.Clock();
    let raf;
    const tick = () => {
      const dt = Math.min(clock.getDelta(), 0.05);
      uniforms.uTime.value += reduce ? dt * 0.15 : dt;

      const { current, target } = paintState;
      // Slower, frame-rate-independent palette blend → silky chapter-to-chapter
      // colour transitions instead of an abrupt snap.
      const k = 1 - Math.pow(0.5, dt * 1.6);
      for (const key of ["a", "b", "accent"]) {
        for (let i = 0; i < 3; i++) current[key][i] = lerp(current[key][i], target[key][i], k);
      }
      uniforms.uColorA.value.set(...current.a);
      uniforms.uColorB.value.set(...current.b);
      uniforms.uAccent.value.set(...current.accent);

      const mk = Math.min(1, dt * 3);
      paintState.mouse.x = lerp(paintState.mouse.x, paintState.mouseTarget.x, mk);
      paintState.mouse.y = lerp(paintState.mouse.y, paintState.mouseTarget.y, mk);
      uniforms.uMouse.value.set(paintState.mouse.x, paintState.mouse.y);

      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    };
    tick();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
      mesh.geometry.dispose();
      material.dispose();
      renderer.dispose();
    };
  }, [variant]);

  return <canvas ref={canvasRef} className="story-bg-canvas" aria-hidden="true" />;
}
