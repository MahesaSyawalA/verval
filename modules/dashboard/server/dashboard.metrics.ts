import { calculateKPIScore } from "@/lib/utils";
import type { TrendDataPoint } from "@/components/charts";

/**
 * Perhitungan murni untuk dashboard. Semua angka diturunkan dari data tiket,
 * riwayat tiket, dan presensi; tidak ada nilai bawaan dari mockup.
 *
 * shortcut: isian_bukti tidak punya waktu unggah, sehingga progres sebagian
 * (mis. 4 dari 5 artikel) hanya dihitung untuk "sekarang". Bulan-bulan lalu
 * hanya menghitung tiket yang sudah Tercapai pada saat itu. Upgrade bila
 * isian_bukti diberi kolom waktu.
 */

const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Mei",
  "Jun",
  "Jul",
  "Agu",
  "Sep",
  "Okt",
  "Nov",
  "Des",
] as const;

const KNOWN_STATUSES = new Set([
  "Ditugaskan",
  "Dikerjakan",
  "Menunggu_Verifikasi",
  "Tercapai",
  "Ditolak",
]);

export interface MetricTicket {
  status: string;
  kuantitas_ditugaskan: number;
  tenggat_waktu: Date;
  tanggal_dibuat: Date;
  dosen_id: string;
  isian_bukti: ReadonlyArray<{ urutan_submisi: number }>;
  riwayat_tiket: ReadonlyArray<{ status_riwayat: string; created_at: Date }>;
}

/** Hanya data yang dibutuhkan untuk garis target (tanpa bukti dan riwayat). */
export type TargetTicket = Pick<
  MetricTicket,
  "kuantitas_ditugaskan" | "tenggat_waktu" | "tanggal_dibuat"
>;

export function endOfMonth(year: number, monthIndex: number): Date {
  return new Date(year, monthIndex + 1, 0, 23, 59, 59, 999);
}

export function formatSigned(value: number, suffix = ""): string {
  if (value > 0) return `+${value}${suffix}`;
  if (value < 0) return `-${Math.abs(value)}${suffix}`;
  return `0${suffix}`;
}

/** Status tiket pada waktu `at`, atau null bila tiket belum ada. */
export function statusAt(
  ticket: MetricTicket,
  at: Date,
  now: Date,
): string | null {
  if (ticket.tanggal_dibuat > at) return null;
  if (at >= now) return ticket.status;

  let status = "Ditugaskan";
  const history = [...ticket.riwayat_tiket].sort(
    (a, b) => a.created_at.getTime() - b.created_at.getTime(),
  );
  for (const entry of history) {
    if (entry.created_at > at) break;
    const normalized = entry.status_riwayat.replace(/ /g, "_");
    if (KNOWN_STATUSES.has(normalized)) status = normalized;
  }
  return status;
}

export function achievedUnits(
  ticket: MetricTicket,
  at: Date,
  now: Date,
): number {
  const status = statusAt(ticket, at, now);
  if (status === null) return 0;
  if (status === "Tercapai") return ticket.kuantitas_ditugaskan;
  if (at < now) return 0;

  const submissions = new Set(ticket.isian_bukti.map((b) => b.urutan_submisi))
    .size;
  return Math.min(ticket.kuantitas_ditugaskan, submissions);
}

export function kpiAt(
  tickets: readonly MetricTicket[],
  at: Date,
  now: Date,
): number {
  let achieved = 0;
  let assigned = 0;
  for (const ticket of tickets) {
    if (statusAt(ticket, at, now) === null) continue;
    assigned += ticket.kuantitas_ditugaskan;
    achieved += achievedUnits(ticket, at, now);
  }
  return calculateKPIScore(achieved, assigned);
}

/** Persentase kuantitas yang seharusnya sudah selesai (tenggat terlewati) pada `at`. */
export function targetAt(tickets: readonly TargetTicket[], at: Date): number {
  let assigned = 0;
  let due = 0;
  for (const ticket of tickets) {
    if (ticket.tanggal_dibuat > at) continue;
    assigned += ticket.kuantitas_ditugaskan;
    if (ticket.tenggat_waktu <= at) due += ticket.kuantitas_ditugaskan;
  }
  return calculateKPIScore(due, assigned);
}

export function buildMonthlyTrend(
  tickets: readonly MetricTicket[],
  targetTickets: readonly TargetTicket[],
  now: Date,
  months = 6,
): TrendDataPoint[] {
  const points: TrendDataPoint[] = [];
  for (let offset = months - 1; offset >= 0; offset--) {
    const monthStart = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    const at =
      offset === 0
        ? now
        : endOfMonth(monthStart.getFullYear(), monthStart.getMonth());
    points.push({
      label: MONTH_LABELS[monthStart.getMonth()] ?? "",
      capaian: kpiAt(tickets, at, now),
      target: targetAt(targetTickets, at),
    });
  }
  return points;
}

export function endOfPreviousMonth(now: Date): Date {
  return endOfMonth(now.getFullYear(), now.getMonth() - 1);
}

export function countAt(
  tickets: readonly MetricTicket[],
  at: Date,
  now: Date,
  status: string,
): number {
  return tickets.filter((t) => statusAt(t, at, now) === status).length;
}

export function existingCountAt(
  tickets: readonly MetricTicket[],
  at: Date,
  now: Date,
): number {
  return tickets.filter((t) => statusAt(t, at, now) !== null).length;
}

export function activeDosenCountAt(
  tickets: readonly MetricTicket[],
  at: Date,
  now: Date,
): number {
  return new Set(
    tickets.filter((t) => statusAt(t, at, now) !== null).map((t) => t.dosen_id),
  ).size;
}

export function shortDate(date: Date): string {
  return `${date.getDate()} ${MONTH_LABELS[date.getMonth()] ?? ""} ${date.getFullYear()}`;
}

export interface DeadlineBadge {
  label: string;
  tone: "danger" | "warning" | "primary";
}

/** Sisa hari menuju tenggat (H-n); lewat tenggat disebut Terlambat. */
export function deadlineBadge(tenggat: Date, now: Date): DeadlineBadge {
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dueDay = new Date(
    tenggat.getUTCFullYear(),
    tenggat.getUTCMonth(),
    tenggat.getUTCDate(),
  );
  const days = Math.round(
    (dueDay.getTime() - startOfToday.getTime()) / 86_400_000,
  );

  if (days < 0) return { label: "Terlambat", tone: "danger" };
  if (days === 0) return { label: "Hari ini", tone: "danger" };
  return {
    label: `H-${days}`,
    tone: days <= 3 ? "danger" : days <= 7 ? "warning" : "primary",
  };
}

export function attendancePercentAt(
  rapat: ReadonlyArray<{ tanggal: Date; hadir: boolean }>,
  at: Date,
): number {
  const upTo = rapat.filter((r) => r.tanggal <= at);
  return calculateKPIScore(upTo.filter((r) => r.hadir).length, upTo.length);
}
