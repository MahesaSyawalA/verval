"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/layout";
import { Button, Card, ErrorState, Skeleton } from "@/components/ui";
import { cn, getInitials } from "@/lib/utils";
import { useTargets } from "@/modules/target";
import { useTickets } from "../hooks/use-tickets";
import { STATUS_TIKET_VALUES, type StatusTiketType } from "../types";
import { CreateTicketModal } from "./create-ticket-modal";
import { TicketStatusWithSteps } from "./ticket-status-steps";

export interface KaprodiTicketListProps {
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

export function KaprodiTicketList({ userFullName }: KaprodiTicketListProps) {
  const [activeTab, setActiveTab] = useState<"ALL" | StatusTiketType>("ALL");
  const [dosenFilter, setDosenFilter] = useState<string>("ALL");
  const [search, setSearch] = useState<string>("");
  const [createOpen, setCreateOpen] = useState(false);

  const { data, isLoading, isError, error, refetch } = useTickets();
  const { data: targets = [] } = useTargets();

  const allTickets = data?.data ?? [];
  const dosenOptions = data?.dosenOptions ?? [];

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: allTickets.length };
    for (const st of STATUS_TIKET_VALUES) {
      counts[st] = allTickets.filter((t) => t.status === st).length;
    }
    return counts;
  }, [allTickets]);

  const filteredTickets = useMemo(() => {
    return allTickets.filter((t) => {
      if (activeTab !== "ALL" && t.status !== activeTab) return false;
      if (dosenFilter !== "ALL" && t.dosenId !== dosenFilter) return false;
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const matches =
          t.kodeTiket.toLowerCase().includes(q) ||
          t.namaTarget.toLowerCase().includes(q) ||
          t.kodeTarget.toLowerCase().includes(q) ||
          t.dosenNama.toLowerCase().includes(q);
        if (!matches) return false;
      }
      return true;
    });
  }, [allTickets, activeTab, dosenFilter, search]);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Daftar Tiket Penugasan"
        description="Setiap target yang ditugaskan ke dosen menjadi satu tiket"
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

        {/* Filters + Create Button */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3 flex-1">
            <div className="flex flex-col rounded-2xl border border-border-soft bg-white px-3.5 py-1.5 min-w-[160px]">
              <label
                htmlFor="kaprodi-status-select"
                className="text-[11px] text-ink-muted"
              >
                Status
              </label>
              <select
                id="kaprodi-status-select"
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

            <div className="flex flex-col rounded-2xl border border-border-soft bg-white px-3.5 py-1.5 min-w-[190px]">
              <label
                htmlFor="kaprodi-dosen-select"
                className="text-[11px] text-ink-muted"
              >
                Dosen
              </label>
              <select
                id="kaprodi-dosen-select"
                value={dosenFilter}
                onChange={(e) => setDosenFilter(e.target.value)}
                className="bg-transparent text-body-sm font-semibold text-ink focus:outline-none"
              >
                <option value="ALL">Semua dosen</option>
                {dosenOptions.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.namaLengkap}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col rounded-2xl border border-border-soft bg-white px-4 py-1.5 min-w-[240px] flex-1 max-w-sm">
              <label
                htmlFor="kaprodi-search-input"
                className="text-[11px] text-ink-muted"
              >
                Pencarian
              </label>
              <input
                id="kaprodi-search-input"
                type="search"
                placeholder="Kode tiket, target, dosen..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-transparent text-body-sm text-ink placeholder:text-ink-subtle focus:outline-none"
              />
            </div>
          </div>

          <Button
            variant="primary"
            size="md"
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() => setCreateOpen(true)}
          >
            Buat Penugasan
          </Button>
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
                : "Gagal memuat daftar tiket penugasan."
            }
            onRetry={() => refetch()}
          />
        ) : (
          <div className="w-full overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-border-soft text-body-sm font-semibold uppercase tracking-wider text-ink-muted">
                  <th className="px-4 py-3">TIKET</th>
                  <th className="px-4 py-3">DOSEN</th>
                  <th className="px-4 py-3">PROGRES BUKTI</th>
                  <th className="px-4 py-3">STATUS</th>
                  <th className="px-4 py-3">TENGGAT</th>
                  <th className="px-4 py-3 text-right">AKSI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-soft/80">
                {filteredTickets.map((t) => {
                  const isWaitingVerify = t.status === "Menunggu_Verifikasi";
                  const isComplete = t.status === "Tercapai";

                  return (
                    <tr
                      key={t.id}
                      className={cn(
                        "transition-colors",
                        isWaitingVerify
                          ? "bg-accent-50/70 hover:bg-accent-50"
                          : "hover:bg-surface/50",
                      )}
                    >
                      <td className="px-4 py-4">
                        <p className="font-heading text-body-sm font-bold text-primary">
                          {t.kodeTiket}
                        </p>
                        <p className="font-heading text-body-md font-semibold text-ink">
                          {t.namaTarget}
                        </p>
                        <p className="text-body-sm text-ink-muted">
                          {t.kodeTarget} · {t.satuan}
                        </p>
                      </td>

                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary font-heading text-body-sm font-bold text-primary">
                            {getInitials(t.dosenNama)}
                          </span>
                          <span className="text-body-sm font-medium text-ink">
                            {t.dosenNama}
                          </span>
                        </div>
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
                        <Link
                          href={`/tiket/${t.id}`}
                          className={cn(
                            "inline-flex h-9 items-center justify-center rounded-full px-4 text-body-sm font-semibold transition-colors",
                            isWaitingVerify
                              ? "bg-accent text-ink hover:bg-accent-500"
                              : "border border-primary/30 bg-white text-primary hover:bg-primary-50",
                          )}
                        >
                          {isWaitingVerify
                            ? "Verifikasi"
                            : t.status === "Ditolak"
                              ? "Revisi"
                              : "Lihat"}
                        </Link>
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

      <CreateTicketModal
        key={createOpen ? `open-${allTickets.length}` : "closed"}
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        targets={targets}
        dosenOptions={dosenOptions}
        nextTicketNumber={allTickets.length + 22}
      />
    </div>
  );
}
