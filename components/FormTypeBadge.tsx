import type { FormType } from "@/lib/api-client";
import { formTypeLabel } from "@/lib/api-client";

export function FormTypeBadge({ formType }: { formType: FormType | string }) {
  const isAudit = formType === "audit";
  return (
    <span
      className={`inline-flex rounded px-2 py-0.5 font-display text-[0.62rem] uppercase tracking-[0.12em] ${
        isAudit
          ? "bg-gold/15 text-gold"
          : "bg-brand/15 text-brand-light"
      }`}
    >
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

export type ReportTableGroup = "site" | "controller" | "item" | "list";

const reportTableGroupLabels: Record<ReportTableGroup, string> = {
  site: "Par site",
  controller: "Par contrôleur",
  item: "Par item",
  list: "Contrôles",
};

export function ReportTableGroupToggle({
  value,
  onChange,
}: {
  value: ReportTableGroup;
  onChange: (v: ReportTableGroup) => void;
}) {
  const groups: ReportTableGroup[] = [
    "site",
    "controller",
    "item",
    "list",
  ];

  return (
    <div className="inline-flex max-w-full flex-wrap rounded-md border border-line p-0.5">
      {groups.map((group) => (
        <button
          key={group}
          type="button"
          onClick={() => onChange(group)}
          className={`rounded px-2.5 py-1.5 font-display text-[0.62rem] uppercase tracking-[0.12em] transition-colors sm:px-3 ${
            value === group
              ? "bg-brand text-white"
              : "text-mute hover:text-mist"
          }`}
        >
          {reportTableGroupLabels[group]}
        </button>
      ))}
    </div>
  );
}
