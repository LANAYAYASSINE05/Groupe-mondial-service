"use client";

import { useId } from "react";

/** Symbole marque officiel : 2 piliers + ruban S (Mondial Service) */
export function BrandSymbol({
  className = "",
  title = "Mondial Service",
}: {
  className?: string;
  title?: string;
}) {
  const uid = useId().replace(/:/g, "");
  const gid = `gms-sym-${uid}`;

  return (
    <svg
      viewBox="0 0 64 64"
      className={className}
      role="img"
      aria-label={title}
    >
      <defs>
        <linearGradient id={gid} x1="20%" y1="0%" x2="80%" y2="100%">
          <stop offset="0%" stopColor="#8D2A26" />
          <stop offset="45%" stopColor="#D13A34" />
          <stop offset="100%" stopColor="#8D2A26" />
        </linearGradient>
      </defs>
      <rect x="6" y="8" width="11" height="48" rx="5.5" fill={`url(#${gid})`} />
      <rect x="47" y="8" width="11" height="48" rx="5.5" fill={`url(#${gid})`} />
      <path
        d="M20 8 C32 8 36 18 40 26 C44 34 50 38 52 38
           C50 38 44 42 40 50 C36 58 32 64 20 64
           C30 54 32 44 32 36 C32 28 30 18 20 8 Z"
        fill={`url(#${gid})`}
      />
    </svg>
  );
}
