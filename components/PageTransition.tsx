"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import gsap from "gsap";

export function PageTransition({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    if (!ref.current) return;
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    const ctx = gsap.context(() => {
      if (!ref.current) return;
      if (reduced) {
        gsap.set(ref.current, { opacity: 1, y: 0 });
        return;
      }
      gsap.fromTo(
        ref.current,
        { opacity: 0, y: 12 },
        { opacity: 1, y: 0, duration: 0.28, ease: "power2.out" }
      );
    }, ref);
    return () => {
      ctx.revert();
    };
  }, [pathname]);

  return <div ref={ref}>{children}</div>;
}
