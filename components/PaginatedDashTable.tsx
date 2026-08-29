"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { DashTable } from "@/components/DashWidgets";
import { TablePagination } from "@/components/TablePagination";

const DEFAULT_PAGE_SIZE = 15;

export function PaginatedDashTable<T>({
  columns,
  items,
  minWidth,
  pageSize = DEFAULT_PAGE_SIZE,
  resetKey = "",
  getRowKey,
  renderRow,
  emptyMessage = "Aucune donnée.",
}: {
  columns: string[];
  items: T[];
  minWidth?: string;
  pageSize?: number;
  resetKey?: string;
  getRowKey: (item: T) => string;
  renderRow: (item: T) => ReactNode;
  emptyMessage?: string;
}) {
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [resetKey, items.length]);

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage = Math.min(page, totalPages);

  const pageItems = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, safePage, pageSize]);

  return (
    <>
      <DashTable columns={columns} minWidth={minWidth}>
        {pageItems.length === 0 ? (
          <tr>
            <td
              colSpan={columns.length}
              className="px-4 py-8 text-center text-sm text-mute"
            >
              {emptyMessage}
            </td>
          </tr>
        ) : (
          pageItems.map((item) => (
            <tr key={getRowKey(item)} className="border-b border-line">
              {renderRow(item)}
            </tr>
          ))
        )}
      </DashTable>
      <TablePagination
        page={safePage}
        pageSize={pageSize}
        total={items.length}
        onPageChange={setPage}
      />
    </>
  );
}
