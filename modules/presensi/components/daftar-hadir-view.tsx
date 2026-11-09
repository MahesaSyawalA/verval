"use client";

import { CheckSquare, Download, FileEdit } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Button,
  Card,
  ErrorState,
  Skeleton,
  StatusChip,
} from "@/components/ui";
import { cn, getInitials } from "@/lib/utils";
import {
  type StatusKehadiranType,
  useRapatDetail,
} from "@/modules/rapat";
import { IsiPresensiModal } from "./isi-presensi-modal";

export interface DaftarHadirViewProps {
  rapatId: string;
}

const FILTER_TABS: Array<{
  key: "ALL" | StatusKehadiranType;
  label: string;
}> = [
  { key: "ALL", label: "Semua" },
  { key: "Hadir", label: "Hadir" },
  { key: "Izin", label: "Izin" },
  { key: "Sakit", label: "Sakit" },
  { key: "Belum_Hadir", label: "Belum" },
];

function formatShortDate(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return isoDate;
  return date.toLocaleDateString("id-ID", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatClock(isoDate: string | null): string {
  if (!isoDate) return "—";
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return "—";
  const hh = String(date.getUTCHours()).padStart(2, "0");
  const mm = String(date.getUTCMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

export function DaftarHadirView({ rapatId }: DaftarHadirViewProps) {
  const { data: rapat, isLoading, isError, error, refetch } =
    useRapatDetail(rapatId);
  const [activeTab, setActiveTab] = useState<"ALL" | StatusKehadiranType>("ALL");
  const [presensiOpen, setPresensiOpen] = useState(false);

  const filteredPeserta = useMemo(() => {
    const all = rapat?.peserta ?? [];
    if (activeTab === "ALL") return all;
    return all.filter((p) => p.statusKehadiran === activeTab);
  }, [rapat?.peserta, activeTab]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full rounded-3xl" />
        <Skeleton className="h-96 w-full rounded-3xl" />
      </div>
    );
  }

  if (isError || !rapat) {
    return (
      <ErrorState
        message={
          error instanceof Error
            ? error.message
            : "Daftar hadir rapat tidak ditemukan."
        }
        onRetry={() => refetch()}
      />
    );
  }

  const ringPercent =
    rapat.totalPeserta > 0
      ? Math.round((rapat.hadirCount / rapat.totalPeserta) * 100)
      : 0;
  const circumference = 2 * Math.PI * 52;
  const strokeDashoffset = circumference * (1 - ringPercent / 100);

  const tabCounts: Record<"ALL" | StatusKehadiranType, number> = {
    ALL: rapat.totalPeserta,
    Hadir: rapat.hadirCount,
    Izin: rapat.izinCount,
    Sakit: rapat.sakitCount,
    Belum_Hadir: rapat.belumHadirCount,
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left Column (8 cols): Daftar Hadir Table */}
      <div className="lg:col-span-8">
        <Card className="p-6 space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="font-heading text-h4 font-bold text-ink">
                Daftar Hadir
              </h2>
              <p className="mt-1 text-body-sm text-ink-muted">
                {rapat.judulRapat} &middot; {formatShortDate(rapat.tanggal)}{" "}
                &middot; {rapat.waktuMulai}–{rapat.waktuSelesai} &middot;{" "}
                {rapat.lokasi}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {rapat.statusRapat === "Berlangsung" && (
                <Button
                  variant="accent"
                  size="sm"
                  leftIcon={<CheckSquare className="h-4 w-4" />}
                  onClick={() => setPresensiOpen(true)}
                >
                  Isi Presensi
                </Button>
              )}
              <Link href={`/rapat/${rapat.id}/notulensi`}>
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<FileEdit className="h-4 w-4" />}
                >
                  Editor Notulensi
                </Button>
              </Link>
              <Button
                variant="outline"
                size="sm"
                leftIcon={<Download className="h-4 w-4" />}
                onClick={() => window.print()}
              >
                Unduh PDF
              </Button>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 rounded-2xl bg-surface p-1.5">
            {FILTER_TABS.map((tab) => {
              const active = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={cn(
                    "rounded-xl py-2 text-body-sm font-semibold transition-colors cursor-pointer",
                    active
                      ? "bg-primary text-white shadow-xs"
                      : "text-ink-muted hover:text-ink",
                  )}
                >
                  {tab.label} &middot; {tabCounts[tab.key]}
                </button>
              );
            })}
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-body-sm">
              <thead>
                <tr className="bg-surface text-ink-muted font-semibold">
                  <th className="px-4 py-3 rounded-l-xl">No</th>
                  <th className="px-4 py-3">Dosen</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Jam Tercatat</th>
                  <th className="px-4 py-3 rounded-r-xl">Keterangan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-soft">
                {filteredPeserta.map((p, idx) => {
                  const isNotulis = p.dosenId === rapat.notulisId;
                  const isKaprodi = p.dosenRole === "Kaprodi";

                  return (
                    <tr key={p.id} className="hover:bg-surface/40">
                      <td className="px-4 py-3.5 text-ink-muted">{idx + 1}</td>
                      <td className="px-4 py-3.5">
                        <div className="flex flex-wrap items-center gap-2.5">
                          <span
                            className={cn(
                              "flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-heading text-[12px] font-bold text-ink",
                              idx % 2 === 0 ? "bg-secondary" : "bg-accent",
                            )}
                          >
                            {getInitials(p.dosenNama).slice(0, 1)}
                          </span>
                          <span className="font-medium text-ink">
                            {p.dosenNama}
                          </span>
                          {isKaprodi && (
                            <span className="rounded-full bg-primary-50 px-2.5 py-0.5 text-[11px] font-bold text-primary">
                              Kaprodi
                            </span>
                          )}
                          {isNotulis && (
                            <span className="rounded-full bg-accent-100 px-2.5 py-0.5 text-[11px] font-bold text-warning-ink">
                              Notulis
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <StatusChip
                          status={
                            p.statusKehadiran === "Belum_Hadir"
                              ? "Belum"
                              : p.statusKehadiran
                          }
                          tone={
                            p.statusKehadiran === "Hadir"
                              ? "success"
                              : p.statusKehadiran === "Izin"
                                ? "primary"
                                : p.statusKehadiran === "Sakit"
                                  ? "warning"
                                  : "neutral"
                          }
                        />
                      </td>
                      <td className="px-4 py-3.5 font-medium text-ink">
                        {formatClock(p.waktuPresensi)}
                      </td>
                      <td className="px-4 py-3.5 text-ink-muted">
                        {p.keteranganAbsen ?? "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* T-03 Integration Banner */}
          <div className="flex items-center gap-3 rounded-2xl bg-primary-50 px-4 py-3 text-body-sm">
            <span className="rounded-full bg-primary px-3 py-0.5 text-[12px] font-bold text-white">
              T-03
            </span>
            <span className="font-medium text-ink">
              Modul 8: target &ldquo;Kehadiran rapat koordinasi&rdquo; terisi
              otomatis dari absensi ini.
            </span>
          </div>
        </Card>
      </div>

      {/* Right Column (4 cols): Ringkasan Kehadiran + Info Rapat + Bukti Kehadiran */}
      <div className="lg:col-span-4 space-y-6">
        <Card className="p-6 space-y-4">
          <h3 className="font-heading text-h6 font-bold text-ink">
            Ringkasan Kehadiran
          </h3>

          <div className="flex justify-center py-2">
            <div className="relative flex h-36 w-36 items-center justify-center">
              <svg
                className="-rotate-90 h-36 w-36"
                viewBox="0 0 120 120"
                aria-hidden="true"
              >
                <circle
                  cx="60"
                  cy="60"
                  r="52"
                  stroke="#E3E8F2"
                  strokeWidth="12"
                  fill="transparent"
                />
                <circle
                  cx="60"
                  cy="60"
                  r="52"
                  stroke="#0101B7"
                  strokeWidth="12"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  fill="transparent"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="font-heading text-h5 font-bold text-ink">
                  {rapat.hadirCount}/{rapat.totalPeserta}
                </span>
                <span className="text-[12px] text-ink-muted">hadir</span>
              </div>
            </div>
          </div>

          <div className="space-y-2 text-body-sm">
            <div className="flex items-center justify-between">
              <StatusChip status="Hadir" tone="success" />
              <span className="font-medium text-ink">
                {rapat.hadirCount} dosen
              </span>
            </div>
            <div className="flex items-center justify-between">
              <StatusChip status="Izin" tone="primary" />
              <span className="font-medium text-ink">
                {rapat.izinCount} dosen
              </span>
            </div>
            <div className="flex items-center justify-between">
              <StatusChip status="Sakit" tone="warning" />
              <span className="font-medium text-ink">
                {rapat.sakitCount} dosen
              </span>
            </div>
            <div className="flex items-center justify-between">
              <StatusChip status="Belum" tone="neutral" />
              <span className="font-medium text-ink">
                {rapat.belumHadirCount} dosen
              </span>
            </div>
          </div>
        </Card>

        <Card className="p-6 space-y-3">
          <h3 className="font-heading text-h6 font-bold text-ink">
            Info Rapat
          </h3>
          <dl className="space-y-2.5 text-body-sm">
            <div className="flex items-center justify-between">
              <dt className="text-ink-muted">Tempat</dt>
              <dd className="font-semibold text-ink">
                {rapat.lokasi} &middot; {rapat.format}
              </dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-ink-muted">Waktu</dt>
              <dd className="font-semibold text-ink">
                {rapat.waktuMulai} – {rapat.waktuSelesai} WIB
              </dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-ink-muted">Notulis</dt>
              <dd className="font-semibold text-ink">{rapat.notulisNama}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-ink-muted">Diundang</dt>
              <dd className="font-semibold text-ink">
                {rapat.totalPeserta} dosen
              </dd>
            </div>
            {rapat.kodePresensi && (
              <div className="flex items-center justify-between">
                <dt className="text-ink-muted">Kode Presensi</dt>
                <dd className="font-heading font-bold text-primary">
                  {rapat.kodePresensi}
                </dd>
              </div>
            )}
          </dl>
        </Card>

        <Card className="p-6 space-y-4">
          <h3 className="font-heading text-h6 font-bold text-ink">
            Bukti Kehadiran
          </h3>

          <div className="flex items-start gap-3 rounded-2xl bg-primary-50 p-4">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary font-heading text-body-sm font-bold text-white">
              A
            </span>
            <p className="text-[12px] text-ink leading-relaxed">
              Jam tercatat otomatis saat dosen klik Hadir, Izin, atau Sakit.
              Tersimpan sebagai bagian A di arsip rapat.
            </p>
          </div>

          <Button
            variant="primary"
            size="md"
            fullWidth
            leftIcon={<Download className="h-4 w-4" />}
            onClick={() => window.print()}
          >
            Unduh Daftar Hadir (PDF)
          </Button>
        </Card>
      </div>

      <IsiPresensiModal
        key={presensiOpen ? `presensi-${rapat.id}` : "closed"}
        isOpen={presensiOpen}
        onClose={() => setPresensiOpen(false)}
        rapat={rapat}
      />
    </div>
  );
}
