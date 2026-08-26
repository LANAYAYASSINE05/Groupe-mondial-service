"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

export function ProgressBar({ value }: { value: number }) {
  const fillRef = useRef<HTMLDivElement>(null);
  const pct = Math.max(0, Math.min(100, value));

  useEffect(() => {
    if (!fillRef.current) return;
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (reduced) {
      fillRef.current.style.width = `${pct}%`;
      return;
    }
    gsap.to(fillRef.current, {
      width: `${pct}%`,
      duration: 0.35,
      ease: "power2.out",
    });
  }, [pct]);

  return (
    <div className="w-full">
      <div className="mb-2 flex justify-between font-display text-[0.68rem] uppercase tracking-label">
        <span className="text-mute">Progression checklist</span>
        <span className="tabular-nums text-gold">{pct}%</span>
      </div>
      <div className="h-1 w-full bg-surface2">
        <div
          ref={fillRef}
          className="h-full bg-brand-metal"
          style={{ width: 0 }}
        />
      </div>
    </div>
  );
}
