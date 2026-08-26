import type { FormType } from "@/lib/api-client";
import { formTypeLabel } from "@/lib/api-client";

export function formTypeBadgeClass(formType: FormType | string) {
  return formType === "audit"
    ? "border-audit/30 bg-audit/10 text-audit"
    : "border-passager/30 bg-passager/10 text-passager";
}

export function FormTypeBadge({ formType }: { formType: FormType | string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded border px-2 py-0.5 font-display text-[0.62rem] uppercase tracking-[0.12em] ${formTypeBadgeClass(formType)}`}
    >
      <span
        className={`h-1.5 w-1.5 shrink-0 rounded-full ${
          formType === "audit" ? "bg-audit" : "bg-passager"
        }`}
        aria-hidden
      />
      {formTypeLabel(formType as FormType)}
    </span>
  );
}

export function TableViewToggle({
  value,
  onChange,
}: {
  value: "global" | "detail";
  onChange: (v: "global" | "detail") => void;
}) {
  return (
    <div className="inline-flex rounded-md border border-line p-0.5">
      <button
        type="button"
        onClick={() => onChange("global")}
        className={`rounded px-3 py-1.5 font-display text-[0.62rem] uppercase tracking-[0.12em] transition-colors ${
          value === "global"
            ? "bg-brand text-white"
            : "text-mute hover:text-mist"
        }`}
      >
        Globale
      </button>
      <button
        type="button"
        onClick={() => onChange("detail")}
        className={`rounded px-3 py-1.5 font-display text-[0.62rem] uppercase tracking-[0.12em] transition-colors ${
          value === "detail"
            ? "bg-brand text-white"
            : "text-mute hover:text-mist"
        }`}
      >
        Détail
      </button>
    </div>
  );
}
