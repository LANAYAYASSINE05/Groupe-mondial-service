"use client";

export function DemoBanner() {
  if (process.env.NEXT_PUBLIC_MOCK_API !== "true") return null;

  return (
    <div className="border-b border-brand/30 bg-brand/10 px-4 py-2 text-center text-xs text-brand-dark">
      <strong>Mode démo</strong> — données fictives · sans backend ni base de
      données · modifications non persistées après rechargement
    </div>
  );
}
