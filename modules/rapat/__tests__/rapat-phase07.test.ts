import { describe, expect, it, vi } from "vitest";
import { AppError } from "@/lib/http";
import { createAgendaRapatSchema } from "../schemas/rapat.schema";
import {
  createAgendaRapat,
  generateKodePresensi,
  type RapatRepositoryDeps,
} from "../server/rapat.service";
import type { RapatItem } from "../types";

const SAMPLE_RAPAT: RapatItem = {
  id: "rapat-1",
  judulRapat: "Evaluasi Kinerja Dosen Semester Ganjil",
  tanggal: "2026-10-21T00:00:00.000Z",
  waktuMulai: "13:00",
  waktuSelesai: "14:30",
  durasiMenit: 90,
  format: "Luring",
  lokasi: "Ruang Sidang B",
  deskripsiAgenda: "Evaluasi capaian publikasi dan pengabdian.",
  kodePresensi: "482719",
  isReminderActive: true,
  metodeUndangan: "Generate_Otomatis",
  fileUndangan: "undangan/undangan-evaluasi-kinerja-dosen-semester-ganjil.pdf",
  statusRapat: "Dijadwalkan",
  notulisId: "dosen-indira",
  notulisNama: "Indira Maharani",
  peserta: [],
  notulensi: null,
  dokumentasi: [],
  uangStatus: {
    U: true,
    A: false,
    N: false,
    G: false,
    isComplete: false,
    missing: ["A", "N", "G"],
  },
  totalPeserta: 4,
  hadirCount: 0,
  izinCount: 0,
  sakitCount: 0,
  belumHadirCount: 4,
};

function createMockDeps(
  overrides?: Partial<RapatRepositoryDeps>,
): RapatRepositoryDeps {
  return {
    findAll: vi.fn().mockResolvedValue([SAMPLE_RAPAT]),
    findById: vi.fn().mockResolvedValue(SAMPLE_RAPAT),
    findUserOptions: vi.fn().mockResolvedValue([]),
    insert: vi.fn().mockResolvedValue(SAMPLE_RAPAT),
    updateStatus: vi.fn().mockResolvedValue(SAMPLE_RAPAT),
    ...overrides,
  };
}

describe("Phase 07 — Agenda Rapat & Surat Undangan", () => {
  describe("createAgendaRapatSchema", () => {
    it("menerima agenda rapat valid dengan durasi 90 menit dan metode Generate_Otomatis", () => {
      const parsed = createAgendaRapatSchema.safeParse({
        judulRapat: "Evaluasi Kinerja Dosen Semester Ganjil",
        tanggal: "2026-10-21",
        waktuMulai: "13:00",
        waktuSelesai: "14:30",
        format: "Luring",
        lokasi: "Ruang Sidang B",
        pesertaIds: ["u-1", "u-2"],
        notulisId: "u-2",
        deskripsiAgenda: "Evaluasi capaian semester ganjil.",
        metodeUndangan: "Generate_Otomatis",
        isReminderActive: true,
      });

      expect(parsed.success).toBe(true);
    });

    it("menolak durasi rapat kurang dari 15 menit atau lebih dari 240 menit", () => {
      const tooShort = createAgendaRapatSchema.safeParse({
        judulRapat: "Rapat Singkat",
        tanggal: "2026-10-21",
        waktuMulai: "13:00",
        waktuSelesai: "13:10",
        format: "Daring",
        lokasi: "Zoom",
        pesertaIds: ["u-1"],
        notulisId: "u-1",
        deskripsiAgenda: "Bahasan singkat.",
        metodeUndangan: "Generate_Otomatis",
      });
      expect(tooShort.success).toBe(false);
    });

    it("mewajibkan fileUndangan apabila metodeUndangan adalah Upload_Manual", () => {
      const manualNoFile = createAgendaRapatSchema.safeParse({
        judulRapat: "Rapat Penjaminan Mutu",
        tanggal: "2026-10-14",
        waktuMulai: "10:00",
        waktuSelesai: "11:30",
        format: "Luring",
        lokasi: "Ruang Sidang A",
        pesertaIds: ["u-1"],
        notulisId: "u-1",
        deskripsiAgenda: "Tinjauan mutu prodi.",
        metodeUndangan: "Upload_Manual",
      });
      expect(manualNoFile.success).toBe(false);
    });
  });

  describe("createAgendaRapat service & generateKodePresensi", () => {
    it("menghasilkan kode presensi 6 karakter dan membuat file undangan otomatis", async () => {
      const kode = generateKodePresensi(482719);
      expect(kode).toHaveLength(6);

      const deps = createMockDeps();
      await createAgendaRapat(
        {
          judulRapat: "Evaluasi Kinerja Dosen",
          tanggal: "2026-10-21",
          waktuMulai: "13:00",
          waktuSelesai: "14:30",
          format: "Luring",
          lokasi: "Ruang Sidang B",
          pesertaIds: ["u-1", "u-2"],
          notulisId: "u-2",
          deskripsiAgenda: "Evaluasi capaian publikasi.",
          metodeUndangan: "Generate_Otomatis",
          isReminderActive: true,
        },
        { id: "kaprodi-1", role: "Kaprodi" },
        deps,
      );

      expect(deps.insert).toHaveBeenCalledWith(
        expect.any(Object),
        expect.stringMatching(/^\d{6}$/),
        "undangan/undangan-evaluasi-kinerja-dosen.pdf",
      );
    });

    it("menolak pembuatan agenda rapat oleh peran Dosen", async () => {
      const deps = createMockDeps();
      await expect(
        createAgendaRapat(
          {
            judulRapat: "Evaluasi Kinerja Dosen",
            tanggal: "2026-10-21",
            waktuMulai: "13:00",
            waktuSelesai: "14:30",
            format: "Luring",
            lokasi: "Ruang Sidang B",
            pesertaIds: ["u-1"],
            notulisId: "u-1",
            deskripsiAgenda: "Evaluasi capaian publikasi.",
            metodeUndangan: "Generate_Otomatis",
            isReminderActive: true,
          },
          { id: "dosen-1", role: "Dosen" },
          deps,
        ),
      ).rejects.toThrow(AppError);
    });
  });
});
