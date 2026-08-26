"use client";

import Image from "next/image";

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
  const { w, h } = SIZE[size];

  return (
    <div className={`flex flex-col items-center gap-4 ${className}`}>
      <div
        data-brand-logo
        className={`gms-logo-frame gms-logo-frame--${surface} metal-sweep ${
          animate ? "gms-brand-in is-active" : ""
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
            className={`font-display text-[0.68rem] uppercase tracking-[0.28em] text-brand ${
              animate ? "gms-enter" : ""
            }`}
          >
            Application terrain
          </p>
          <p
            className={`mt-1.5 font-display font-bold uppercase tracking-[0.04em] text-mist ${
              size === "hero" || size === "lg" ? "text-3xl sm:text-4xl" : "text-xl"
            } ${animate ? "gms-enter gms-enter-delay-1" : ""}`}
          >
            {productName}
          </p>
        </div>
      )}
    </div>
  );
}
