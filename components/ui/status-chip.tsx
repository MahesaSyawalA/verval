import { cn } from "@/lib/utils";

export type StatusTone =
  | "success"
  | "warning"
  | "accent"
  | "primary"
  | "danger"
  | "neutral";

export interface StatusChipProps {
  status: string;
  tone?: StatusTone;
  className?: string;
}

const STATUS_TONE_MAP: Record<string, StatusTone> = {
  Tercapai: "success",
  Lengkap: "success",
  Selesai: "success",
  Hadir: "success",
  "Sudah Hadir": "success",
  Final: "success",

  "Menunggu Verifikasi": "warning",
  Menunggu_Verifikasi: "warning",
  Menunggu: "warning",
  Draf: "warning",
  Belum: "warning",
  Izin: "warning",
  Sakit: "warning",

  Berlangsung: "accent",
  "Isi Presensi": "accent",
  Lengkapi: "accent",

  Dikerjakan: "primary",
  Dijadwalkan: "primary",
  Rapat: "primary",

  Ditugaskan: "neutral",
  "Belum Hadir": "neutral",
  Belum_Hadir: "neutral",

  Ditolak: "danger",
  Revisi: "danger",
};

const TONE_CLASSES: Record<StatusTone, string> = {
  success: "bg-success-bg text-success-ink",
  warning: "bg-warning-bg text-warning-ink",
  accent: "bg-accent text-on-accent",
  primary: "bg-primary-50 text-brand",
  danger: "bg-danger-bg text-danger-ink",
  neutral: "bg-chip text-ink-muted",
};

export function StatusChip({ status, tone, className }: StatusChipProps) {
  const normalizedLabel = status.replace(/_/g, " ");
  const resolvedTone =
    tone ?? STATUS_TONE_MAP[status] ?? STATUS_TONE_MAP[normalizedLabel] ?? "neutral";

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full px-3 py-1 text-body-sm font-semibold whitespace-nowrap",
        TONE_CLASSES[resolvedTone],
        className,
      )}
    >
      {normalizedLabel}
    </span>
  );
}
