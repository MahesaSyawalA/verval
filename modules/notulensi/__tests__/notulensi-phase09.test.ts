import { describe, expect, it, vi } from "vitest";
import { AppError } from "@/lib/http";
import { saveNotulensiSchema } from "../schemas/notulensi.schema";
import {
  type NotulensiRepositoryDeps,
  saveNotulensiRapat,
} from "../server/notulensi.service";
import type { RapatNotulensiContext } from "../types";

const BASE_CONTEXT: RapatNotulensiContext = {
  rapatId: "rapat-eval",
  judulRapat: "Evaluasi Kinerja Dosen Semester Ganjil",
  notulisId: "dosen-indira",
  notulisNama: "Indira Maharani",
  existingNotulensi: {
    id: "not-1",
    agendaPembahasan: "Evaluasi capaian semester ganjil",
    halDibahas: "Capaian publikasi 4 dari 5 artikel.",
    keputusan: "Batas unggah bukti diperpanjang.",
    tindakLanjut: "Kaprodi mengirim pengingat.",
    fileLampiran: null,
    statusNotulensi: "Draf",
  },
};

function createMockDeps(
  overrides?: Partial<NotulensiRepositoryDeps>,
): NotulensiRepositoryDeps {
  return {
    findContext: vi.fn().mockResolvedValue(BASE_CONTEXT),
    saveNotulensi: vi
      .fn()
      .mockImplementation(async (rapatId, aktorId, input) => ({
        id: "not-1",
        rapatId,
        dibuatOlehId: aktorId,
        agendaPembahasan: input.agendaPembahasan,
        halDibahas: input.halDibahas,
        keputusan: input.keputusan,
        tindakLanjut: input.tindakLanjut,
        fileLampiran: input.fileLampiran ?? null,
        statusNotulensi: input.statusNotulensi,
      })),
    ...overrides,
  };
}

describe("Phase 09 — Editor Notulensi Rapat", () => {
  describe("saveNotulensiSchema", () => {
    it("menerima isian notulensi valid dengan status Draf atau Final", () => {
      const parsed = saveNotulensiSchema.safeParse({
        agendaPembahasan: "1. Evaluasi capaian kinerja dosen",
        halDibahas: "Capaian publikasi baru 4 dari 5 artikel.",
        keputusan: "Batas unggah bukti diperpanjang sampai 30 Nov 2026.",
        tindakLanjut: "Kaprodi mengirim pengingat ke dosen.",
        statusNotulensi: "Final",
      });
      expect(parsed.success).toBe(true);
    });
  });

  describe("saveNotulensiRapat service", () => {
    it("mengizinkan notulis rapat menyimpan draf dan memfinalisasi notulensi", async () => {
      const deps = createMockDeps();
      const result = await saveNotulensiRapat(
        "rapat-eval",
        {
          agendaPembahasan: "1. Evaluasi capaian kinerja dosen",
          halDibahas: "Capaian publikasi baru 4 dari 5 artikel.",
          keputusan: "Batas unggah bukti diperpanjang sampai 30 Nov 2026.",
          tindakLanjut: "Kaprodi mengirim pengingat ke dosen.",
          statusNotulensi: "Final",
        },
        { id: "dosen-indira", role: "Dosen" },
        deps,
      );

      expect(result.statusNotulensi).toBe("Final");
      expect(deps.saveNotulensi).toHaveBeenCalledTimes(1);
    });

    it("menolak perubahan notulensi oleh pengguna yang bukan notulis rapat tersebut", async () => {
      const deps = createMockDeps();
      await expect(
        saveNotulensiRapat(
          "rapat-eval",
          {
            agendaPembahasan: "Agenda baru",
            halDibahas: "Bahasan baru",
            keputusan: "Keputusan baru",
            tindakLanjut: "Tindak lanjut baru",
            statusNotulensi: "Draf",
          },
          { id: "dosen-bukan-notulis", role: "Dosen" },
          deps,
        ),
      ).rejects.toThrow(AppError);
    });

    it("menolak perubahan apabila notulensi sudah berstatus Final di arsip", async () => {
      const deps = createMockDeps({
        findContext: vi.fn().mockResolvedValue({
          ...BASE_CONTEXT,
          existingNotulensi: {
            ...BASE_CONTEXT.existingNotulensi!,
            statusNotulensi: "Final",
          },
        }),
      });

      await expect(
        saveNotulensiRapat(
          "rapat-eval",
          {
            agendaPembahasan: "Agenda diubah setelah final",
            halDibahas: "Bahasan diubah",
            keputusan: "Keputusan diubah",
            tindakLanjut: "Tindak lanjut diubah",
            statusNotulensi: "Draf",
          },
          { id: "dosen-indira", role: "Dosen" },
          deps,
        ),
      ).rejects.toThrow(AppError);
    });
  });
});
