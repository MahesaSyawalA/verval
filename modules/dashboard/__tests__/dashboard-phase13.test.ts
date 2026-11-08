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
    expect(summary.capaianProdi.targetPersen).toBe(78);
  });
});
