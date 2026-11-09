import { describe, expect, it } from "vitest";
import prisma from "@/lib/db";
import { getDosenDashboardSummary } from "../server/dashboard.service";

describe("Phase 14 - Dashboard Personal Dosen", () => {
  it("menghasilkan ringkasan tugas personal, kehadiran rapat, daftar perlu tindakan, dan gauge capaian untuk Dosen (Bu Indira)", async () => {
    const indira = await prisma.users.findFirstOrThrow({
      where: {
        role: "Dosen",
        nama_lengkap: { contains: "Indira" },
      },
    });

    const summary = await getDosenDashboardSummary(indira.id);

    expect(summary.stats.tugasSayaCount).toBeGreaterThanOrEqual(4);
    expect(summary.stats.rapatDihadiriPersen).toBeGreaterThanOrEqual(0);
    expect(summary.stats.rapatDihadiriPersen).toBeLessThanOrEqual(100);
    expect(summary.statusDistribution.slices).toHaveLength(4);
    expect(summary.perluTindakan.length).toBeGreaterThan(0);
    expect(
      summary.perluTindakan.some((item) => item.badgeLabel === "Revisi"),
    ).toBe(true);
    expect(summary.tugasSaya.length).toBeGreaterThan(0);
    expect(summary.capaianSaya.targetProdiPersen).toBeGreaterThanOrEqual(0);
    expect(summary.capaianSaya.targetProdiPersen).toBeLessThanOrEqual(100);

    const last = summary.trend.points[summary.trend.points.length - 1];
    expect(last.capaian).toBe(summary.capaianSaya.realisasiPersen);
    expect(summary.trend.tahunTarget).toBe(new Date().getFullYear());

    const sliceTotal = summary.statusDistribution.slices.reduce(
      (acc, slice) => acc + slice.value,
      0,
    );
    expect(sliceTotal).toBe(summary.statusDistribution.totalTugas);

    // Badge tenggat berasal dari tanggal nyata, bukan dari prioritas.
    for (const item of summary.perluTindakan.filter((i) =>
      i.id.startsWith("tugas-"),
    )) {
      expect(item.badgeLabel).toMatch(/^(H-\d+|Hari ini|Terlambat)$/);
    }
  });
});
