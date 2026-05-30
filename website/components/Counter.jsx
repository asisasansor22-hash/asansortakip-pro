"use client";

import { useEffect, useRef, useState } from "react";

export default function Counter({ value, suffix = "" }) {
  const ref = useRef(null);
  const [count, setCount] = useState(0);

  useEffect(() => {
    const target = Number(value);
    if (!Number.isFinite(target)) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      const start = performance.now();
      const duration = 900;
      const tick = (now) => {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setCount(Math.round(target * eased));
        if (progress < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
      observer.disconnect();
    }, { threshold: 0.4 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [value]);

  return <strong ref={ref}>{count}{suffix}</strong>;
}
