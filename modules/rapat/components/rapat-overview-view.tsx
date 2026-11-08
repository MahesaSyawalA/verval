"use client";

import {
  Bell,
  Calendar,
  CheckSquare,
  Download,
  FileText,
  Plus,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { UserRole } from "@/config/roles";
import {
  Button,
  Card,
  ErrorState,
  Skeleton,
  StatCard,
  StatusChip,
  UangBadge,
} from "@/components/ui";
import { cn } from "@/lib/utils";
import { useRapatList } from "../hooks/use-rapat";
import { CreateAgendaModal } from "./create-agenda-modal";

export interface RapatOverviewViewProps {
  userId: string;
  userRole: UserRole;
  onOpenPresensiModal?: (rapatId: string) => void;
}

function formatShortDate(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return isoDate;
  return date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function RapatOverviewView({
  userId,
  userRole,
  onOpenPresensiModal,
}: RapatOverviewViewProps) {
  const { data, isLoading, isError, error, refetch } = useRapatList();
  const [createAgendaOpen, setCreateAgendaOpen] = useState(false);

  const rapatList = useMemo(() => data?.data ?? [], [data?.data]);
  const userOptions = useMemo(
    () => data?.userOptions ?? [],
    [data?.userOptions],
  );

  const isKaprodiOrAdmin = userRole === "Kaprodi" || userRole === "Admin";

  const activeRapat = useMemo(
    () =>
      rapatList.find((r) => r.statusRapat === "Berlangsung") ?? rapatList[0],
    [rapatList],
  );

  const stats = useMemo(() => {
    const totalCount = rapatList.length;
    const completedUangCount = rapatList.filter(
      (r) => r.uangStatus.isComplete,
    ).length;

    const totalInvited = rapatList.reduce((acc, r) => acc + r.totalPeserta, 0);
    const totalPresent = rapatList.reduce((acc, r) => acc + r.hadirCount, 0);
    const attendanceRate =
      totalInvited > 0 ? Math.round((totalPresent / totalInvited) * 100) : 92;

    return {
      todayCount: Math.min(3, totalCount || 3),
      attendanceRate,
      totalCount: totalCount || 12,
      completedUangCount,
    };
  }, [rapatList]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <Skeleton className="h-28 w-full rounded-3xl" />
          <Skeleton className="h-28 w-full rounded-3xl" />
          <Skeleton className="h-28 w-full rounded-3xl" />
          <Skeleton className="h-28 w-full rounded-3xl" />
        </div>
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
            : "Gagal memuat daftar jadwal dan agenda rapat."
        }
        onRetry={() => refetch()}
      />
    );
  }

  const ringCount = activeRapat?.hadirCount ?? 8;
  const ringTotal = activeRapat?.totalPeserta ?? 12;
  const ringPercent =
    ringTotal > 0 ? Math.round((ringCount / ringTotal) * 100) : 67;
  const circumference = 2 * Math.PI * 52;
  const strokeDashoffset = circumference * (1 - ringPercent / 100);

  return (
    <div className="space-y-6">
      {/* 4 StatCards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title={isKaprodiOrAdmin ? "Rapat Hari Ini" : "Rapat Minggu Ini"}
          value={stats.todayCount}
          delta="+1"
          icon={<Calendar className="h-5 w-5" />}
        />
        <StatCard
          title={isKaprodiOrAdmin ? "Presensi Hadir" : "Pengingat Aktif"}
          value={isKaprodiOrAdmin ? `${stats.attendanceRate}%` : 2}
          delta={isKaprodiOrAdmin ? "+4%" : "Baru"}
          icon={<Users className="h-5 w-5" />}
        />
        <StatCard
          title={isKaprodiOrAdmin ? "Notulensi Bulan Ini" : "Kehadiran Saya"}
          value={isKaprodiOrAdmin ? stats.totalCount : `${stats.attendanceRate}%`}
          delta={isKaprodiOrAdmin ? "+3" : "+4%"}
          icon={<FileText className="h-5 w-5" />}
        />
        <StatCard
          title={isKaprodiOrAdmin ? "Arsip UANG Lengkap" : "Arsip Rapat Saya"}
          value={
            isKaprodiOrAdmin
              ? `${stats.completedUangCount}/${rapatList.length}`
              : rapatList.length
          }
          delta={isKaprodiOrAdmin ? "+2" : "+1"}
          highlighted
          icon={<CheckSquare className="h-5 w-5" />}
        />
      </div>

      {/* Main Grid: Left (8 cols) + Right (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-8 space-y-6">
          {/* Card 1: Agenda Rapat Hari Ini / Jadwal Rapat Minggu Ini */}
          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-heading text-h6 font-bold text-ink">
                {isKaprodiOrAdmin
                  ? "Agenda Rapat Hari Ini"
                  : "Jadwal Rapat Minggu Ini"}
              </h3>
              <span className="text-body-sm font-semibold text-primary">
                {isKaprodiOrAdmin
                  ? "Rabu, 21 Okt 2026"
                  : "Pekan 21–27 Okt 2026"}
              </span>
            </div>

            <div className="space-y-3">
              {rapatList.slice(0, 3).map((rapat) => {
                const isOngoing = rapat.statusRapat === "Berlangsung";
                const myAttendance = rapat.peserta.find(
                  (p) => p.dosenId === userId,
                );
                const isAlreadyPresent =
                  myAttendance?.statusKehadiran === "Hadir";
                const isNotulis = rapat.notulisId === userId;

                return (
                  <div
                    key={rapat.id}
                    className={cn(
                      "flex flex-wrap items-center justify-between gap-4 rounded-2xl p-4 transition-colors",
                      isOngoing
                        ? "bg-primary text-white shadow-sm"
                        : "bg-surface text-ink",
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={cn(
                          "flex min-w-[76px] flex-col items-center justify-center rounded-xl px-3 py-2 text-center",
                          isOngoing
                            ? "bg-accent text-ink"
                            : "bg-white text-ink shadow-2xs",
                        )}
                      >
                        <span className="font-heading text-body-md font-bold leading-tight">
                          {rapat.waktuMulai}
                        </span>
                        <span className="text-[11px] opacity-80">
                          {rapat.waktuSelesai}
                        </span>
                      </div>

                      <div>
                        <Link
                          href={`/rapat/${rapat.id}`}
                          className={cn(
                            "font-heading text-body-md font-bold hover:underline",
                            isOngoing ? "text-white" : "text-ink",
                          )}
                        >
                          {rapat.judulRapat}
                        </Link>
                        <p
                          className={cn(
                            "text-body-sm",
                            isOngoing ? "text-white/80" : "text-ink-muted",
                          )}
                        >
                          {rapat.lokasi} &middot; {rapat.totalPeserta} peserta
                          {isNotulis ? " · Anda Notulis" : ""}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {isNotulis && (
                        <Link
                          href={`/rapat/${rapat.id}/notulensi`}
                          className={cn(
                            "rounded-full px-3 py-1 text-[12px] font-bold transition-colors",
                            isOngoing
                              ? "bg-white/20 text-white hover:bg-white/30"
                              : "bg-primary-50 text-primary hover:bg-primary-100",
                          )}
                        >
                          Editor Notulensi
                        </Link>
                      )}

                      {isOngoing ? (
                        <button
                          type="button"
                          onClick={() => onOpenPresensiModal?.(rapat.id)}
                          className="rounded-full bg-accent px-4 py-1 text-body-sm font-bold text-ink hover:bg-accent-500 cursor-pointer"
                        >
                          {isKaprodiOrAdmin ? "Berlangsung" : "Isi Presensi"}
                        </button>
                      ) : rapat.statusRapat === "Selesai" ? (
                        <StatusChip
                          status={
                            !isKaprodiOrAdmin && isAlreadyPresent
                              ? "Sudah Hadir"
                              : "Selesai"
                          }
                          tone="success"
                        />
                      ) : (
                        <StatusChip
                          status={isKaprodiOrAdmin ? "Menunggu" : "H-1"}
                          tone="warning"
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Card 2: Arsip Rapat (UANG) / Arsip Rapat Saya */}
          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-heading text-h6 font-bold text-ink">
                {isKaprodiOrAdmin ? "Arsip Rapat (UANG)" : "Arsip Rapat Saya"}
              </h3>
              <Link
                href="/arsip"
                className="text-body-sm font-semibold text-primary hover:underline"
              >
                Lihat arsip
              </Link>
            </div>

            <div className="divide-y divide-border-soft">
              {rapatList.map((rapat) => {
                const isDoc = rapat.fileUndangan?.endsWith(".docx");
                const isComplete = rapat.uangStatus.isComplete;

                return (
                  <div
                    key={rapat.id}
                    className="flex flex-wrap items-center justify-between gap-4 py-3.5 first:pt-0 last:pb-0"
                  >
                    <div className="flex items-center gap-3.5">
                      <span
                        className={cn(
                          "h-10 w-1 rounded-full",
                          isComplete ? "bg-primary" : "bg-accent",
                        )}
                      />
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-50 font-heading text-[11px] font-bold text-primary">
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
                          {formatShortDate(rapat.tanggal)} &middot;{" "}
                          {isKaprodiOrAdmin
                            ? `${rapat.hadirCount} hadir`
                            : "Anda hadir"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {isKaprodiOrAdmin && !isComplete && (
                        <Link
                          href={`/arsip/${rapat.id}`}
                          className="rounded-full bg-accent px-3.5 py-1 text-body-sm font-bold text-ink hover:bg-accent-500"
                        >
                          Lengkapi
                        </Link>
                      )}
                      <UangBadge status={rapat.uangStatus} />
                      <Link
                        href={`/arsip/${rapat.id}`}
                        aria-label={`Unduh paket arsip ${rapat.judulRapat}`}
                        className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-50 text-primary hover:bg-primary hover:text-white transition-colors"
                      >
                        <Download className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Right Column: Aksi Cepat + Presensi Hari Ini */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="p-6 space-y-4">
            <h3 className="font-heading text-h6 font-bold text-ink">
              Aksi Cepat
            </h3>

            <div className="space-y-3">
              {isKaprodiOrAdmin && (
                <button
                  type="button"
                  onClick={() => setCreateAgendaOpen(true)}
                  className="flex w-full items-center gap-3.5 rounded-2xl bg-primary p-4 text-left text-white hover:bg-primary-700 transition-colors cursor-pointer"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-primary">
                    <Plus className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="font-heading text-body-md font-bold">
                      Buat Agenda Rapat
                    </p>
                    <p className="text-[12px] text-white/80">
                      Jadwal &amp; undangan
                    </p>
                  </div>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  if (activeRapat) {
                    onOpenPresensiModal?.(activeRapat.id);
                  }
                }}
                className="flex w-full items-center gap-3.5 rounded-2xl bg-primary p-4 text-left text-white hover:bg-primary-700 transition-colors cursor-pointer"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-primary">
                  <CheckSquare className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-heading text-body-md font-bold">
                    Isi Presensi
                  </p>
                  <p className="text-[12px] text-white/80">
                    Klik hadir &middot; rapat berlangsung
                  </p>
                </div>
              </button>

              {!isKaprodiOrAdmin && (
                <div className="flex w-full items-center gap-3.5 rounded-2xl bg-primary p-4 text-left text-white">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-primary">
                    <Bell className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="font-heading text-body-md font-bold">
                      Pengingat Aktif
                    </p>
                    <p className="text-[12px] text-white/80">
                      H-1 dan 1 jam sebelum rapat
                    </p>
                  </div>
                </div>
              )}

              <Link
                href="/arsip"
                className="flex w-full items-center gap-3.5 rounded-2xl bg-secondary/25 p-4 text-left text-ink hover:bg-secondary/40 transition-colors"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-white">
                  <Download className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-heading text-body-md font-bold text-ink">
                    {isKaprodiOrAdmin ? "Lihat Arsip" : "Arsip Saya"}
                  </p>
                  <p className="text-[12px] text-ink-muted">
                    {isKaprodiOrAdmin
                      ? "Paket U-A-N-G per rapat"
                      : "Baca notulensi rapat"}
                  </p>
                </div>
              </Link>
            </div>
          </Card>

          <Card className="p-6 space-y-4">
            <h3 className="font-heading text-h6 font-bold text-ink">
              {isKaprodiOrAdmin ? "Presensi Hari Ini" : "Presensi Saya"}
            </h3>

            <p className="text-center text-body-sm text-ink-muted">
              {isKaprodiOrAdmin
                ? (activeRapat?.judulRapat ?? "Evaluasi Kinerja Dosen")
                : "Rapat Okt 2026"}
            </p>

            {/* Ring Chart */}
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
                    {isKaprodiOrAdmin ? `${ringCount}/${ringTotal}` : "11/12"}
                  </span>
                  <span className="text-[12px] text-ink-muted">hadir</span>
                </div>
              </div>
            </div>

            {activeRapat && (
              <Link href={`/rapat/${activeRapat.id}`} className="block">
                <Button variant="accent" size="md" fullWidth>
                  {isKaprodiOrAdmin ? "Lihat Daftar Hadir" : "Riwayat Presensi"}
                </Button>
              </Link>
            )}
          </Card>
        </div>
      </div>

      <CreateAgendaModal
        key={createAgendaOpen ? `agenda-${rapatList.length}` : "closed"}
        isOpen={createAgendaOpen}
        onClose={() => setCreateAgendaOpen(false)}
        userOptions={userOptions}
      />
    </div>
  );
}
