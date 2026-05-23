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

const fragmentShader = /* glsl */ `
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

  void main() {
    vec2 aspect = vec2(uRes.x / uRes.y, 1.0);
    vec2 p = vUv * aspect * 1.6;
    float t = uTime * 0.06;

    // domain warped fbm -> painterly, fluid marble
    vec2 q = vec2(fbm(p + t), fbm(p + vec2(5.2, 1.3) - t));
    vec2 r = vec2(
      fbm(p + 3.0 * q + vec2(1.7, 9.2) + 0.4 * t),
      fbm(p + 3.0 * q + vec2(8.3, 2.8) - 0.4 * t)
    );
    float f = fbm(p + 3.0 * r);

    vec3 col = mix(uColorA, uColorB, clamp(f * 1.3, 0.0, 1.0));
    col = mix(col, uAccent, clamp((r.x * r.y) * 1.3, 0.0, 0.55));

    // cursor-driven light
    vec2 m = uMouse * aspect;
    float d = distance(vUv * aspect, m);
    float glow = smoothstep(0.55, 0.0, d);
    col += uAccent * glow * 0.22;

    // vignette + subtle grain
    float vig = smoothstep(1.25, 0.25, distance(vUv, vec2(0.5)));
    col *= 0.82 + 0.18 * vig;
    col += (hash(vUv * uRes) - 0.5) * 0.025;

    gl_FragColor = vec4(col, 1.0);
  }
`;

const lerp = (a, b, t) => a + (b - a) * t;

export default function PaintedBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
    } catch {
      return; // no WebGL -> CSS fallback background stays visible
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

    const material = new THREE.ShaderMaterial({ uniforms, vertexShader, fragmentShader });
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
      const k = Math.min(1, dt * 1.8);
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
  }, []);

  return <canvas ref={canvasRef} className="story-bg-canvas" aria-hidden="true" />;
}
