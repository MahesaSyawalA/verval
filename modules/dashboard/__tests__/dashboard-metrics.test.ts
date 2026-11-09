// @vitest-environment node
import { describe, expect, it } from "vitest";
import {
  achievedUnits,
  attendancePercentAt,
  buildMonthlyTrend,
  deadlineBadge,
  endOfMonth,
  formatSigned,
  kpiAt,
  statusAt,
  targetAt,
  type MetricTicket,
} from "../server/dashboard.metrics";

const NOW = new Date(2026, 9, 21, 12, 0, 0); // 21 Okt 2026

function ticket(overrides: Partial<MetricTicket>): MetricTicket {
  return {
    status: "Ditugaskan",
    kuantitas_ditugaskan: 1,
    tenggat_waktu: new Date(Date.UTC(2026, 11, 31)),
    tanggal_dibuat: new Date(2026, 0, 1),
    dosen_id: "d1",
    isian_bukti: [],
    riwayat_tiket: [],
    ...overrides,
  };
}

// Selesai: Tercapai pada 5 Sep. Berjalan: baru 3 dari 5 bukti terunggah.
const SELESAI = ticket({
  status: "Tercapai",
  kuantitas_ditugaskan: 4,
  tanggal_dibuat: new Date(2026, 5, 10),
  tenggat_waktu: new Date(Date.UTC(2026, 7, 31)),
  isian_bukti: [1, 2, 3, 4].map((n) => ({ urutan_submisi: n })),
  riwayat_tiket: [
    { status_riwayat: "Ditugaskan", created_at: new Date(2026, 5, 10) },
    { status_riwayat: "Dikerjakan", created_at: new Date(2026, 6, 1) },
    { status_riwayat: "Menunggu Verifikasi", created_at: new Date(2026, 7, 15) },
    { status_riwayat: "Presensi Rapat: Evaluasi", created_at: new Date(2026, 7, 20) },
    { status_riwayat: "Tercapai", created_at: new Date(2026, 8, 5) },
  ],
});
const BERJALAN = ticket({
  status: "Dikerjakan",
  kuantitas_ditugaskan: 5,
  tanggal_dibuat: new Date(2026, 8, 15),
  tenggat_waktu: new Date(Date.UTC(2026, 10, 30)),
  isian_bukti: [1, 2, 3].map((n) => ({ urutan_submisi: n })),
  riwayat_tiket: [
    { status_riwayat: "Ditugaskan", created_at: new Date(2026, 8, 15) },
    { status_riwayat: "Dikerjakan", created_at: new Date(2026, 8, 20) },
  ],
});

describe("statusAt", () => {
  it("null sebelum tiket dibuat", () => {
    expect(statusAt(SELESAI, new Date(2026, 4, 31), NOW)).toBeNull();
  });

  it("mengikuti riwayat dan mengabaikan baris non-status", () => {
    expect(statusAt(SELESAI, endOfMonth(2026, 6), NOW)).toBe("Dikerjakan");
    expect(statusAt(SELESAI, endOfMonth(2026, 7), NOW)).toBe(
      "Menunggu_Verifikasi",
    );
    expect(statusAt(SELESAI, endOfMonth(2026, 8), NOW)).toBe("Tercapai");
  });

  it("memakai status sekarang untuk waktu sekarang", () => {
    expect(statusAt(BERJALAN, NOW, NOW)).toBe("Dikerjakan");
  });
});

describe("achievedUnits", () => {
  it("menghitung kuantitas penuh untuk Tercapai dan progres sebagian hanya untuk sekarang", () => {
    expect(achievedUnits(SELESAI, NOW, NOW)).toBe(4);
    expect(achievedUnits(BERJALAN, NOW, NOW)).toBe(3);
    expect(achievedUnits(BERJALAN, endOfMonth(2026, 8), NOW)).toBe(0);
  });

  it("tidak melebihi kuantitas yang ditugaskan", () => {
    const berlebih = ticket({
      kuantitas_ditugaskan: 2,
      isian_bukti: [1, 2, 3, 4].map((n) => ({ urutan_submisi: n })),
    });
    expect(achievedUnits(berlebih, NOW, NOW)).toBe(2);
  });
});

describe("kpiAt dan targetAt", () => {
  it("menghitung KPI berbasis kuantitas", () => {
    expect(kpiAt([SELESAI, BERJALAN], NOW, NOW)).toBe(78); // 7 dari 9
  });

  it("menghitung target dari tenggat yang sudah lewat", () => {
    expect(targetAt([SELESAI, BERJALAN], NOW)).toBe(44); // 4 dari 9
  });

  it("mengembalikan 0, bukan angka mockup, bila tidak ada tiket", () => {
    expect(kpiAt([], NOW, NOW)).toBe(0);
    expect(targetAt([], NOW)).toBe(0);
  });
});

describe("buildMonthlyTrend", () => {
  it("menghasilkan 6 bulan berlabel dengan titik terakhir sama dengan KPI sekarang", () => {
    const points = buildMonthlyTrend([SELESAI, BERJALAN], [SELESAI, BERJALAN], NOW);

    expect(points.map((p) => p.label)).toEqual([
      "Mei",
      "Jun",
      "Jul",
      "Agu",
      "Sep",
      "Okt",
    ]);
    expect(points[0].capaian).toBe(0);
    expect(points[4].capaian).toBe(44); // akhir Sep: hanya SELESAI yang Tercapai
    expect(points[5].capaian).toBe(kpiAt([SELESAI, BERJALAN], NOW, NOW));
  });

  it("semua nol untuk data kosong", () => {
    const points = buildMonthlyTrend([], [], NOW);
    expect(points).toHaveLength(6);
    expect(points.every((p) => p.capaian === 0 && p.target === 0)).toBe(true);
  });
});

describe("formatSigned", () => {
  it("memberi tanda dan satuan", () => {
    expect(formatSigned(3)).toBe("+3");
    expect(formatSigned(-2)).toBe("-2");
    expect(formatSigned(0)).toBe("0");
    expect(formatSigned(6, "%")).toBe("+6%");
    expect(formatSigned(-2, "%")).toBe("-2%");
  });
});

describe("deadlineBadge", () => {
  const due = (day: number, month = 9) => new Date(Date.UTC(2026, month, day));

  it("menghitung sisa hari dan nada peringatan dari tenggat nyata", () => {
    expect(deadlineBadge(due(24), NOW)).toEqual({ label: "H-3", tone: "danger" });
    expect(deadlineBadge(due(28), NOW)).toEqual({ label: "H-7", tone: "warning" });
    expect(deadlineBadge(due(30, 10), NOW)).toEqual({
      label: "H-40",
      tone: "primary",
    });
  });

  it("menandai hari ini dan terlambat", () => {
    expect(deadlineBadge(due(21), NOW).label).toBe("Hari ini");
    expect(deadlineBadge(due(20), NOW)).toEqual({
      label: "Terlambat",
      tone: "danger",
    });
  });
});

describe("attendancePercentAt", () => {
  const rapat = [
    { tanggal: new Date(2026, 8, 10), hadir: true },
    { tanggal: new Date(2026, 9, 5), hadir: false },
    { tanggal: new Date(2026, 9, 15), hadir: true },
  ];

  it("menghitung hanya rapat sampai waktu tersebut", () => {
    expect(attendancePercentAt(rapat, endOfMonth(2026, 8))).toBe(100);
    expect(attendancePercentAt(rapat, NOW)).toBe(67);
  });

  it("0 bila belum ada rapat", () => {
    expect(attendancePercentAt([], NOW)).toBe(0);
  });
});
