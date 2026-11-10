"use client";

import { Pagination } from "@heroui/react";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { Select } from "./select";

export const DEFAULT_PAGE_SIZE_OPTIONS = [5, 10, 20, 50] as const;

export interface UsePaginationResult<T> {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  pageItems: T[];
  /** Nomor urut baris pertama pada halaman aktif (mulai dari 0). */
  offset: number;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
}

/**
 * Hook paginasi sisi klien. Halaman aktif otomatis dibatasi ke rentang valid
 * ketika jumlah data berubah (mis. setelah filter diterapkan).
 */
export function usePagination<T>(
  items: T[],
  initialPageSize: number = DEFAULT_PAGE_SIZE_OPTIONS[1],
): UsePaginationResult<T> {
  const [pageSize, setPageSizeState] = useState(initialPageSize);
  const [rawPage, setRawPage] = useState(1);

  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const page = Math.min(Math.max(1, rawPage), totalPages);
  const offset = (page - 1) * pageSize;

  const pageItems = useMemo(
    () => items.slice(offset, offset + pageSize),
    [items, offset, pageSize],
  );

  return {
    page,
    pageSize,
    totalItems,
    totalPages,
    pageItems,
    offset,
    setPage: setRawPage,
    setPageSize: (size: number) => {
      setPageSizeState(size);
      setRawPage(1);
    },
  };
}

function getPageNumbers(page: number, totalPages: number) {
  const pages: (number | "ellipsis-start" | "ellipsis-end")[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
    return pages;
  }
  pages.push(1);
  if (page > 3) pages.push("ellipsis-start");
  const start = Math.max(2, page - 1);
  const end = Math.min(totalPages - 1, page + 1);
  for (let i = start; i <= end; i++) pages.push(i);
  if (page < totalPages - 2) pages.push("ellipsis-end");
  pages.push(totalPages);
  return pages;
}

export interface TablePaginationProps {
  page: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  pageSizeOptions?: readonly number[];
  className?: string;
}

/**
 * Kontrol paginasi tabel: pilihan jumlah data per halaman (Select HeroUI),
 * ringkasan rentang data, dan navigasi halaman (HeroUI Pagination).
 */
export function TablePagination({
  page,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
  className,
}: TablePaginationProps) {
  if (totalItems === 0) return null;

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const startItem = (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, totalItems);

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 pt-3 w-full sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      <div className="flex flex-col items-center justify-center gap-2 w-full text-center sm:flex-row sm:w-auto sm:text-left sm:gap-3">
        {/* Pilihan jumlah data per halaman */}
        <div className="w-full flex items-center justify-center gap-2 text-body-sm text-ink-muted whitespace-nowrap sm:w-auto sm:justify-start">
          <span className="whitespace-nowrap">Tampilkan</span>
          <div className="w-20 shrink-0">
            <Select
              aria-label="Jumlah data per halaman"
              size="sm"
              value={String(pageSize)}
              onValueChange={(v) => onPageSizeChange(Number(v))}
              className="w-20"
              triggerClassName="h-9 px-3 rounded-xl"
              options={pageSizeOptions.map((n) => ({
                value: String(n),
                label: String(n),
              }))}
            />
          </div>
          <span className="whitespace-nowrap">per halaman</span>
        </div>

        {/* Keterangan jumlah data */}
        <div className="w-full text-center text-body-sm text-ink-muted whitespace-nowrap sm:w-auto sm:text-left">
          Menampilkan {startItem}–{endItem} dari {totalItems} data
        </div>
      </div>

      {totalPages > 1 && (
        <div className="w-full flex items-center justify-center pt-1 sm:w-auto sm:pt-0">
          <Pagination size="sm" className="w-auto flex items-center">
            <Pagination.Content className="flex flex-row items-center gap-1.5 list-none m-0 p-0">
            <Pagination.Item className="inline-flex">
              <Pagination.Previous
                isDisabled={page === 1}
                onPress={() => onPageChange(page - 1)}
                className="inline-flex items-center gap-1.5 px-3 h-8 text-body-sm font-medium rounded-lg border border-border-soft bg-white text-ink hover:bg-primary-50 hover:text-primary transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <Pagination.PreviousIcon className="size-4 shrink-0 inline-flex items-center justify-center" />
                <span>Sebelumnya</span>
              </Pagination.Previous>
            </Pagination.Item>
            {getPageNumbers(page, totalPages).map((p) =>
              typeof p === "string" ? (
                <Pagination.Item key={p} className="inline-flex">
                  <Pagination.Ellipsis className="inline-flex items-center justify-center min-w-8 h-8 text-body-sm text-ink-muted" />
                </Pagination.Item>
              ) : (
                <Pagination.Item key={p} className="inline-flex">
                  <Pagination.Link
                    isActive={p === page}
                    onPress={() => onPageChange(p)}
                    className={cn(
                      "inline-flex items-center justify-center min-w-8 h-8 px-2.5 text-body-sm font-medium rounded-lg transition-colors cursor-pointer",
                      p === page
                        ? "bg-primary text-white font-semibold shadow-xs border border-primary"
                        : "border border-border-soft bg-white text-ink hover:bg-primary-50 hover:text-primary",
                    )}
                  >
                    {p}
                  </Pagination.Link>
                </Pagination.Item>
              ),
            )}
            <Pagination.Item className="inline-flex">
              <Pagination.Next
                isDisabled={page === totalPages}
                onPress={() => onPageChange(page + 1)}
                className="inline-flex items-center gap-1.5 px-3 h-8 text-body-sm font-medium rounded-lg border border-border-soft bg-white text-ink hover:bg-primary-50 hover:text-primary transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <span>Berikutnya</span>
                <Pagination.NextIcon className="size-4 shrink-0 inline-flex items-center justify-center" />
              </Pagination.Next>
            </Pagination.Item>
          </Pagination.Content>
        </Pagination>
        </div>
      )}
    </div>
  );
}
