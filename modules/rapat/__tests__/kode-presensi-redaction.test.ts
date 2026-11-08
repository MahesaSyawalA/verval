// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import {
  generateKodePresensi,
  getRapatDetailForUser,
  listRapatForUser,
  redactKodePresensi,
  type RapatRepositoryDeps,
} from "../server/rapat.service";
import type { RapatItem } from "../types";

const RAPAT = {
  id: "r-1",
  notulisId: "notulis-1",
  kodePresensi: "482719",
} as RapatItem;

const deps = {
  findAll: vi.fn().mockResolvedValue([RAPAT]),
  findById: vi.fn().mockResolvedValue(RAPAT),
} as unknown as RapatRepositoryDeps;

describe("redactKodePresensi", () => {
  it("menyembunyikan kode dari dosen biasa", () => {
    const res = redactKodePresensi(RAPAT, { id: "dosen-x", role: "Dosen" });
    expect(res.kodePresensi).toBe("");
  });

  it.each([
    ["Kaprodi", "kaprodi-1"],
    ["Admin", "admin-1"],
    ["Dosen", "notulis-1"],
  ] as const)("menampilkan kode untuk %s (%s)", (role, id) => {
    expect(redactKodePresensi(RAPAT, { id, role }).kodePresensi).toBe("482719");
  });

  it("tidak memutasi objek asal", () => {
    redactKodePresensi(RAPAT, { id: "dosen-x", role: "Dosen" });
    expect(RAPAT.kodePresensi).toBe("482719");
  });
});

describe("kode presensi pada respons rapat", () => {
  it("daftar rapat tidak membocorkan kode ke dosen non-notulis", async () => {
    const res = await listRapatForUser({ id: "dosen-x", role: "Dosen" }, undefined, deps);
    expect(res.every((r) => r.kodePresensi === "")).toBe(true);
  });

  it("detail rapat tidak membocorkan kode ke dosen non-notulis", async () => {
    const res = await getRapatDetailForUser("r-1", { id: "dosen-x", role: "Dosen" }, deps);
    expect(res.kodePresensi).toBe("");
  });

  it("detail rapat memberi kode ke Kaprodi", async () => {
    const res = await getRapatDetailForUser("r-1", { id: "k", role: "Kaprodi" }, deps);
    expect(res.kodePresensi).toBe("482719");
  });
});

describe("generateKodePresensi", () => {
  it("selalu menghasilkan 6 digit", () => {
    for (let i = 0; i < 200; i++) {
      expect(generateKodePresensi()).toMatch(/^\d{6}$/);
    }
  });
});
