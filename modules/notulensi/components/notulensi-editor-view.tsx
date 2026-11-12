"use client";

import { useState, useEffect } from "react";
import {
  Alert,
  Button,
  Card,
  ErrorState,
  Skeleton,
  StatusChip,
  TextArea,
  TextAreaSkeleton,
} from "@/components/ui";
import { cn, getInitials } from "@/lib/utils";
import { validateAndSanitizeForm } from "@/lib/security-client";
import { UploadDokumentasiModal } from "@/modules/dokumentasi";
import { type RapatItem, useRapatDetail } from "@/modules/rapat";
import { useSaveNotulensi } from "../hooks/use-notulensi";
import { saveNotulensiSchema } from "../schemas/notulensi.schema";
import type { StatusNotulensiType } from "../types";

export interface NotulensiEditorViewProps {
  rapatId: string;
  currentUserId: string;
  onOpenUploadDokumentasi?: () => void;
}

function formatLongDate(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return isoDate;
  return date.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function NotulensiEditorForm({
  rapat,
  currentUserId,
  onOpenUploadDokumentasi,
}: {
  rapat: RapatItem;
  currentUserId: string;
  onOpenUploadDokumentasi?: () => void;
}) {
  const saveMutation = useSaveNotulensi(rapat.id);

  const [agendaPembahasan, setAgendaPembahasan] = useState(
    () => rapat.notulensi?.agendaPembahasan ?? rapat.deskripsiAgenda ?? "",
  );
  const [halDibahas, setHalDibahas] = useState(
    () => rapat.notulensi?.halDibahas ?? "",
  );
  const [keputusan, setKeputusan] = useState(
    () => rapat.notulensi?.keputusan ?? "",
  );
  const [tindakLanjut, setTindakLanjut] = useState(
    () => rapat.notulensi?.tindakLanjut ?? "",
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  useEffect(() => {
    setAgendaPembahasan(
      rapat.notulensi?.agendaPembahasan ?? rapat.deskripsiAgenda ?? "",
    );
    setHalDibahas(rapat.notulensi?.halDibahas ?? "");
    setKeputusan(rapat.notulensi?.keputusan ?? "");
    setTindakLanjut(rapat.notulensi?.tindakLanjut ?? "");
    setErrorMessage(null);
    setFeedbackMessage(null);
  }, [rapat.id, rapat.notulensi, rapat.deskripsiAgenda]);

  const currentStatus: StatusNotulensiType =
    rapat.notulensi?.statusNotulensi ?? "Draf";
  const isFinal = currentStatus === "Final";
  const isNotulis = rapat.notulisId === currentUserId;
  const canEdit = isNotulis && !isFinal;

  async function handleSave(statusNotulensi: StatusNotulensiType) {
    setErrorMessage(null);
    setFeedbackMessage(null);

    const sanitized = validateAndSanitizeForm({
      agendaPembahasan,
      halDibahas,
      keputusan,
      tindakLanjut,
      statusNotulensi,
    });

    if (!sanitized) {
      return;
    }

    const parsed = saveNotulensiSchema.safeParse(sanitized);

    if (!parsed.success) {
      setErrorMessage(
        parsed.error.issues[0]?.message ?? "Isian notulensi belum lengkap.",
      );
      return;
    }

    try {
      await saveMutation.mutateAsync(parsed.data);
      setFeedbackMessage(
        statusNotulensi === "Final"
          ? "Notulensi berhasil difinalisasi dan disimpan ke Arsip Rapat."
          : "Draf notulensi berhasil disimpan.",
      );
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Gagal menyimpan notulensi.",
      );
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left Column (8 cols): Editor Notulensi */}
      <div className="lg:col-span-8">
        <Card className="p-6 space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="font-heading text-h4 font-bold text-ink">
                Notulensi Rapat
              </h2>
              <p className="mt-1 text-body-sm text-ink-muted">
                {rapat.judulRapat} &middot; {formatLongDate(rapat.tanggal)}{" "}
                &middot; {rapat.waktuMulai}–{rapat.waktuSelesai}
              </p>
            </div>
            <StatusChip
              status={currentStatus}
              tone={isFinal ? "success" : "warning"}
            />
          </div>

          {/* Mode Tabs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 rounded-2xl bg-surface p-1.5">
            <button
              type="button"
              className="rounded-xl bg-primary py-2.5 text-body-sm font-semibold text-white shadow-xs"
            >
              Ketik via template
            </button>
            <div className="flex items-center justify-center gap-2 rounded-xl py-2.5 text-body-sm font-medium text-ink-muted">
              <span>Voice-to-text</span>
              <span className="rounded-full bg-accent-100 px-2.5 py-0.5 text-[11px] font-bold text-warning-ink">
                Segera hadir
              </span>
            </div>
            <div className="flex items-center justify-center rounded-xl py-2.5 text-body-sm font-medium text-ink-muted">
              Unggah PPT
            </div>
          </div>

          {/* Template Document Box */}
          <div className="rounded-2xl border border-border-soft bg-card p-6 space-y-5">
            {/* Header Kop UPI */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-primary pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary font-heading text-body-lg font-bold text-white">
                  R
                </div>
                <div>
                  <p className="font-heading text-body-sm font-bold text-ink">
                    UNIVERSITAS PENDIDIKAN INDONESIA
                  </p>
                  <p className="text-[12px] text-ink-muted">
                    Kampus UPI di Cibiru &middot; Program Studi
                  </p>
                </div>
              </div>
              <span className="rounded-full bg-primary-50 px-3.5 py-1 text-[11px] font-bold text-brand">
                NOTULENSI RAPAT
              </span>
            </div>

            {/* Meta Jadwal */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-body-sm">
              <div>
                <p className="text-[12px] text-ink-muted">Hari/Tanggal</p>
                <p className="font-semibold text-ink">
                  {formatLongDate(rapat.tanggal)}
                </p>
              </div>
              <div>
                <p className="text-[12px] text-ink-muted">Waktu</p>
                <p className="font-semibold text-ink">
                  {rapat.waktuMulai.replace(":", ".")} –{" "}
                  {rapat.waktuSelesai.replace(":", ".")} WIB
                </p>
              </div>
              <div>
                <p className="text-[12px] text-ink-muted">Tempat</p>
                <p className="font-semibold text-ink">{rapat.lokasi}</p>
              </div>
            </div>

            {/* Ringkasan Hadir */}
            <div className="flex flex-wrap items-center gap-3">
              <StatusChip
                status={`${rapat.hadirCount} hadir dari ${rapat.totalPeserta} diundang`}
                tone="success"
              />
              <span className="text-[12px] text-ink-muted">
                Daftar hadir terisi otomatis dari presensi
              </span>
            </div>

            {/* 2x2 Grid Textareas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TextArea
                id="notulensi-agenda"
                label="Agenda"
                labelClassName="font-semibold"
                size="sm"
                rows={5}
                disabled={!canEdit || saveMutation.isPending}
                value={agendaPembahasan}
                onChange={(e) => setAgendaPembahasan(e.target.value)}
              />

              <TextArea
                id="notulensi-hal-dibahas"
                label="Hal yang dibahas"
                labelClassName="font-semibold"
                size="sm"
                rows={5}
                disabled={!canEdit || saveMutation.isPending}
                value={halDibahas}
                onChange={(e) => setHalDibahas(e.target.value)}
              />

              <TextArea
                id="notulensi-keputusan"
                label="Keputusan"
                labelClassName="font-semibold"
                size="sm"
                rows={5}
                disabled={!canEdit || saveMutation.isPending}
                value={keputusan}
                onChange={(e) => setKeputusan(e.target.value)}
              />

              <TextArea
                id="notulensi-tindak-lanjut"
                label="Tindak lanjut"
                labelClassName="font-semibold"
                size="sm"
                rows={5}
                disabled={!canEdit || saveMutation.isPending}
                value={tindakLanjut}
                onChange={(e) => setTindakLanjut(e.target.value)}
              />
            </div>

            <div className="flex justify-end text-body-sm text-ink-muted">
              <span>
                Notulis:{" "}
                <strong className="font-semibold text-ink">
                  {rapat.notulisNama}
                </strong>
              </span>
            </div>
          </div>

          {!isNotulis && (
            <Alert status="info" role="status">
              Hanya notulis yang ditunjuk ({rapat.notulisNama}) yang dapat
              mengubah isi notulensi ini.
            </Alert>
          )}

          {errorMessage && <Alert status="error">{errorMessage}</Alert>}
          {feedbackMessage && (
            <Alert status="success" role="status">
              {feedbackMessage}
            </Alert>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Button
              variant="outline"
              size="md"
              fullWidth
              disabled={!canEdit}
              isLoading={saveMutation.isPending}
              onClick={() => void handleSave("Draf")}
            >
              Simpan Draf
            </Button>
            <Button
              variant="primary"
              size="md"
              fullWidth
              disabled={!canEdit}
              isLoading={saveMutation.isPending}
              onClick={() => void handleSave("Final")}
            >
              Finalisasi &amp; Simpan ke Arsip
            </Button>
          </div>
        </Card>
      </div>

      {/* Right Column (4 cols): Notulis + Kelengkapan UANG + Foto Dokumentasi */}
      <div className="lg:col-span-4 space-y-6">
        <Card className="p-6 space-y-3">
          <h3 className="font-heading text-h6 font-bold text-ink">Notulis</h3>
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent font-heading text-body-md font-bold text-on-accent">
              {getInitials(rapat.notulisNama).slice(0, 1)}
            </span>
            <div>
              <p className="font-heading text-body-md font-bold text-ink">
                {rapat.notulisNama}
              </p>
              <p className="text-[12px] text-ink-muted">
                {isNotulis ? "Anda · ditunjuk Kaprodi" : "Ditunjuk Kaprodi"}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6 space-y-4">
          <h3 className="font-heading text-h6 font-bold text-ink">
            Kelengkapan UANG
          </h3>

          <ul className="space-y-3 text-body-sm">
            {[
              {
                code: "U",
                title: "Undangan",
                sub: "Terkirim 20 Okt 2026",
                ok: rapat.uangStatus.U,
              },
              {
                code: "A",
                title: "Absensi",
                sub: `${rapat.hadirCount} dari ${rapat.totalPeserta} hadir`,
                ok: rapat.uangStatus.A,
              },
              {
                code: "N",
                title: "Notulensi",
                sub: rapat.uangStatus.N
                  ? "Final, tersimpan di arsip"
                  : "Draf, belum final",
                ok: rapat.uangStatus.N,
              },
              {
                code: "G",
                title: "Gambar",
                sub:
                  rapat.dokumentasi.length > 0
                    ? `${rapat.dokumentasi.length} foto terunggah`
                    : "Belum ada foto",
                ok: rapat.uangStatus.G,
              },
            ].map((item) => (
              <li
                key={item.code}
                className="flex items-center justify-between gap-2"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-heading text-body-sm font-bold",
                      item.ok
                        ? "bg-primary text-white"
                        : "bg-surface text-ink-muted",
                    )}
                  >
                    {item.code}
                  </span>
                  <div>
                    <p className="font-semibold text-ink">{item.title}</p>
                    <p className="text-[12px] text-ink-muted">{item.sub}</p>
                  </div>
                </div>
                <StatusChip
                  status={item.ok ? "Lengkap" : "Belum"}
                  tone={item.ok ? "success" : "warning"}
                />
              </li>
            ))}
          </ul>
        </Card>

        <Card className="p-6 space-y-4">
          <h3 className="font-heading text-h6 font-bold text-ink">
            Foto Dokumentasi
          </h3>

          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-primary/30 bg-surface px-4 py-10 text-center space-y-2.5">
            <p className="font-heading text-body-sm font-bold text-ink">
              Tarik foto ke sini
            </p>
            <p className="text-[12px] text-ink-muted">
              JPG atau PNG &middot; maks 10 MB
            </p>
            <Button
              variant="accent"
              size="sm"
              onClick={() => onOpenUploadDokumentasi?.()}
            >
              Unggah Foto
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}

function NotulensiEditorSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start" aria-hidden="true">
      <div className="lg:col-span-8">
        <Card className="p-6 space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-2">
              <Skeleton className="h-7 w-48 rounded-xl" />
              <Skeleton className="h-4 w-72 rounded-lg" />
            </div>
            <Skeleton className="h-7 w-20 rounded-full" />
          </div>

          <Skeleton className="h-12 w-full rounded-2xl" />

          <div className="rounded-2xl border border-border-soft bg-card p-6 space-y-5">
            <div className="flex items-center justify-between border-b-2 border-primary/20 pb-4">
              <div className="flex items-center gap-3">
                <Skeleton className="h-11 w-11 rounded-full" />
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-44 rounded-md" />
                  <Skeleton className="h-3 w-56 rounded-md" />
                </div>
              </div>
              <Skeleton className="h-6 w-32 rounded-full" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TextAreaSkeleton label="Agenda" rows={5} />
              <TextAreaSkeleton label="Hal yang dibahas" rows={5} />
              <TextAreaSkeleton label="Keputusan" rows={5} />
              <TextAreaSkeleton label="Tindak lanjut" rows={5} />
            </div>
          </div>
        </Card>
      </div>

      <div className="lg:col-span-4 space-y-5">
        <Card className="p-6 space-y-4">
          <Skeleton className="h-6 w-36 rounded-lg" />
          <div className="space-y-3">
            <Skeleton className="h-12 w-full rounded-2xl" />
            <Skeleton className="h-12 w-full rounded-2xl" />
            <Skeleton className="h-12 w-full rounded-2xl" />
          </div>
        </Card>
        <Card className="p-6 space-y-4">
          <Skeleton className="h-6 w-40 rounded-lg" />
          <Skeleton className="h-36 w-full rounded-2xl" />
        </Card>
      </div>
    </div>
  );
}

export function NotulensiEditorView({
  rapatId,
  currentUserId,
  onOpenUploadDokumentasi,
}: NotulensiEditorViewProps) {
  const { data: rapat, isLoading, isError, error, refetch } =
    useRapatDetail(rapatId);
  const [uploadPhotoOpen, setUploadPhotoOpen] = useState(false);

  if (isLoading) {
    return <NotulensiEditorSkeleton />;
  }

  if (isError || !rapat) {
    return (
      <ErrorState
        message={
          error instanceof Error
            ? error.message
            : "Data notulensi rapat tidak ditemukan."
        }
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <>
      <NotulensiEditorForm
        key={`${rapat.id}-${rapat.notulensi?.statusNotulensi ?? "new"}`}
        rapat={rapat}
        currentUserId={currentUserId}
        onOpenUploadDokumentasi={() => {
          onOpenUploadDokumentasi?.();
          setUploadPhotoOpen(true);
        }}
      />
      <UploadDokumentasiModal
        key={uploadPhotoOpen ? `doc-${rapat.id}` : "doc-closed"}
        isOpen={uploadPhotoOpen}
        onClose={() => setUploadPhotoOpen(false)}
        rapat={rapat}
      />
    </>
  );
}
