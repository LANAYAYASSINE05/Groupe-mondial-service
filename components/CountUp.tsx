"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

export function CountUp({ value, label }: { value: number; label: string }) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (reduced) {
      ref.current.textContent = String(value);
      return;
    }
    const obj = { n: 0 };
    gsap.to(obj, {
      n: value,
      duration: 0.8,
      ease: "power2.out",
      onUpdate: () => {
        if (ref.current) ref.current.textContent = String(Math.round(obj.n));
      },
    });
  }, [value]);

  return (
    <div className="border-b border-gold-soft py-5 pr-4">
      <p className="gms-eyebrow">{label}</p>
      <p className="mt-2 font-display text-3xl tabular-nums tracking-tight text-mist">
        <span ref={ref}>0</span>
      </p>
    </div>
  );
}
