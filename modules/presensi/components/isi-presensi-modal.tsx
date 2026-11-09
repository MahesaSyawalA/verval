"use client";

import { Calendar, Check } from "lucide-react";
import { useState } from "react";
import {
  BareInput,
  Button,
  Input,
  ModalForm,
  StatusChip,
} from "@/components/ui";
import { cn } from "@/lib/utils";
import type { RapatItem } from "@/modules/rapat";
import { useSubmitPresensi } from "../hooks/use-presensi";
import { submitPresensiSchema } from "../schemas/presensi.schema";
import type {
  MetodePresensiType,
  PresensiSubmissionResult,
} from "../types";

export interface IsiPresensiModalProps {
  isOpen: boolean;
  onClose: () => void;
  rapat: RapatItem | null;
}

function formatWibTime(isoString: string): string {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return "13:04 WIB";
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  return `${hh}:${mm} WIB`;
}

export function IsiPresensiModal({
  isOpen,
  onClose,
  rapat,
}: IsiPresensiModalProps) {
  const submitMutation = useSubmitPresensi(rapat?.id ?? "");

  const [statusKehadiran, setStatusKehadiran] = useState<
    "Hadir" | "Izin" | "Sakit"
  >("Hadir");
  const [metodePresensi, setMetodePresensi] =
    useState<MetodePresensiType>("Kode");
  const [digits, setDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [keteranganAbsen, setKeteranganAbsen] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successResult, setSuccessResult] =
    useState<PresensiSubmissionResult | null>(null);

  if (!isOpen || !rapat) return null;

  function handleDigitChange(index: number, raw: string) {
    const clean = raw.replace(/[^a-zA-Z0-9]/g, "").slice(-1).toUpperCase();
    setDigits((prev) => {
      const next = [...prev];
      next[index] = clean;
      return next;
    });
  }

  async function handleConfirm() {
    if (!rapat) return;
    setErrorMessage(null);

    const effectiveMetode: MetodePresensiType =
      statusKehadiran === "Hadir" ? metodePresensi : "Manual";
    const kodePresensi = digits.join("");

    const parsed = submitPresensiSchema.safeParse({
      statusKehadiran,
      metodePresensi: effectiveMetode,
      kodePresensi: statusKehadiran === "Hadir" ? kodePresensi : undefined,
      keteranganAbsen: keteranganAbsen.trim() || undefined,
    });

    if (!parsed.success) {
      setErrorMessage(
        parsed.error.issues[0]?.message ?? "Data presensi tidak valid.",
      );
      return;
    }

    try {
      const res = await submitMutation.mutateAsync(parsed.data);
      setSuccessResult(res.data);
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Gagal menyimpan presensi.",
      );
    }
  }

  // Modal Presensi Berhasil (Varian 1 & 2 sesuai mockup)
  if (successResult) {
    return (
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="presensi-berhasil-title"
        className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 backdrop-blur-xs p-4"
      >
        <div className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-xl border border-border-soft space-y-5">
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-accent-100">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent text-ink">
              <Check className="h-8 w-8 stroke-[2.5]" />
            </div>
          </div>

          <div className="space-y-1.5">
            <h2
              id="presensi-berhasil-title"
              className="font-heading text-h4 font-bold text-ink"
            >
              Presensi Berhasil
            </h2>
            <p className="text-body-sm text-ink-muted leading-relaxed">
              Kehadiran Anda pada {successResult.judulRapat} telah tercatat.
            </p>
          </div>

          <div className="rounded-2xl bg-surface p-4 space-y-2.5 text-body-sm">
            <div className="flex items-center justify-between">
              <span className="text-ink-muted">Status</span>
              <StatusChip
                status={successResult.statusKehadiran}
                tone="primary"
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-ink-muted">Waktu</span>
              <span className="font-heading font-bold text-ink">
                {formatWibTime(successResult.waktuPresensi)}
              </span>
            </div>
            {successResult.metodePresensi !== "Manual" && (
              <div className="flex items-center justify-between">
                <span className="text-ink-muted">Metode</span>
                <span className="font-heading font-bold text-ink">
                  {successResult.metodePresensi === "Kode"
                    ? "Kode Presensi"
                    : "Scan QR"}
                </span>
              </div>
            )}
          </div>

          <Button variant="primary" size="md" fullWidth onClick={onClose}>
            Selesai
          </Button>
        </div>
      </div>
    );
  }

  return (
    <ModalForm
      isOpen={isOpen}
      onClose={onClose}
      title="Isi Presensi"
      subtitle="Konfirmasi kehadiran Anda pada rapat"
      size="md"
      footer={
        <>
          <Button
            variant="outline"
            size="md"
            fullWidth
            onClick={onClose}
            disabled={submitMutation.isPending}
          >
            Batal
          </Button>
          <Button
            variant="primary"
            size="md"
            fullWidth
            isLoading={submitMutation.isPending}
            onClick={() => void handleConfirm()}
          >
            Konfirmasi Kehadiran
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {/* Rapat Banner */}
        <div className="flex items-center justify-between gap-3 rounded-2xl bg-surface p-4">
          <div className="flex items-center gap-3 min-w-0">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-white">
              <Calendar className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="truncate font-heading text-body-md font-bold text-ink">
                {rapat.judulRapat}
              </p>
              <p className="text-body-sm text-ink-muted">
                {rapat.waktuMulai} – {rapat.waktuSelesai} &middot; {rapat.lokasi}
              </p>
            </div>
          </div>
          <StatusChip status={rapat.statusRapat} tone="warning" />
        </div>

        {/* Metode Presensi (tampil bila Hadir) */}
        {statusKehadiran === "Hadir" && (
          <div className="space-y-3">
            <span className="block text-body-sm font-semibold text-ink">
              Metode Presensi
            </span>
            <div className="grid grid-cols-2 rounded-2xl bg-surface p-1">
              <button
                type="button"
                onClick={() => setMetodePresensi("Kode")}
                className={cn(
                  "rounded-xl py-2.5 text-body-sm font-semibold transition-colors cursor-pointer",
                  metodePresensi === "Kode"
                    ? "bg-primary text-white shadow-xs"
                    : "text-ink-muted hover:text-ink",
                )}
              >
                Kode Presensi
              </button>
              <button
                type="button"
                onClick={() => setMetodePresensi("Scan_QR")}
                className={cn(
                  "rounded-xl py-2.5 text-body-sm font-semibold transition-colors cursor-pointer",
                  metodePresensi === "Scan_QR"
                    ? "bg-primary text-white shadow-xs"
                    : "text-ink-muted hover:text-ink",
                )}
              >
                Scan QR
              </button>
            </div>

            <div className="space-y-2">
              <span className="block text-body-sm font-semibold text-ink">
                Masukkan 6 digit kode presensi
              </span>
              <div className="grid grid-cols-6 gap-2.5">
                {digits.map((digit, idx) => (
                  <BareInput
                    key={`digit-${idx}`}
                    aria-label={`Digit kode presensi ${idx + 1}`}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleDigitChange(idx, e.target.value)}
                    className="h-14 w-full rounded-2xl border-2 border-primary/50 bg-primary-50/60 text-center font-heading text-h5 font-bold text-primary focus:border-primary focus:bg-white focus:outline-none"
                  />
                ))}
              </div>
              <p className="text-[12px] text-ink-muted">
                {metodePresensi === "Scan_QR"
                  ? "Pemindai kamera belum tersedia. Masukkan kode yang tertera pada QR rapat."
                  : "Kode ditampilkan notulis di ruang rapat dan berlaku 10 menit."}
              </p>
            </div>
          </div>
        )}

        {/* Status Kehadiran */}
        <div className="space-y-1.5">
          <span className="block text-body-sm font-semibold text-ink">
            Status Kehadiran
          </span>
          <div className="grid grid-cols-3 gap-2.5">
            {(["Hadir", "Izin", "Sakit"] as const).map((st) => {
              const active = statusKehadiran === st;
              return (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusKehadiran(st)}
                  className={cn(
                    "inline-flex items-center justify-center gap-1.5 rounded-2xl border py-2.5 text-body-sm font-semibold transition-colors cursor-pointer",
                    active
                      ? "border-primary bg-primary text-white shadow-xs"
                      : "border-border-default bg-white text-ink hover:bg-surface",
                  )}
                >
                  {active && <Check className="h-4 w-4" />}
                  <span>{st}</span>
                </button>
              );
            })}
          </div>
        </div>

        <Input
          label="Keterangan (opsional)"
          value={keteranganAbsen}
          onChange={(e) => setKeteranganAbsen(e.target.value)}
          placeholder="Tambahkan catatan kehadiran..."
        />

        {errorMessage && (
          <p role="alert" className="text-body-sm font-medium text-danger">
            {errorMessage}
          </p>
        )}
      </div>
    </ModalForm>
  );
}
