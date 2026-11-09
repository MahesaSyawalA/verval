// @vitest-environment node
import { describe, expect, it } from "vitest";
import {
  buildOverviewStats,
  dayBadge,
  formatDayLabel,
  formatWeekLabel,
  startOfWeek,
} from "../overview-stats";
import type { RapatItem } from "../types";

// Senin, 9 Nov 2026
const NOW = new Date(2026, 10, 9, 10, 0, 0);

function rapat(overrides: Partial<RapatItem> & { tanggal: string }): RapatItem {
  return {
    id: overrides.id ?? "r",
    judulRapat: "Rapat",
    waktuMulai: "09:00",
    statusRapat: "Selesai",
    isReminderActive: false,
    hadirCount: 0,
    totalPeserta: 0,
    peserta: [],
    notulensi: null,
    uangStatus: { isComplete: false },
    ...overrides,
  } as unknown as RapatItem;
}

const peserta = (dosenId: string, statusKehadiran: string) => ({
  dosenId,
  statusKehadiran,
});

const RAPAT_LIST: RapatItem[] = [
  rapat({
    id: "hari-ini",
    tanggal: "2026-11-09T00:00:00.000Z",
    statusRapat: "Berlangsung",
    hadirCount: 1,
    totalPeserta: 2,
    peserta: [peserta("me", "Hadir"), peserta("lain", "Belum_Hadir")] as never,
  }),
  rapat({
    id: "pekan-ini",
    tanggal: "2026-11-12T00:00:00.000Z",
    statusRapat: "Dijadwalkan",
    isReminderActive: true,
    totalPeserta: 2,
    peserta: [peserta("me", "Belum_Hadir")] as never,
  }),
  rapat({
    id: "bulan-lalu",
    tanggal: "2026-10-21T00:00:00.000Z",
    hadirCount: 2,
    totalPeserta: 2,
    peserta: [peserta("me", "Izin")] as never,
    notulensi: { id: "n" } as never,
    uangStatus: { isComplete: true } as never,
  }),
];

describe("buildOverviewStats", () => {
  const stats = buildOverviewStats(RAPAT_LIST, "me", NOW);

  it("memilih rapat hari ini dan pekan ini dari tanggal sebenarnya", () => {
    expect(stats.todayRapat.map((r) => r.id)).toEqual(["hari-ini"]);
    expect(stats.weekRapat.map((r) => r.id)).toEqual(["hari-ini", "pekan-ini"]);
  });

  it("menghitung presensi hanya dari rapat yang sudah berjalan", () => {
    expect(stats.attendanceRate).toBe(75); // 3 hadir dari 4 diundang
  });

  it("menghitung kehadiran saya dan ringkasan bulan ini", () => {
    expect(stats.myAttendanceRate).toBe(50); // hadir 1 dari 2 rapat berjalan
    expect(stats.myMonthAttendance).toEqual({ hadir: 1, total: 1 });
  });

  it("menghitung notulensi bulan ini, pengingat aktif, dan arsip UANG lengkap", () => {
    expect(stats.notulensiBulanIniCount).toBe(0); // notulensi ada di Okt
    expect(stats.upcomingReminderCount).toBe(1);
    expect(stats.completedUangCount).toBe(1);
  });

  it("semua nol dan kosong tanpa data, bukan angka contoh", () => {
    const empty = buildOverviewStats([], "me", NOW);
    expect(empty.todayRapat).toEqual([]);
    expect(empty.weekRapat).toEqual([]);
    expect(empty.attendanceRate).toBe(0);
    expect(empty.myAttendanceRate).toBe(0);
    expect(empty.myMonthAttendance).toEqual({ hadir: 0, total: 0 });
    expect(empty.upcomingReminderCount).toBe(0);
  });
});

describe("dayBadge dan label tanggal", () => {
  it("menghitung H-n dari tanggal rapat", () => {
    expect(dayBadge("2026-11-09T00:00:00.000Z", NOW)).toBe("Hari ini");
    expect(dayBadge("2026-11-12T00:00:00.000Z", NOW)).toBe("H-3");
    expect(dayBadge("2026-11-08T00:00:00.000Z", NOW)).toBe("Lewat");
  });

  it("awal pekan adalah hari Senin", () => {
    expect(startOfWeek(NOW).getDate()).toBe(9);
    expect(startOfWeek(new Date(2026, 10, 15)).getDate()).toBe(9); // Minggu
  });

  it("membuat label dari tanggal hari ini, bukan teks tetap", () => {
    expect(formatDayLabel(NOW)).toMatch(/9/);
    expect(formatDayLabel(NOW)).toMatch(/2026/);
    expect(formatWeekLabel(NOW)).toMatch(/^Pekan 9–15 .* 2026$/);
  });
});
