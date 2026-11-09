import type { RapatItem } from "./types";

/**
 * Statistik ringkasan halaman Rapat (Modul 2) yang dihitung dari data rapat
 * asli dan tanggal hari ini. Tidak ada angka atau tanggal bawaan.
 */

/** Tanggal rapat disimpan sebagai tanggal UTC; ubah ke hari lokal yang sama. */
export function toLocalDay(iso: string): Date {
  const d = new Date(iso);
  return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function startOfWeek(now: Date): Date {
  const daysSinceMonday = (now.getDay() + 6) % 7;
  return new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysSinceMonday);
}

function sameMonth(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

function percent(part: number, total: number): number {
  return total > 0 ? Math.round((part / total) * 100) : 0;
}

function byDateTime(a: RapatItem, b: RapatItem): number {
  return (
    toLocalDay(a.tanggal).getTime() - toLocalDay(b.tanggal).getTime() ||
    a.waktuMulai.localeCompare(b.waktuMulai)
  );
}

export interface RapatOverviewStats {
  todayRapat: RapatItem[];
  weekRapat: RapatItem[];
  attendanceRate: number;
  myAttendanceRate: number;
  myMonthAttendance: { hadir: number; total: number };
  notulensiBulanIniCount: number;
  upcomingReminderCount: number;
  completedUangCount: number;
}

export function buildOverviewStats(
  rapatList: readonly RapatItem[],
  userId: string,
  now: Date,
): RapatOverviewStats {
  const today = startOfDay(now).getTime();
  const weekStart = startOfWeek(now).getTime();
  const weekEnd = weekStart + 6 * 86_400_000;

  const todayRapat = rapatList
    .filter((r) => toLocalDay(r.tanggal).getTime() === today)
    .sort(byDateTime);
  const weekRapat = rapatList
    .filter((r) => {
      const day = toLocalDay(r.tanggal).getTime();
      return day >= weekStart && day <= weekEnd;
    })
    .sort(byDateTime);

  const held = rapatList.filter((r) => r.statusRapat !== "Dijadwalkan");
  const attendanceRate = percent(
    held.reduce((acc, r) => acc + r.hadirCount, 0),
    held.reduce((acc, r) => acc + r.totalPeserta, 0),
  );

  const mine = rapatList.filter((r) =>
    r.peserta.some((p) => p.dosenId === userId),
  );
  const iAttended = (r: RapatItem) =>
    r.peserta.some((p) => p.dosenId === userId && p.statusKehadiran === "Hadir");

  const myHeld = mine.filter((r) => r.statusRapat !== "Dijadwalkan");
  const myMonthHeld = myHeld.filter((r) =>
    sameMonth(toLocalDay(r.tanggal), now),
  );

  return {
    todayRapat,
    weekRapat,
    attendanceRate,
    myAttendanceRate: percent(myHeld.filter(iAttended).length, myHeld.length),
    myMonthAttendance: {
      hadir: myMonthHeld.filter(iAttended).length,
      total: myMonthHeld.length,
    },
    notulensiBulanIniCount: rapatList.filter(
      (r) => r.notulensi && sameMonth(toLocalDay(r.tanggal), now),
    ).length,
    upcomingReminderCount: mine.filter(
      (r) => r.statusRapat !== "Selesai" && r.isReminderActive,
    ).length,
    completedUangCount: rapatList.filter((r) => r.uangStatus.isComplete).length,
  };
}

/** Penanda hari menuju rapat: Hari ini, H-n, atau Lewat. */
export function dayBadge(tanggalIso: string, now: Date): string {
  const days = Math.round(
    (toLocalDay(tanggalIso).getTime() - startOfDay(now).getTime()) / 86_400_000,
  );
  if (days === 0) return "Hari ini";
  return days > 0 ? `H-${days}` : "Lewat";
}

export function formatDayLabel(now: Date): string {
  return now.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatWeekLabel(now: Date): string {
  const start = startOfWeek(now);
  const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 6);
  const month = (d: Date) => d.toLocaleDateString("id-ID", { month: "short" });

  return sameMonth(start, end)
    ? `Pekan ${start.getDate()}–${end.getDate()} ${month(end)} ${end.getFullYear()}`
    : `Pekan ${start.getDate()} ${month(start)}–${end.getDate()} ${month(end)} ${end.getFullYear()}`;
}

export function formatMonthLabel(now: Date): string {
  return now.toLocaleDateString("id-ID", { month: "long", year: "numeric" });
}
