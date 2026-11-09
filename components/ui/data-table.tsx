"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import {
  DEFAULT_PAGE_SIZE_OPTIONS,
  TablePagination,
  usePagination,
} from "./pagination";
import { EmptyState, Skeleton } from "./states";

export interface DataTableColumn<T> {
  key: string;
  header: string;
  className?: string;
  render: (row: T, index: number) => ReactNode;
}

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  data: T[];
  rowKey: (row: T, index: number) => string;
  isLoading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  className?: string;
  /** Aktifkan pilihan jumlah data per halaman dan paginasi (default: true). */
  paginated?: boolean;
  pageSizeOptions?: readonly number[];
  defaultPageSize?: number;
}

export function DataTable<T>({
  columns,
  data,
  rowKey,
  isLoading = false,
  emptyTitle = "Belum ada data",
  emptyDescription = "Data yang Anda cari belum tersedia.",
  className,
  paginated = true,
  pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
  defaultPageSize = 10,
}: DataTableProps<T>) {
  const pagination = usePagination(data, defaultPageSize);
  const rows = paginated ? pagination.pageItems : data;
  const offset = paginated ? pagination.offset : 0;

  if (isLoading) {
    return (
      <div className="space-y-3 py-4">
        <Skeleton className="h-10 w-full rounded-xl" />
        <Skeleton className="h-14 w-full rounded-xl" />
        <Skeleton className="h-14 w-full rounded-xl" />
      </div>
    );
  }

  if (data.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <div className={cn("w-full", className)}>
      <div className="w-full overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-border-soft text-body-sm font-semibold uppercase tracking-wider text-ink-muted bg-surface/60">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    "px-4 py-3 first:rounded-l-xl last:rounded-r-xl",
                    col.className,
                  )}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border-soft/70 text-body-md">
            {rows.map((row, index) => (
              <tr
                key={rowKey(row, offset + index)}
                className="transition-colors hover:bg-surface/50"
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={cn("px-4 py-4 align-middle", col.className)}
                  >
                    {col.render(row, offset + index)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {paginated && (
        <TablePagination
          page={pagination.page}
          pageSize={pagination.pageSize}
          totalItems={pagination.totalItems}
          onPageChange={pagination.setPage}
          onPageSizeChange={pagination.setPageSize}
          pageSizeOptions={pageSizeOptions}
        />
      )}
    </div>
  );
}
