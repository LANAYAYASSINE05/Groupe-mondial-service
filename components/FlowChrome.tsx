"use client";

import Link from "next/link";

/** Fil d'Ariane / étapes — réduit la charge cognitive sur le parcours terrain */
export function StepRail({
  steps,
  current,
}: {
  steps: string[];
  current: number;
}) {
  return (
    <ol className="flex flex-wrap items-center gap-x-2 gap-y-2" aria-label="Étapes">
      {steps.map((label, i) => {
        const n = i + 1;
        const done = n < current;
        const active = n === current;
        return (
          <li key={label} className="flex items-center gap-2">
            {i > 0 && (
              <span className="hidden h-px w-6 bg-gold/30 sm:block" aria-hidden />
            )}
            <span
              className={`inline-flex items-center gap-2 font-display text-[0.68rem] uppercase tracking-[0.16em] ${
                active
                  ? "text-gold"
                  : done
                    ? "text-mute"
                    : "text-na"
              }`}
            >
              <span
                className={`flex h-6 w-6 items-center justify-center border text-[0.65rem] tabular-nums ${
                  active
                    ? "border-brand bg-brand/20 text-mist"
                    : done
                      ? "border-gold/40 text-gold"
                      : "border-line text-na"
                }`}
                aria-current={active ? "step" : undefined}
              >
                {done ? "✓" : n}
              </span>
              {label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

export function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-2 font-display text-[0.72rem] uppercase tracking-[0.16em] text-mute transition hover:text-gold"
    >
      <span aria-hidden>←</span>
      {label}
    </Link>
  );
}

export function HelpHint({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-2 flex gap-2 text-sm leading-relaxed text-mute">
      <span
        className="mt-0.5 inline-block h-4 w-0.5 shrink-0 bg-gold/50"
        aria-hidden
      />
      <span>{children}</span>
    </p>
  );
}
