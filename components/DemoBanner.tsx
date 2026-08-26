"use client";

export function DemoBanner() {
  if (process.env.NEXT_PUBLIC_MOCK_API !== "true") return null;

  return (
    <div className="border-b border-brand/30 bg-brand/10 px-3 py-2 text-center text-[0.7rem] leading-snug text-brand-dark sm:px-4 sm:text-xs">
      <strong>Mode démo</strong>
      <span className="sm:hidden"> — données fictives, non persistées</span>
      <span className="hidden sm:inline">
        {" "}
        — données fictives · sans backend ni base de données · modifications non
        persistées après rechargement
      </span>
    </div>
  );
}
