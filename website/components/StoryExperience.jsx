"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import PaintedBackground from "./PaintedBackground";
import HeroElevator from "./HeroElevator";
import { chapters } from "@/lib/storyChapters";
import { setPalette } from "@/lib/paintStore";

export default function StoryExperience() {
  const rootRef = useRef(null);
  const [active, setActive] = useState(chapters[0].id);

  useEffect(() => {
    document.body.classList.add("story-page");

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return () => document.body.classList.remove("story-page");
    }

    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      const sections = gsap.utils.toArray(".story-chapter");
      sections.forEach((section) => {
        const palette = JSON.parse(section.dataset.palette);
        const id = section.dataset.id;

        ScrollTrigger.create({
          trigger: section,
          start: "top 55%",
          end: "bottom 45%",
          onToggle: (self) => {
            if (self.isActive) {
              setPalette(palette);
              setActive(id);
            }
          }
        });

        const reveals = section.querySelectorAll("[data-reveal]");
        gsap.from(reveals, {
          y: 64,
          opacity: 0,
          duration: 1,
          ease: "power3.out",
          stagger: 0.12,
          scrollTrigger: { trigger: section, start: "top 78%" }
        });
      });

      ScrollTrigger.refresh();
    }, rootRef);

    return () => {
      ctx.revert();
      document.body.classList.remove("story-page");
    };
  }, []);

  const goTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <>
      <PaintedBackground />
      <div className="story-fallback-bg" aria-hidden="true" />

      <nav className="story-rail" aria-label="Bölümler">
        {chapters.map((c) => (
          <button
            key={c.id}
            type="button"
            className={`story-rail-dot${active === c.id ? " is-active" : ""}`}
            onClick={() => goTo(c.id)}
          >
            <span className="story-rail-label">{c.kicker}</span>
          </button>
        ))}
      </nav>

      <div className="story" ref={rootRef}>
        {chapters.map((c) => (
          <section
            key={c.id}
            id={c.id}
            className={`story-chapter${c.hero ? " is-hero" : ""}`}
            data-id={c.id}
            data-palette={JSON.stringify(c.palette)}
          >
            <div className={`container${c.hero ? " story-hero" : ""}`}>
              <div className={c.hero ? "story-hero-copy" : "story-copy-plain"}>
              {c.index ? (
                <div className="story-index" data-reveal>
                  {c.index}
                </div>
              ) : null}
              <div className="story-kicker" data-reveal>
                {c.kicker}
              </div>
              <h2 className="story-title" data-reveal>
                {c.title.map((line, i) => (
                  <span key={i}>
                    {line}
                    {i < c.title.length - 1 ? <br /> : null}
                  </span>
                ))}
              </h2>
              <p className="story-lead" data-reveal>
                {c.lead}
              </p>

              {c.bullets ? (
                <ul className="story-bullets" data-reveal>
                  {c.bullets.map((b) => (
                    <li key={b}>{b}</li>
                  ))}
                </ul>
              ) : null}

              {c.actions ? (
                <div className="story-actions" data-reveal>
                  {c.actions.map((a) =>
                    a.href.startsWith("/") ? (
                      <Link
                        key={a.label}
                        href={a.href}
                        className={`story-btn${a.primary ? " is-primary" : ""}`}
                      >
                        {a.label}
                      </Link>
                    ) : (
                      <a
                        key={a.label}
                        href={a.href}
                        className={`story-btn${a.primary ? " is-primary" : ""}`}
                      >
                        {a.label}
                      </a>
                    )
                  )}
                </div>
              ) : null}

              {c.note ? (
                <p className="story-note" data-reveal>
                  {c.note}
                </p>
              ) : null}

              {c.hint ? (
                <div className="story-hint" aria-hidden="true">
                  <span className="story-hint-line" />
                  {c.hint}
                </div>
              ) : null}
              </div>

              {c.hero ? (
                <div className="story-hero-visual" data-reveal>
                  <HeroElevator />
                </div>
              ) : null}
            </div>
          </section>
        ))}
      </div>
    </>
  );
}
