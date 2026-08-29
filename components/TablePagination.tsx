"use client";

import { Button } from "@/components/Button";

type TablePaginationProps = {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
};

export function TablePagination({
  page,
  pageSize,
  total,
  onPageChange,
}: TablePaginationProps) {
  if (total <= pageSize) return null;

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);
  const from = (safePage - 1) * pageSize + 1;
  const to = Math.min(safePage * pageSize, total);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-3 py-3 sm:px-4">
      <p className="text-xs text-mute">
        Affichage{" "}
        <span className="tabular-nums text-mist">
          {from}–{to}
        </span>{" "}
        sur <span className="tabular-nums text-mist">{total}</span>
      </p>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="ghost"
          className="min-h-9 px-3 text-xs"
          disabled={safePage <= 1}
          onClick={() => onPageChange(safePage - 1)}
        >
          Précédent
        </Button>
        <span className="font-display text-[0.65rem] uppercase tracking-label text-mute">
          Page{" "}
          <span className="tabular-nums text-mist">{safePage}</span> /{" "}
          <span className="tabular-nums text-mist">{totalPages}</span>
        </span>
        <Button
          type="button"
          variant="ghost"
          className="min-h-9 px-3 text-xs"
          disabled={safePage >= totalPages}
          onClick={() => onPageChange(safePage + 1)}
        >
          Suivant
        </Button>
      </div>
    </div>
  );
}
