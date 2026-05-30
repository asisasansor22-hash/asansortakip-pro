"use client";

import { useEffect, useRef, useState } from "react";

export default function Reveal({ as: Tag = "div", className = "", children, delay, ...props }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!ref.current || visible) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      setVisible(true);
      observer.disconnect();
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [visible]);

  const style = delay != null
    ? { ...props.style, transitionDelay: `${delay}s` }
    : props.style;

  return (
    <Tag
      ref={ref}
      className={`reveal ${visible ? "is-visible" : ""} ${className}`}
      {...props}
      style={style}
    >
      {children}
    </Tag>
  );
}
