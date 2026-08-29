"use client";

import { useEffect, useRef, useState } from "react";
import type { User } from "@/lib/api-client";

export function ControllerMultiSelect({
  users,
  value,
  onChange,
  disabled,
}: {
  users: User[];
  value: string[];
  onChange: (ids: string[]) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const selected = users.filter((u) => value.includes(u.id));
  const label =
    selected.length === 0
      ? "— Sélectionner —"
      : selected.length === 1
        ? selected[0].name
        : `${selected.length} contrôleurs`;

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        disabled={disabled}
        className="gms-field gms-select flex w-full min-h-11 items-center justify-between gap-2 text-left disabled:opacity-50"
        onClick={() => setOpen((v) => !v)}
      >
        <span className={selected.length === 0 ? "text-mute" : "text-mist"}>
          {label}
        </span>
        <span className="text-mute">▾</span>
      </button>
      {open && !disabled ? (
        <div className="absolute z-30 mt-1 max-h-56 w-full overflow-y-auto rounded-md border border-line bg-[var(--gms-field)] p-2 shadow-lg">
          {users.map((u) => {
            const checked = value.includes(u.id);
            return (
              <button
                key={u.id}
                type="button"
                onClick={() =>
                  onChange(
                    checked
                      ? value.filter((id) => id !== u.id)
                      : [...value, u.id]
                  )
                }
                className={`mb-1 flex w-full items-center gap-2 rounded-md border px-2 py-1.5 text-left text-sm last:mb-0 ${
                  checked
                    ? "border-gold/40 bg-gold-dim text-mist"
                    : "border-transparent text-mist hover:bg-black/5"
                }`}
              >
                <span
                  className={`flex h-4 w-4 items-center justify-center rounded border text-[0.55rem] ${
                    checked
                      ? "border-gold bg-gold text-ink"
                      : "border-line text-transparent"
                  }`}
                >
                  ✓
                </span>
                {u.name}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
