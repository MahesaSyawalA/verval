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
    expect(summary.capaianSaya.targetProdiPersen).toBe(78);
  });
});
