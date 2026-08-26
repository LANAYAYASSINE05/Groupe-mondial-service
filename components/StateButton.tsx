import type { ItemState } from "@/lib/api-client";

type Props = {
  value: ItemState;
  label: string;
  active: boolean;
  onSelect: () => void;
};

const SHORT: Record<ItemState, string> = {
  ok: "C",
  no: "NC",
  na: "NA",
};

/** Bouton d'état compact — C / NC / NA (style chip moderne). */
export function StateButton({ value, label, active, onSelect }: Props) {
  const styles = active
    ? value === "ok"
      ? "border-ok/60 bg-ok/20 text-ok shadow-[0_0_0_1px_rgba(61,143,110,0.35)]"
      : value === "no"
        ? "border-brand/60 bg-brand/20 text-brand-light shadow-[0_0_0_1px_rgba(225,6,0,0.35)]"
        : "border-na/50 bg-surface2/80 text-mute shadow-[0_0_0_1px_rgba(92,107,126,0.35)]"
    : "border-line/80 bg-surface/40 text-mute hover:border-mist/25 hover:bg-surface/70 hover:text-mist";

  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      onClick={onSelect}
      className={`inline-flex h-11 min-w-[3rem] items-center justify-center rounded-md border px-3 font-display text-[0.7rem] font-semibold uppercase tracking-[0.14em] transition duration-brand sm:h-8 sm:min-w-[2.6rem] sm:px-2.5 sm:text-[0.68rem] ${styles}`}
    >
      {SHORT[value]}
    </button>
  );
}
