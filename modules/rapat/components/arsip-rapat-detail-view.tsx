"use client";

import { ChevronLeft, Download, Image as ImageIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import {
  Button,
  Card,
  ErrorState,
  Skeleton,
  StatusChip,
  UangBadge,
} from "@/components/ui";
import { cn } from "@/lib/utils";
import { UploadDokumentasiModal } from "@/modules/dokumentasi";
import { useRapatDetail } from "../hooks/use-rapat";
import { PreviewUndanganModal } from "./preview-undangan-modal";

export interface ArsipRapatDetailViewProps {
  rapatId: string;
}

function formatLongDate(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return isoDate;
  return date.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function ArsipRapatDetailView({ rapatId }: ArsipRapatDetailViewProps) {
  const { data: rapat, isLoading, isError, error, refetch } =
    useRapatDetail(rapatId);
  const [previewUndanganOpen, setPreviewUndanganOpen] = useState(false);
  const [uploadPhotoOpen, setUploadPhotoOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-28 w-full rounded-3xl" />
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
            : "Detail arsip rapat tidak ditemukan."
        }
        onRetry={() => refetch()}
      />
    );
  }

  const isComplete = rapat.uangStatus.isComplete;
  const completedPartsCount = 4 - rapat.uangStatus.missing.length;
  const attendancePercent =
    rapat.totalPeserta > 0
      ? Math.round((rapat.hadirCount / rapat.totalPeserta) * 100)
      : 0;

  return (
    <div className="space-y-6">
      {/* Top Banner Card */}
      <Card className="p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <Link
              href="/arsip"
              className="inline-flex items-center gap-1 text-body-sm font-semibold text-primary hover:underline"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Arsip Rapat</span>
            </Link>
            <h2 className="font-heading text-h4 font-bold text-ink">
              {rapat.judulRapat}
            </h2>
            <p className="text-body-sm text-ink-muted">
              {formatLongDate(rapat.tanggal)} &middot; {rapat.waktuMulai}–
              {rapat.waktuSelesai} &middot; {rapat.lokasi} &middot;{" "}
              {rapat.hadirCount} dari {rapat.totalPeserta} dosen hadir &middot;
              Notulis: {rapat.notulisNama.split(",")[0]}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="flex flex-col items-end gap-1.5">
              <UangBadge status={rapat.uangStatus} />
              <div className="flex items-center gap-2">
                <StatusChip
                  status={isComplete ? "Lengkap" : "Belum lengkap"}
                  tone={isComplete ? "success" : "warning"}
                />
                <span className="text-[12px] text-ink-muted">
                  {completedPartsCount} dari 4 bagian
                  {!isComplete
                    ? ` · kurang ${rapat.uangStatus.missing.join(", ")}`
                    : ""}
                </span>
              </div>
            </div>

            <Button
              variant="primary"
              size="md"
              leftIcon={<Download className="h-4 w-4" />}
              onClick={() => window.print()}
            >
              Unduh Paket Arsip
            </Button>
          </div>
        </div>
      </Card>

      {/* 2x2 Grid of U-A-N-G Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card U: Undangan */}
        <Card className="p-6 flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary font-heading text-body-md font-bold text-white">
                  U
                </span>
                <div>
                  <h3 className="font-heading text-h6 font-bold text-ink">
                    Undangan
                  </h3>
                  <p className="text-[12px] text-ink-muted">
                    Dikirim otomatis dari agenda rapat
                  </p>
                </div>
              </div>
              <StatusChip
                status={rapat.uangStatus.U ? "Lengkap" : "Belum"}
                tone={rapat.uangStatus.U ? "success" : "warning"}
              />
            </div>

            <div className="rounded-2xl bg-surface p-4 space-y-2.5">
              <div className="flex items-center gap-2.5 border-b border-primary pb-2.5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary font-heading text-body-sm font-bold text-white">
                  R
                </span>
                <div>
                  <p className="font-heading text-[12px] font-bold text-ink">
                    UNIVERSITAS PENDIDIKAN INDONESIA
                  </p>
                  <p className="text-[11px] text-ink-muted">
                    Kampus UPI di Cibiru &middot; Program Studi
                  </p>
                </div>
              </div>
              <p className="text-[12px] text-ink">
                Nomor &nbsp;: 009/UN40.CB/PRODI/X/2026
                <br />
                Perihal : Undangan {rapat.judulRapat}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setPreviewUndanganOpen(true)}
              className="flex-1 rounded-2xl bg-primary-50 py-2.5 text-body-sm font-bold text-primary hover:bg-primary-100 transition-colors cursor-pointer"
            >
              Lihat Undangan
            </button>
            <button
              type="button"
              onClick={() => setPreviewUndanganOpen(true)}
              aria-label="Unduh surat undangan"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-50 text-primary hover:bg-primary hover:text-white transition-colors cursor-pointer"
            >
              <Download className="h-4 w-4" />
            </button>
          </div>
        </Card>

        {/* Card A: Absensi */}
        <Card className="p-6 flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary font-heading text-body-md font-bold text-white">
                  A
                </span>
                <div>
                  <h3 className="font-heading text-h6 font-bold text-ink">
                    Absensi
                  </h3>
                  <p className="text-[12px] text-ink-muted">
                    Tercatat otomatis dari klik Hadir, Izin, Sakit
                  </p>
                </div>
              </div>
              <StatusChip
                status={rapat.uangStatus.A ? "Lengkap" : "Belum"}
                tone={rapat.uangStatus.A ? "success" : "warning"}
              />
            </div>

            <div className="rounded-2xl bg-surface p-4 space-y-3">
              <div className="grid grid-cols-4 gap-2.5">
                {[
                  {
                    label: "Hadir",
                    count: rapat.hadirCount,
                    tone: "success" as const,
                  },
                  {
                    label: "Izin",
                    count: rapat.izinCount,
                    tone: "primary" as const,
                  },
                  {
                    label: "Sakit",
                    count: rapat.sakitCount,
                    tone: "warning" as const,
                  },
                  {
                    label: "Belum",
                    count: rapat.belumHadirCount,
                    tone: "neutral" as const,
                  },
                ].map((box) => (
                  <div
                    key={box.label}
                    className="rounded-xl bg-white p-2.5 space-y-1 shadow-2xs"
                  >
                    <p className="font-heading text-h6 font-bold text-ink">
                      {box.count}
                    </p>
                    <StatusChip status={box.label} tone={box.tone} />
                  </div>
                ))}
              </div>

              <div className="h-2 w-full rounded-full bg-border-soft overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${attendancePercent}%` }}
                />
              </div>

              <p className="text-[12px] text-ink-muted">
                {rapat.hadirCount} dari {rapat.totalPeserta} dosen hadir (
                {attendancePercent}%)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              href={`/rapat/${rapat.id}`}
              className="flex-1 rounded-2xl bg-primary-50 py-2.5 text-center text-body-sm font-bold text-primary hover:bg-primary-100 transition-colors"
            >
              Lihat Daftar Hadir
            </Link>
            <Link
              href={`/rapat/${rapat.id}`}
              aria-label="Unduh daftar hadir"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-50 text-primary hover:bg-primary hover:text-white transition-colors"
            >
              <Download className="h-4 w-4" />
            </Link>
          </div>
        </Card>

        {/* Card N: Notulensi */}
        <Card className="p-6 flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary font-heading text-body-md font-bold text-white">
                  N
                </span>
                <div>
                  <h3 className="font-heading text-h6 font-bold text-ink">
                    Notulensi
                  </h3>
                  <p className="text-[12px] text-ink-muted">
                    {rapat.notulensi?.statusNotulensi ?? "Draf"} &middot;{" "}
                    {rapat.notulisNama.split(",")[0]}
                  </p>
                </div>
              </div>
              <StatusChip
                status={rapat.uangStatus.N ? "Lengkap" : "Belum"}
                tone={rapat.uangStatus.N ? "success" : "warning"}
              />
            </div>

            <div className="rounded-2xl bg-surface p-4 space-y-2.5 text-body-sm">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-ink-muted">
                  KEPUTUSAN
                </p>
                <p className="font-semibold text-ink">
                  {rapat.notulensi?.keputusan ??
                    "Notulensi rapat belum difinalisasi oleh notulis."}
                </p>
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-ink-muted">
                  TINDAK LANJUT
                </p>
                <p className="text-ink">
                  {rapat.notulensi?.tindakLanjut ??
                    "Silakan buka editor notulensi untuk melengkapi tindak lanjut."}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              href={`/rapat/${rapat.id}/notulensi`}
              className="flex-1 rounded-2xl bg-primary-50 py-2.5 text-center text-body-sm font-bold text-primary hover:bg-primary-100 transition-colors"
            >
              Baca Notulensi
            </Link>
            <Link
              href={`/rapat/${rapat.id}/notulensi`}
              aria-label="Unduh notulensi"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-50 text-primary hover:bg-primary hover:text-white transition-colors"
            >
              <Download className="h-4 w-4" />
            </Link>
          </div>
        </Card>

        {/* Card G: Gambar */}
        <Card className="p-6 flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary font-heading text-body-md font-bold text-white">
                  G
                </span>
                <div>
                  <h3 className="font-heading text-h6 font-bold text-ink">
                    Gambar
                  </h3>
                  <p className="text-[12px] text-ink-muted">
                    {rapat.dokumentasi.length > 0
                      ? `${rapat.dokumentasi.length} foto · diunggah ${rapat.notulisNama.split(",")[0]}`
                      : "Belum ada foto dokumentasi"}
                  </p>
                </div>
              </div>
              <StatusChip
                status={rapat.uangStatus.G ? "Lengkap" : "Belum ada"}
                tone={rapat.uangStatus.G ? "success" : "warning"}
              />
            </div>

            {rapat.dokumentasi.length > 0 ? (
              <div className="rounded-2xl bg-surface p-3.5">
                <div className="grid grid-cols-4 gap-2.5">
                  {[0, 1, 2, 3].map((slot) => {
                    const doc = rapat.dokumentasi[slot];
                    return (
                      <div
                        key={doc?.id ?? `slot-${slot}`}
                        title={doc?.caption ?? "Foto dokumentasi rapat"}
                        className={cn(
                          "flex h-28 items-center justify-center rounded-2xl text-ink-muted",
                          slot % 3 === 0
                            ? "bg-secondary/40"
                            : slot % 3 === 1
                              ? "bg-accent/55"
                              : "bg-primary-100",
                        )}
                      >
                        <ImageIcon className="h-6 w-6" />
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-2xl bg-surface px-4 py-8 text-center space-y-1.5">
                <ImageIcon className="h-7 w-7 text-ink-muted" />
                <p className="font-heading text-body-sm font-bold text-ink">
                  Belum ada foto
                </p>
                <p className="text-[12px] text-ink-muted">
                  Notulis atau peserta rapat bisa mengunggah foto
                </p>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            {rapat.dokumentasi.length > 0 ? (
              <button
                type="button"
                onClick={() => setUploadPhotoOpen(true)}
                className="flex-1 rounded-2xl bg-primary-50 py-2.5 text-body-sm font-bold text-primary hover:bg-primary-100 transition-colors cursor-pointer"
              >
                Lihat Galeri
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setUploadPhotoOpen(true)}
                className="flex-1 rounded-2xl bg-accent py-2.5 text-body-sm font-bold text-ink hover:bg-accent-500 transition-colors cursor-pointer"
              >
                Unggah Foto
              </button>
            )}
            <button
              type="button"
              onClick={() => setUploadPhotoOpen(true)}
              aria-label="Kelola foto dokumentasi"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-50 text-primary hover:bg-primary hover:text-white transition-colors cursor-pointer"
            >
              <Download className="h-4 w-4" />
            </button>
          </div>
        </Card>
      </div>

      <PreviewUndanganModal
        isOpen={previewUndanganOpen}
        onClose={() => setPreviewUndanganOpen(false)}
        data={{
          judulRapat: rapat.judulRapat,
          tanggal: rapat.tanggal,
          waktuMulai: rapat.waktuMulai,
          waktuSelesai: rapat.waktuSelesai,
          lokasi: rapat.lokasi,
          format: rapat.format,
        }}
      />

      <UploadDokumentasiModal
        key={uploadPhotoOpen ? `arsip-doc-${rapat.id}` : "arsip-doc-closed"}
        isOpen={uploadPhotoOpen}
        onClose={() => setUploadPhotoOpen(false)}
        rapat={rapat}
      />
    </div>
  );
}
