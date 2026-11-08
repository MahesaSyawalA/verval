// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import { AppError } from "@/lib/http";
import { submitPresensiSchema } from "../schemas/presensi.schema";
import {
  type PresensiRepositoryDeps,
  submitPresensiRapat,
} from "../server/presensi.service";
import type { RapatPresensiContext } from "../types";

const CONTEXT: RapatPresensiContext = {
  rapatId: "rapat-1",
  judulRapat: "Rapat Evaluasi",
  statusRapat: "Berlangsung",
  kodePresensi: "482719",
  peserta: [
    {
      id: "p-1",
      dosenId: "dosen-diundang",
      dosenNama: "Dosen Diundang",
      dosenNip: "1",
      dosenRole: "Dosen",
      statusKehadiran: "Belum_Hadir",
      waktuPresensi: null,
      metodePresensi: null,
      keteranganAbsen: null,
    },
  ],
};

function makeDeps(): PresensiRepositoryDeps {
  return {
    findContext: vi.fn().mockResolvedValue(CONTEXT),
    savePresensi: vi.fn().mockImplementation(async (p) => ({
      rapatId: p.rapatId,
      judulRapat: p.judulRapat,
      dosenId: p.dosenId,
      dosenNama: "x",
      statusKehadiran: p.statusKehadiran,
      metodePresensi: p.metodePresensi,
      waktuPresensi: "2026-10-21T06:04:00.000Z",
      keteranganAbsen: p.keteranganAbsen ?? null,
    })),
  };
}

const DIUNDANG = { id: "dosen-diundang", role: "Dosen" as const };

describe("submitPresensiSchema", () => {
  it("mewajibkan kode 6 karakter untuk Hadir lewat Scan QR", () => {
    const res = submitPresensiSchema.safeParse({
      statusKehadiran: "Hadir",
      metodePresensi: "Scan_QR",
    });
    expect(res.success).toBe(false);
  });

  it("menolak Hadir dengan metode Manual", () => {
    const res = submitPresensiSchema.safeParse({
      statusKehadiran: "Hadir",
      metodePresensi: "Manual",
      kodePresensi: "482719",
    });
    expect(res.success).toBe(false);
  });

  it("menerima Izin/Sakit tanpa kode", () => {
    const res = submitPresensiSchema.safeParse({
      statusKehadiran: "Izin",
      metodePresensi: "Manual",
    });
    expect(res.success).toBe(true);
  });
});

describe("submitPresensiRapat — kehadiran tidak bisa dipalsukan", () => {
  it("menolak pengguna yang tidak diundang sebagai peserta", async () => {
    const deps = makeDeps();
    await expect(
      submitPresensiRapat(
        "rapat-1",
        { statusKehadiran: "Hadir", metodePresensi: "Kode", kodePresensi: "482719" },
        { id: "dosen-lain", role: "Dosen" },
        deps,
      ),
    ).rejects.toMatchObject({ status: 403 });
    expect(deps.savePresensi).not.toHaveBeenCalled();
  });

  it("menolak Scan QR dengan kode salah atau tanpa kode", async () => {
    const deps = makeDeps();
    await expect(
      submitPresensiRapat(
        "rapat-1",
        { statusKehadiran: "Hadir", metodePresensi: "Scan_QR", kodePresensi: "000000" },
        DIUNDANG,
        deps,
      ),
    ).rejects.toBeInstanceOf(AppError);
    await expect(
      submitPresensiRapat(
        "rapat-1",
        { statusKehadiran: "Hadir", metodePresensi: "Scan_QR" },
        DIUNDANG,
        deps,
      ),
    ).rejects.toBeInstanceOf(AppError);
    expect(deps.savePresensi).not.toHaveBeenCalled();
  });

  it("menolak Hadir dengan metode Manual walau kode benar", async () => {
    const deps = makeDeps();
    await expect(
      submitPresensiRapat(
        "rapat-1",
        { statusKehadiran: "Hadir", metodePresensi: "Manual", kodePresensi: "482719" },
        DIUNDANG,
        deps,
      ),
    ).rejects.toMatchObject({ status: 400 });
    expect(deps.savePresensi).not.toHaveBeenCalled();
  });

  it("menerima Scan QR dengan kode yang benar", async () => {
    const deps = makeDeps();
    const res = await submitPresensiRapat(
      "rapat-1",
      { statusKehadiran: "Hadir", metodePresensi: "Scan_QR", kodePresensi: "482719" },
      DIUNDANG,
      deps,
    );
    expect(res.metodePresensi).toBe("Scan_QR");
  });

  it("menerima Izin tanpa kode", async () => {
    const deps = makeDeps();
    const res = await submitPresensiRapat(
      "rapat-1",
      { statusKehadiran: "Izin", metodePresensi: "Manual", keteranganAbsen: "Sakit ringan" },
      DIUNDANG,
      deps,
    );
    expect(res.statusKehadiran).toBe("Izin");
  });
});
