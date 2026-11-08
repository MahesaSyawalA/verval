import {
  MEETING_DURATION_MAX_MINUTES,
  MEETING_DURATION_MIN_MINUTES,
  type UangElement,
} from "./constants";

export function cn(...inputs: Array<string | false | null | undefined>): string {
  return inputs.filter(Boolean).join(" ");
}

const ACADEMIC_PREFIXES = new Set([
  "prof",
  "dr",
  "ir",
  "drs",
  "dra",
  "h",
  "hj",
]);

/**
 * Mengambil nama sapaan pertama tanpa gelar akademik di depan/belakang.
 */
export function getGreetingName(fullName: string): string {
  const withoutSuffix = fullName.split(",")[0]?.trim() ?? fullName;
  const parts = withoutSuffix
    .split(/\s+/)
    .filter((word) => {
      const normalized = word.replace(/\./g, "").toLowerCase();
      return normalized.length > 0 && !ACADEMIC_PREFIXES.has(normalized);
    });

  return parts[0] ?? withoutSuffix;
}

/**
 * Menghasilkan 2 huruf inisial nama (contoh: "Iqbal" -> "IA" atau 2 kata pertama).
 */
export function getInitials(fullName: string): string {
  const withoutSuffix = fullName.split(",")[0]?.trim() ?? fullName;
  const words = withoutSuffix
    .split(/\s+/)
    .filter((word) => {
      const normalized = word.replace(/\./g, "").toLowerCase();
      return normalized.length > 0 && !ACADEMIC_PREFIXES.has(normalized);
    });

  if (words.length === 0) return "US";
  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }
  return `${words[0][0] ?? ""}${words[1][0] ?? ""}`.toUpperCase();
}

/**
 * Menghitung skor KPI dalam persentase bulat (0..100).
 * Aman terhadap target <= 0 (mengembalikan 0 tanpa pembagian nol).
 */
export function calculateKPIScore(achieved: number, target: number): number {
  if (!Number.isFinite(achieved) || !Number.isFinite(target) || target <= 0) {
    return 0;
  }
  if (achieved <= 0) {
    return 0;
  }
  const percentage = Math.round((achieved / target) * 100);
  return Math.min(100, Math.max(0, percentage));
}

export interface MeetingDurationValidationResult {
  valid: boolean;
  message?: string;
}

/**
 * Validasi durasi rapat sesuai spesifikasi KVV (15 - 240 menit inklusif).
 */
export function validateMeetingDuration(
  durationMinutes: number,
): MeetingDurationValidationResult {
  if (
    !Number.isFinite(durationMinutes) ||
    durationMinutes < MEETING_DURATION_MIN_MINUTES ||
    durationMinutes > MEETING_DURATION_MAX_MINUTES
  ) {
    return {
      valid: false,
      message: "Durasi rapat tidak valid",
    };
  }
  return { valid: true };
}

export interface UangCompletenessInput {
  hasUndangan: boolean;
  hasAbsensi: boolean;
  hasFinalNotulensi: boolean;
  hasDokumentasi: boolean;
}

export interface UangCompletenessStatus {
  U: boolean;
  A: boolean;
  N: boolean;
  G: boolean;
  isComplete: boolean;
  missing: UangElement[];
}

/**
 * Evaluasi kelengkapan berkas UANG (Undangan, Absensi, Notulensi, Gambar).
 */
export function evaluateUangCompleteness(
  input: UangCompletenessInput,
): UangCompletenessStatus {
  const statusMap: Record<UangElement, boolean> = {
    U: Boolean(input.hasUndangan),
    A: Boolean(input.hasAbsensi),
    N: Boolean(input.hasFinalNotulensi),
    G: Boolean(input.hasDokumentasi),
  };

  const missing = (["U", "A", "N", "G"] as const).filter(
    (key) => !statusMap[key],
  );

  return {
    ...statusMap,
    isComplete: missing.length === 0,
    missing,
  };
}
