"use client";

import { Calendar, ChevronRight, Search } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Card,
  ErrorState,
  Skeleton,
  StatusChip,
  UangBadge,
} from "@/components/ui";
import { cn } from "@/lib/utils";
import { useRapatList } from "../hooks/use-rapat";

function formatShortDate(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return isoDate;
  return date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function ArsipRapatListView() {
  const { data, isLoading, isError, error, refetch } = useRapatList();
  const [search, setSearch] = useState("");
  const [monthFilter, setMonthFilter] = useState("ALL");
  const [completenessFilter, setCompletenessFilter] = useState<
    "ALL" | "COMPLETE" | "INCOMPLETE"
  >("ALL");

  const allRapat = useMemo(() => data?.data ?? [], [data?.data]);

  const counts = useMemo(() => {
    const complete = allRapat.filter((r) => r.uangStatus.isComplete).length;
    const incomplete = allRapat.length - complete;
    return {
      total: allRapat.length,
      complete,
      incomplete,
    };
  }, [allRapat]);

  const filteredRapat = useMemo(() => {
    return allRapat.filter((r) => {
      if (completenessFilter === "COMPLETE" && !r.uangStatus.isComplete) {
        return false;
      }
      if (completenessFilter === "INCOMPLETE" && r.uangStatus.isComplete) {
        return false;
      }
      if (monthFilter !== "ALL") {
        const d = new Date(r.tanggal);
        const ym = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
        if (ym !== monthFilter) return false;
      }
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const matchTitle = r.judulRapat.toLowerCase().includes(q);
        const matchNotulis = r.notulisNama.toLowerCase().includes(q);
        if (!matchTitle && !matchNotulis) return false;
      }
      return true;
    });
  }, [allRapat, completenessFilter, monthFilter, search]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full rounded-3xl" />
        <Skeleton className="h-96 w-full rounded-3xl" />
      </div>
    );
  }

  if (isError) {
    return (
      <ErrorState
        message={
          error instanceof Error
            ? error.message
            : "Gagal memuat daftar arsip rapat."
        }
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <Card className="p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-heading text-h4 font-bold text-ink">
            Arsip Rapat
          </h2>
          <p className="mt-1 text-body-sm text-ink-muted">
            Satu arsip per rapat: Undangan (U), Absensi (A), Notulensi (N),
            Gambar (G)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-surface px-3.5 py-1 text-body-sm font-semibold text-ink">
            {counts.total} rapat
          </span>
          <StatusChip status={`${counts.complete} lengkap`} tone="success" />
          <StatusChip
            status={`${counts.incomplete} belum lengkap`}
            tone="warning"
          />
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-muted" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari judul rapat atau notulis..."
              className="h-11 w-full rounded-2xl border border-border-default bg-white pl-10 pr-4 text-body-sm text-ink placeholder:text-ink-subtle focus:border-primary focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2 rounded-2xl border border-border-default bg-white px-3.5 h-11">
            <Calendar className="h-4 w-4 text-ink-muted shrink-0" />
            <select
              aria-label="Filter bulan arsip rapat"
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
              className="bg-transparent text-body-sm font-medium text-ink focus:outline-none"
            >
              <option value="ALL">Semua bulan</option>
              <option value="2026-10">Oktober 2026</option>
              <option value="2026-09">September 2026</option>
            </select>
          </div>
        </div>

        {/* Segmented Completeness Tabs */}
        <div className="inline-flex items-center rounded-2xl bg-surface p-1">
          {[
            { key: "ALL" as const, label: `Semua · ${counts.total}` },
            {
              key: "COMPLETE" as const,
              label: `Lengkap · ${counts.complete}`,
            },
            {
              key: "INCOMPLETE" as const,
              label: `Belum lengkap · ${counts.incomplete}`,
            },
          ].map((tab) => {
            const active = completenessFilter === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setCompletenessFilter(tab.key)}
                className={cn(
                  "rounded-xl px-4 py-2 text-body-sm font-semibold transition-colors cursor-pointer",
                  active
                    ? "bg-primary text-white shadow-xs"
                    : "text-ink-muted hover:text-ink",
                )}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* List */}
      <div className="divide-y divide-border-soft">
        {filteredRapat.map((rapat) => {
          const isComplete = rapat.uangStatus.isComplete;
          const isDoc = rapat.fileUndangan?.endsWith(".docx");
          const missingLabel = `Belum: ${rapat.uangStatus.missing.join(", ")}`;

          return (
            <div
              key={rapat.id}
              className="flex flex-wrap items-center justify-between gap-4 py-4 first:pt-1"
            >
              <div className="flex items-center gap-3.5">
                <span
                  className={cn(
                    "h-11 w-1 rounded-full",
                    isComplete ? "bg-primary" : "bg-accent",
                  )}
                />
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-50 font-heading text-[12px] font-bold text-primary">
                  {isDoc ? "DOC" : "PDF"}
                </span>
                <div>
                  <Link
                    href={`/arsip/${rapat.id}`}
                    className="font-heading text-body-md font-bold text-ink hover:text-primary"
                  >
                    {rapat.judulRapat}
                  </Link>
                  <p className="text-body-sm text-ink-muted">
                    {formatShortDate(rapat.tanggal)} &middot; {rapat.hadirCount}{" "}
                    hadir &middot; Notulis {rapat.notulisNama.split(",")[0]}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <UangBadge status={rapat.uangStatus} />
                <StatusChip
                  status={isComplete ? "Lengkap" : missingLabel}
                  tone={isComplete ? "success" : "warning"}
                />
                <Link
                  href={`/arsip/${rapat.id}`}
                  aria-label={`Buka detail arsip ${rapat.judulRapat}`}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-50 text-primary hover:bg-primary hover:text-white transition-colors"
                >
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 text-body-sm text-ink-muted">
        <span>
          Menampilkan 1–{filteredRapat.length} dari {counts.total} rapat
        </span>
        <div className="flex items-center gap-1.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary font-heading text-body-sm font-bold text-white">
            1
          </span>
        </div>
      </div>
    </Card>
  );
}
