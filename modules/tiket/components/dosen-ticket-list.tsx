"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/layout";
import { BareInput, Card, ErrorState, Skeleton } from "@/components/ui";
import { cn, getInitials } from "@/lib/utils";
import { useTickets } from "../hooks/use-tickets";
import {
  STATUS_TIKET_VALUES,
  type StatusTiketType,
  type TicketItem,
} from "../types";
import { TicketStatusWithSteps } from "./ticket-status-steps";
import { UploadBuktiModal } from "./upload-bukti-modal";

export interface DosenTicketListProps {
  userFullName: string;
}

const STATUS_TABS: Array<{ key: "ALL" | StatusTiketType; label: string }> = [
  { key: "ALL", label: "Semua" },
  { key: "Ditugaskan", label: "Ditugaskan" },
  { key: "Dikerjakan", label: "Dikerjakan" },
  { key: "Menunggu_Verifikasi", label: "Menunggu Verifikasi" },
  { key: "Tercapai", label: "Tercapai" },
  { key: "Ditolak", label: "Ditolak" },
];

function formatShortDate(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return isoDate;
  return date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
  });
}

export function DosenTicketList({ userFullName }: DosenTicketListProps) {
  const [activeTab, setActiveTab] = useState<"ALL" | StatusTiketType>("ALL");
  const [search, setSearch] = useState<string>("");
  const [uploadingTicket, setUploadingTicket] = useState<TicketItem | null>(
    null,
  );

  const { data, isLoading, isError, error, refetch } = useTickets();
  const allTickets = useMemo(() => data?.data ?? [], [data?.data]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: allTickets.length };
    for (const st of STATUS_TIKET_VALUES) {
      counts[st] = allTickets.filter((t) => t.status === st).length;
    }
    return counts;
  }, [allTickets]);

  const actionRequiredCount = useMemo(
    () =>
      allTickets.filter(
        (t) =>
          t.status === "Ditugaskan" ||
          t.status === "Dikerjakan" ||
          t.status === "Ditolak",
      ).length,
    [allTickets],
  );

  const filteredTickets = useMemo(() => {
    return allTickets.filter((t) => {
      if (activeTab !== "ALL" && t.status !== activeTab) return false;
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        return (
          t.kodeTiket.toLowerCase().includes(q) ||
          t.namaTarget.toLowerCase().includes(q) ||
          t.kodeTarget.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [allTickets, activeTab, search]);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Tiket Saya"
        description="Tugas dari Kaprodi yang perlu kamu kerjakan dan buktikan"
        actions={
          <div className="flex items-center gap-2.5">
            <span className="rounded-full bg-white px-4 py-1.5 text-body-sm font-semibold text-primary shadow-xs border border-border-soft">
              Tahun 2026
            </span>
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary font-heading text-body-sm font-bold text-primary">
              {getInitials(userFullName)}
            </span>
          </div>
        }
      />

      <Card className="p-6 space-y-5">
        {actionRequiredCount > 0 && (
          <div className="flex items-center gap-3 rounded-2xl bg-warning-bg px-4 py-3 text-body-sm font-semibold text-warning-ink">
            <span className="h-2.5 w-2.5 rounded-full bg-accent-600 shrink-0" />
            <span>
              {actionRequiredCount} tiket perlu tindakanmu: unggah bukti
              penugasan aktif dan perbaiki bukti tiket yang ditolak.
            </span>
          </div>
        )}

        {/* Status Filter Pills */}
        <div className="flex flex-wrap items-center gap-2.5">
          {STATUS_TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full px-4 py-2 text-body-sm font-semibold transition-colors cursor-pointer",
                  isActive
                    ? "bg-primary text-white shadow-xs"
                    : "bg-surface text-ink hover:bg-primary-50",
                )}
              >
                <span>{tab.label}</span>
                <span
                  className={cn(
                    "inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-bold",
                    isActive
                      ? "bg-white text-primary"
                      : "bg-primary-50 text-primary",
                  )}
                >
                  {statusCounts[tab.key] ?? 0}
                </span>
              </button>
            );
          })}
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-col rounded-2xl border border-border-soft bg-white px-3.5 py-1.5 min-w-[160px]">
            <label
              htmlFor="dosen-status-select"
              className="text-[11px] text-ink-muted"
            >
              Status
            </label>
            <select
              id="dosen-status-select"
              value={activeTab}
              onChange={(e) =>
                setActiveTab(e.target.value as "ALL" | StatusTiketType)
              }
              className="bg-transparent text-body-sm font-semibold text-ink focus:outline-none"
            >
              {STATUS_TABS.map((tab) => (
                <option key={tab.key} value={tab.key}>
                  {tab.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col rounded-2xl border border-border-soft bg-white px-4 py-1.5 min-w-[260px] flex-1 max-w-sm">
            <label
              htmlFor="dosen-search-input"
              className="text-[11px] text-ink-muted"
            >
              Pencarian
            </label>
            <BareInput
              id="dosen-search-input"
              type="search"
              placeholder="Kode tiket, target, dosen..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent text-body-sm text-ink placeholder:text-ink-subtle focus:outline-none"
            />
          </div>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="space-y-3 py-4">
            <Skeleton className="h-14 w-full rounded-2xl" />
            <Skeleton className="h-18 w-full rounded-2xl" />
            <Skeleton className="h-18 w-full rounded-2xl" />
          </div>
        ) : isError ? (
          <ErrorState
            message={
              error instanceof Error
                ? error.message
                : "Gagal memuat daftar tiket saya."
            }
            onRetry={() => refetch()}
          />
        ) : (
          <div className="w-full overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-border-soft text-body-sm font-semibold uppercase tracking-wider text-ink-muted">
                  <th className="px-4 py-3">TIKET</th>
                  <th className="px-4 py-3">PROGRES BUKTI</th>
                  <th className="px-4 py-3">STATUS</th>
                  <th className="px-4 py-3">TENGGAT</th>
                  <th className="px-4 py-3 text-right">AKSI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-soft/80">
                {filteredTickets.map((t) => {
                  const isRejected = t.status === "Ditolak";
                  const canUploadDirect =
                    t.status === "Ditugaskan" || t.status === "Dikerjakan";
                  const isComplete = t.status === "Tercapai";

                  return (
                    <tr
                      key={t.id}
                      className={cn(
                        "transition-colors",
                        isRejected
                          ? "bg-danger-bg/25 hover:bg-danger-bg/40"
                          : canUploadDirect
                            ? "bg-accent-50/60 hover:bg-accent-50"
                            : "hover:bg-surface/50",
                      )}
                    >
                      <td className="px-4 py-4">
                        <Link
                          href={`/tiket/${t.id}`}
                          className="font-heading text-body-sm font-bold text-primary hover:underline"
                        >
                          {t.kodeTiket}
                        </Link>
                        <p className="font-heading text-body-md font-semibold text-ink">
                          {t.namaTarget}
                        </p>
                        <p className="text-body-sm text-ink-muted">
                          {t.kodeTarget} ·{" "}
                          {isRejected
                            ? "perlu revisi bukti"
                            : "dari Pak Iqbal"}
                        </p>
                      </td>

                      <td className="px-4 py-4 min-w-[160px]">
                        <p className="text-body-sm font-medium text-ink mb-1.5">
                          {t.progresSubmisiCount}/{t.kuantitasDitugaskan} ·{" "}
                          {t.progresPersen}%
                        </p>
                        <div className="h-2 w-32 rounded-full bg-border-soft overflow-hidden">
                          <div
                            className={cn(
                              "h-full rounded-full transition-all",
                              isComplete ? "bg-success" : "bg-primary",
                            )}
                            style={{ width: `${t.progresPersen}%` }}
                          />
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <TicketStatusWithSteps status={t.status} />
                      </td>

                      <td className="px-4 py-4 text-body-sm font-medium text-ink">
                        {formatShortDate(t.tenggatWaktu)}
                      </td>

                      <td className="px-4 py-4 text-right">
                        {canUploadDirect ? (
                          <button
                            type="button"
                            onClick={() => setUploadingTicket(t)}
                            className="inline-flex h-9 items-center justify-center rounded-full bg-accent px-4 text-body-sm font-semibold text-ink hover:bg-accent-500 transition-colors cursor-pointer"
                          >
                            Unggah Bukti
                          </button>
                        ) : isRejected ? (
                          <Link
                            href={`/tiket/${t.id}`}
                            className="inline-flex h-9 items-center justify-center rounded-full bg-danger px-4 text-body-sm font-semibold text-white hover:opacity-90 transition-opacity"
                          >
                            Perbaiki
                          </Link>
                        ) : (
                          <Link
                            href={`/tiket/${t.id}`}
                            className="inline-flex h-9 items-center justify-center rounded-full border border-primary/30 bg-white px-4 text-body-sm font-semibold text-primary hover:bg-primary-50 transition-colors"
                          >
                            Lihat
                          </Link>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="pt-2 text-body-sm text-ink-muted">
          1 - {filteredTickets.length} dari {allTickets.length} data
        </div>
      </Card>

      {uploadingTicket && (
        <UploadBuktiModal
          key={uploadingTicket.id}
          isOpen={Boolean(uploadingTicket)}
          onClose={() => setUploadingTicket(null)}
          ticket={uploadingTicket}
        />
      )}
    </div>
  );
}
