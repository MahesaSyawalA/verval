import { describe, expect, it, vi } from "vitest";
import { AppError } from "@/lib/http";
import { saveDokumentasiSchema } from "../schemas/dokumentasi.schema";
import {
  type DokumentasiRepositoryDeps,
  saveDokumentasiRapat,
} from "../server/dokumentasi.service";
import type { RapatDokumentasiContext } from "../types";

const BASE_CONTEXT: RapatDokumentasiContext = {
  rapatId: "rapat-eval",
  judulRapat: "Evaluasi Kinerja Dosen Semester Ganjil",
  notulisId: "dosen-indira",
  pesertaIds: ["dosen-indira", "dosen-budi"],
};

function createMockDeps(
  overrides?: Partial<DokumentasiRepositoryDeps>,
): DokumentasiRepositoryDeps {
  return {
    findContext: vi.fn().mockResolvedValue(BASE_CONTEXT),
    insertPhotos: vi.fn().mockImplementation(async (rapatId, photos) =>
      photos.map((p, idx) => ({
        id: `doc-${idx + 1}`,
        rapatId,
        fileGambar: p.fileGambar,
        caption: p.caption ?? null,
      })),
    ),
    ...overrides,
  };
}

describe("Phase 10 — Dokumentasi Foto Rapat", () => {
  describe("saveDokumentasiSchema", () => {
    it("menerima daftar foto dokumentasi beserta caption", () => {
      const parsed = saveDokumentasiSchema.safeParse({
        photos: [
          {
            fileGambar: "dokumentasi/IMG_2041.jpg",
            caption: "Suasana rapat di Ruang Sidang B",
          },
        ],
      });
      expect(parsed.success).toBe(true);
    });

    it("menolak apabila array photos kosong", () => {
      const parsed = saveDokumentasiSchema.safeParse({
        photos: [],
      });
      expect(parsed.success).toBe(false);
    });
  });

  describe("saveDokumentasiRapat service", () => {
    it("menyimpan foto dokumentasi yang diunggah oleh notulis atau peserta rapat", async () => {
      const deps = createMockDeps();
      const res = await saveDokumentasiRapat(
        "rapat-eval",
        {
          photos: [
            {
              fileGambar: "dokumentasi/IMG_2041.jpg",
              caption: "Suasana rapat di Ruang Sidang B",
            },
          ],
        },
        { id: "dosen-indira", role: "Dosen" },
        deps,
      );

      expect(res).toHaveLength(1);
      expect(res[0].caption).toBe("Suasana rapat di Ruang Sidang B");
    });

    it("menolak dosen yang tidak diundang ke rapat tersebut", async () => {
      const deps = createMockDeps();
      await expect(
        saveDokumentasiRapat(
          "rapat-eval",
          {
            photos: [{ fileGambar: "dokumentasi/IMG_2041.jpg" }],
          },
          { id: "dosen-luar", role: "Dosen" },
          deps,
        ),
      ).rejects.toThrow(AppError);
    });
  });
});
