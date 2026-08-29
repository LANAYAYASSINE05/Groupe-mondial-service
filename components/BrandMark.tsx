"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import gsap from "gsap";

type BrandMarkProps = {
  animate?: boolean;
  size?: "sm" | "md" | "lg" | "hero";
  /** bare = logo seul · light/dark = alias (thème clair) */
  surface?: "light" | "dark" | "bare";
  showProduct?: boolean;
  productName?: string;
  className?: string;
};

/** Logo officiel Mondial Service (1430×1254) */
const SIZE = {
  sm: { w: 132, h: 116 },
  md: { w: 200, h: 175 },
  lg: { w: 288, h: 252 },
  hero: { w: 380, h: 333 },
} as const;

export function BrandMark({
  animate = false,
  size = "md",
  surface = "bare",
  showProduct = false,
  productName = "GMS Contrôle",
  className = "",
}: BrandMarkProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const { w, h } = SIZE[size];

  useEffect(() => {
    if (!animate || !rootRef.current) return;
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    const logo = rootRef.current.querySelector("[data-brand-logo]");
    const lines = rootRef.current.querySelectorAll("[data-brand-line]");

    if (reduced) {
      gsap.set([logo, lines], { opacity: 1, y: 0, scale: 1 });
      return;
    }

    const tl = gsap.timeline();
    tl.fromTo(
      logo,
      { opacity: 0, scale: 0.96 },
      { opacity: 1, scale: 1, duration: 0.55, ease: "power2.out" }
    )
      .fromTo(
        lines,
        { opacity: 0, y: 10 },
        {
          opacity: 1,
          y: 0,
          duration: 0.35,
          stagger: 0.1,
          ease: "power2.out",
        },
        "-=0.15"
      )
      .add(() => logo?.classList.add("is-active"));

    return () => {
      tl.kill();
    };
  }, [animate]);

  return (
    <div
      ref={rootRef}
      className={`flex flex-col items-center gap-4 ${className}`}
    >
      <div
        data-brand-logo
        className={`gms-logo-frame gms-logo-frame--${surface} metal-sweep ${
          animate ? "opacity-0" : ""
        }`}
        style={
          {
            "--gms-logo-w": `min(100%, ${w}px)`,
            "--gms-logo-h": `${h}px`,
          } as React.CSSProperties
        }
      >
        <Image
          src="/brand/logo.png"
          alt="Mondial Service"
          width={w}
          height={h}
          className="gms-logo-img"
          priority
        />
      </div>
      {showProduct && (
        <div className="text-center">
          <p
            data-brand-line
            className={`font-display text-[0.68rem] uppercase tracking-[0.28em] text-brand ${
              animate ? "opacity-0" : ""
            }`}
          >
            Application terrain
          </p>
          <p
            data-brand-line
            className={`mt-1.5 font-display font-bold uppercase tracking-[0.04em] text-mist ${
              size === "hero" || size === "lg" ? "text-3xl sm:text-4xl" : "text-xl"
            } ${animate ? "opacity-0" : ""}`}
          >
            {productName}
          </p>
        </div>
      )}
    </div>
  );
}
