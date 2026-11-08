import { describe, expect, it, vi } from "vitest";
import { AppError } from "@/lib/http";
import { submitBuktiSchema } from "../schemas/tiket.schema";
import {
  submitTicketBukti,
  type TiketRepositoryDeps,
} from "../server/tiket.service";
import type { TicketItem } from "../types";

const BASE_TICKET: TicketItem = {
  id: "tiket-014",
  kodeTiket: "#TGT-2026-014",
  targetId: "tgt-2",
  kodeTarget: "T-02",
  namaTarget: "Partisipasi Konferensi Internasional",
  satuan: "Makalah",
  tahunTarget: 2026,
  kuantitasTargetTotal: 6,
  kuantitasDitugaskan: 3,
  progresSubmisiCount: 0,
  progresPersen: 0,
  tenggatWaktu: "2026-09-30T00:00:00.000Z",
  prioritas: "Normal",
  isReminderActive: true,
  status: "Ditugaskan",
  catatanKaprodi: null,
  tanggalDibuat: "2026-04-02T09:14:00.000Z",
  dosenId: "dosen-indira",
  dosenNama: "Bu Indira",
  dosenNip: "198605142014042001",
  dosenEmail: "indira@nodecraft.id",
  formatBukti: [
    {
      id: "fld-1",
      namaField: "Surat Tugas",
      tipeData: "File",
      statusIsian: "Wajib",
    },
    {
      id: "fld-2",
      namaField: "Judul Makalah",
      tipeData: "Teks",
      statusIsian: "Wajib",
    },
  ],
  isianBukti: [],
  riwayatTiket: [
    {
      id: "rw-1",
      statusRiwayat: "Ditugaskan",
      createdAt: "2026-04-02T09:14:00.000Z",
      aktorId: "kaprodi-iqbal",
      aktorNama: "Pa Iqbal",
      aktorRole: "Kaprodi",
    },
  ],
};

function createMockDeps(
  overrides?: Partial<TiketRepositoryDeps>,
): TiketRepositoryDeps {
  return {
    findAll: vi.fn().mockResolvedValue([BASE_TICKET]),
    findById: vi.fn().mockResolvedValue(BASE_TICKET),
    findDosens: vi.fn().mockResolvedValue([]),
    countTickets: vi.fn().mockResolvedValue(21),
    insert: vi.fn().mockResolvedValue(BASE_TICKET),
    updateStatus: vi.fn().mockResolvedValue(BASE_TICKET),
    saveBukti: vi
      .fn()
      .mockImplementation(async (_id, _subs, nextStatus, _aktorId, history) => ({
        ...BASE_TICKET,
        status: nextStatus,
        riwayatTiket: [
          ...BASE_TICKET.riwayatTiket,
          ...history.map((statusRiwayat: string, idx: number) => ({
            id: `rw-new-${idx}`,
            statusRiwayat,
            createdAt: "2026-04-14T16:40:00.000Z",
            aktorId: "dosen-indira",
            aktorNama: "Bu Indira",
            aktorRole: "Dosen",
          })),
        ],
      })),
    ...overrides,
  };
}

describe("Phase 05 — Tiket Dosen, Upload Bukti & Revisi", () => {
  describe("submitBuktiSchema", () => {
    it("menerima payload unggah bukti dengan action draft atau submit", () => {
      const parsed = submitBuktiSchema.safeParse({
        action: "submit",
        submissions: [
          {
            formatBuktiId: "fld-1",
            urutanSubmisi: 1,
            nilaiIsian: "bukti/ST_ICoDSA_2026_Indira.pdf",
          },
        ],
      });
      expect(parsed.success).toBe(true);
    });

    it("menolak submissions kosong", () => {
      const parsed = submitBuktiSchema.safeParse({
        action: "submit",
        submissions: [],
      });
      expect(parsed.success).toBe(false);
    });
  });

  describe("submitTicketBukti service", () => {
    it("menyimpan draf pada tiket Ditugaskan dan mengubah status menjadi Dikerjakan", async () => {
      const deps = createMockDeps();
      const result = await submitTicketBukti(
        "tiket-014",
        {
          action: "draft",
          submissions: [
            {
              formatBuktiId: "fld-1",
              urutanSubmisi: 1,
              nilaiIsian: "bukti/ST_ICoDSA_2026_Indira.pdf",
            },
          ],
        },
        { id: "dosen-indira", role: "Dosen" },
        deps,
      );

      expect(result.status).toBe("Dikerjakan");
      expect(deps.saveBukti).toHaveBeenCalledWith(
        "tiket-014",
        expect.any(Array),
        "Dikerjakan",
        "dosen-indira",
        ["Dikerjakan"],
      );
    });

    it("mengirim bukti verifikasi dari status Ditolak (revisi) ke Menunggu_Verifikasi dan mencatat riwayat_tiket", async () => {
      const rejectedTicket: TicketItem = {
        ...BASE_TICKET,
        status: "Ditolak",
        catatanKaprodi: "Masih kurang 1 makalah lagi.",
      };
      const deps = createMockDeps({
        findById: vi.fn().mockResolvedValue(rejectedTicket),
      });

      const result = await submitTicketBukti(
        "tiket-014",
        {
          action: "submit",
          submissions: [
            {
              formatBuktiId: "fld-2",
              urutanSubmisi: 3,
              nilaiIsian:
                "Makalah #3: Graph Neural Network for Curriculum Alignment",
            },
          ],
        },
        { id: "dosen-indira", role: "Dosen" },
        deps,
      );

      expect(result.status).toBe("Menunggu_Verifikasi");
      expect(deps.saveBukti).toHaveBeenCalledWith(
        "tiket-014",
        expect.any(Array),
        "Menunggu_Verifikasi",
        "dosen-indira",
        ["Menunggu Verifikasi"],
      );
    });

    it("menolak dosen lain mengunggah bukti ke tiket yang bukan miliknya", async () => {
      const deps = createMockDeps();
      await expect(
        submitTicketBukti(
          "tiket-014",
          {
            action: "submit",
            submissions: [
              {
                formatBuktiId: "fld-1",
                urutanSubmisi: 1,
                nilaiIsian: "bukti/test.pdf",
              },
            ],
          },
          { id: "dosen-lain", role: "Dosen" },
          deps,
        ),
      ).rejects.toThrow(AppError);
    });

    it("menolak perubahan bukti apabila tiket sudah berstatus Tercapai", async () => {
      const completedTicket: TicketItem = {
        ...BASE_TICKET,
        status: "Tercapai",
      };
      const deps = createMockDeps({
        findById: vi.fn().mockResolvedValue(completedTicket),
      });

      await expect(
        submitTicketBukti(
          "tiket-014",
          {
            action: "submit",
            submissions: [
              {
                formatBuktiId: "fld-1",
                urutanSubmisi: 1,
                nilaiIsian: "bukti/test.pdf",
              },
            ],
          },
          { id: "dosen-indira", role: "Dosen" },
          deps,
        ),
      ).rejects.toThrow(AppError);
    });
  });
});
