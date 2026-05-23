// Shared mutable store that lets the GSAP ScrollTrigger logic drive the
// Three.js painted background. ScrollTrigger writes target colors; the
// background render loop lerps current -> target every frame.
export const paintState = {
  current: { a: [0.02, 0.05, 0.12], b: [0.05, 0.16, 0.32], accent: [0.36, 0.68, 0.98] },
  target: { a: [0.02, 0.05, 0.12], b: [0.05, 0.16, 0.32], accent: [0.36, 0.68, 0.98] },
  mouse: { x: 0.5, y: 0.5 },
  mouseTarget: { x: 0.5, y: 0.5 }
};

export function setPalette(palette) {
  if (palette?.a) paintState.target.a = palette.a;
  if (palette?.b) paintState.target.b = palette.b;
  if (palette?.accent) paintState.target.accent = palette.accent;
}
