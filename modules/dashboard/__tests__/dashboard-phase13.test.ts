import { describe, expect, it } from "vitest";
import { getKaprodiDashboardSummary } from "../server/dashboard.service";

describe("Phase 13 - Dashboard Kinerja Kaprodi", () => {
  it("menghasilkan ringkasan KPI, distribusi status, peringkat dosen, dan tiket terbaru untuk Kaprodi", async () => {
    const summary = await getKaprodiDashboardSummary();

    expect(summary.stats.capaianVsTargetPersen).toBeGreaterThanOrEqual(0);
    expect(summary.stats.capaianVsTargetPersen).toBeLessThanOrEqual(100);
    expect(summary.stats.menungguVerifikasiCount).toBeGreaterThanOrEqual(1);
    expect(summary.statusDistribution.slices).toHaveLength(4);
    expect(summary.trend.points).toHaveLength(6);
    expect(summary.peringkatDosen.palingProduktif.length).toBeGreaterThan(0);
    expect(summary.peringkatDosen.perluDipantau.length).toBeGreaterThan(0);
    expect(summary.tiketTerbaru.length).toBeGreaterThan(0);
  });

  it("memakai data nyata: titik tren terakhir dan target diturunkan dari tiket", async () => {
    const summary = await getKaprodiDashboardSummary();
    const last = summary.trend.points[summary.trend.points.length - 1];

    expect(last.capaian).toBe(summary.stats.capaianVsTargetPersen);
    expect(summary.capaianProdi.realisasiPersen).toBe(
      summary.stats.capaianVsTargetPersen,
    );
    expect(summary.capaianProdi.targetPersen).toBe(summary.trend.targetPersen);
    expect(summary.trend.targetPersen).toBe(last.target);
    expect(summary.trend.tahunTarget).toBe(new Date().getFullYear());
    expect(summary.stats.capaianDelta).toMatch(/^[+-]?\d+%$/);
    expect(summary.stats.dosenAktifLabel).toMatch(/^\d+\/\d+$/);

    const sliceTotal = summary.statusDistribution.slices.reduce(
      (acc, slice) => acc + slice.value,
      0,
    );
    expect(sliceTotal).toBe(summary.statusDistribution.totalTarget);
  });
});
