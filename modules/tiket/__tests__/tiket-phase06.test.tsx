import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AppError } from "@/lib/http";
import * as tiketApi from "../api";
import { KaprodiTicketDetail } from "../components/kaprodi-ticket-detail";
import { verifyTiketSchema } from "../schemas/tiket.schema";
import {
  type TiketRepositoryDeps,
  verifyTicketByKaprodi,
} from "../server/tiket.service";
import type { TicketItem } from "../types";

const WAITING_TICKET: TicketItem = {
  id: "tiket-014",
  kodeTiket: "#TGT-2026-014",
  targetId: "tgt-2",
  kodeTarget: "T-02",
  namaTarget: "Partisipasi Konferensi Internasional",
  satuan: "Makalah",
  tahunTarget: 2026,
  kuantitasTargetTotal: 6,
  kuantitasDitugaskan: 3,
  progresSubmisiCount: 2,
  progresPersen: 67,
  tenggatWaktu: "2026-09-30T00:00:00.000Z",
  prioritas: "Normal",
  isReminderActive: true,
  status: "Menunggu_Verifikasi",
  catatanKaprodi: null,
  tanggalDibuat: "2026-04-02T09:14:00.000Z",
  dosenId: "dosen-indira",
  dosenNama: "Dr. Indira Prameswari, M.T.",
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
  isianBukti: [
    {
      id: "ib-1",
      formatBuktiId: "fld-2",
      namaField: "Judul Makalah",
      tipeData: "Teks",
      urutanSubmisi: 1,
      nilaiIsian:
        "Hybrid Requirement Tracing using LLM in Agile Software Project (ICoDSA 2026)",
    },
    {
      id: "ib-2",
      formatBuktiId: "fld-2",
      namaField: "Judul Makalah",
      tipeData: "Teks",
      urutanSubmisi: 2,
      nilaiIsian:
        "Automated Rubric Grading for Capstone Software Engineering (ICEEI 2026)",
    },
  ],
  riwayatTiket: [
    {
      id: "rw-1",
      statusRiwayat: "Ditugaskan",
      createdAt: "2026-04-02T09:14:00.000Z",
      aktorId: "kaprodi-iqbal",
      aktorNama: "Dr. Iqbal Al-Farisi",
      aktorRole: "Kaprodi",
    },
    {
      id: "rw-2",
      statusRiwayat: "Dikerjakan",
      createdAt: "2026-04-05T11:22:00.000Z",
      aktorId: "dosen-indira",
      aktorNama: "Dr. Indira Prameswari",
      aktorRole: "Dosen",
    },
    {
      id: "rw-3",
      statusRiwayat: "Menunggu Verifikasi",
      createdAt: "2026-04-14T16:40:00.000Z",
      aktorId: "dosen-indira",
      aktorNama: "Dr. Indira Prameswari",
      aktorRole: "Dosen",
    },
  ],
};

function createMockDeps(
  overrides?: Partial<TiketRepositoryDeps>,
): TiketRepositoryDeps {
  return {
    findAll: vi.fn().mockResolvedValue([WAITING_TICKET]),
    findById: vi.fn().mockResolvedValue(WAITING_TICKET),
    findDosens: vi.fn().mockResolvedValue([]),
    countTickets: vi.fn().mockResolvedValue(21),
    insert: vi.fn().mockResolvedValue(WAITING_TICKET),
    updateStatus: vi
      .fn()
      .mockImplementation(async (_id, nextStatus, _aktorId, catatan) => ({
        ...WAITING_TICKET,
        status: nextStatus,
        catatanKaprodi: catatan ?? null,
      })),
    saveBukti: vi.fn().mockResolvedValue(WAITING_TICKET),
    ...overrides,
  };
}

describe("Phase 06 — Verifikasi Tiket oleh Kaprodi", () => {
  describe("verifyTiketSchema", () => {
    it("menerima keputusan approve tanpa catatan", () => {
      const parsed = verifyTiketSchema.safeParse({
        decision: "approve",
      });
      expect(parsed.success).toBe(true);
    });

    it("menolak keputusan reject tanpa catatan untuk dosen", () => {
      const parsed = verifyTiketSchema.safeParse({
        decision: "reject",
        catatanKaprodi: "",
      });
      expect(parsed.success).toBe(false);
    });

    it("menerima keputusan reject dengan catatan minimal 5 karakter", () => {
      const parsed = verifyTiketSchema.safeParse({
        decision: "reject",
        catatanKaprodi: "Sertifikat pemakalah belum ditandatangani panitia.",
      });
      expect(parsed.success).toBe(true);
    });
  });

  describe("verifyTicketByKaprodi service", () => {
    it("menyetujui tiket Menunggu_Verifikasi menjadi Tercapai", async () => {
      const deps = createMockDeps();
      const result = await verifyTicketByKaprodi(
        "tiket-014",
        { decision: "approve" },
        { id: "kaprodi-iqbal", role: "Kaprodi" },
        deps,
      );

      expect(result.status).toBe("Tercapai");
      expect(deps.updateStatus).toHaveBeenCalledWith(
        "tiket-014",
        "Tercapai",
        "kaprodi-iqbal",
        undefined,
      );
    });

    it("menolak tiket Menunggu_Verifikasi menjadi Ditolak beserta catatanKaprodi", async () => {
      const deps = createMockDeps();
      const result = await verifyTicketByKaprodi(
        "tiket-014",
        {
          decision: "reject",
          catatanKaprodi: "Mohon unggah ulang sertifikat berstempel basah.",
        },
        { id: "kaprodi-iqbal", role: "Kaprodi" },
        deps,
      );

      expect(result.status).toBe("Ditolak");
      expect(result.catatanKaprodi).toBe(
        "Mohon unggah ulang sertifikat berstempel basah.",
      );
      expect(deps.updateStatus).toHaveBeenCalledWith(
        "tiket-014",
        "Ditolak",
        "kaprodi-iqbal",
        "Mohon unggah ulang sertifikat berstempel basah.",
      );
    });

    it("menolak verifikasi apabila dilakukan oleh peran Dosen", async () => {
      const deps = createMockDeps();
      await expect(
        verifyTicketByKaprodi(
          "tiket-014",
          { decision: "approve" },
          { id: "dosen-indira", role: "Dosen" },
          deps,
        ),
      ).rejects.toThrow(AppError);
    });
  });

  describe("Komponen KaprodiTicketDetail (Alur Kritis Verifikasi Tiket)", () => {
    it("menampilkan validasi wajib catatan saat klik Tolak tanpa mengisi alasan, lalu berhasil memanggil API saat alasan diisi", async () => {
      vi.spyOn(tiketApi, "fetchTicketByIdApi").mockResolvedValue({
        data: WAITING_TICKET,
      });
      const verifySpy = vi
        .spyOn(tiketApi, "verifyTicketApi")
        .mockResolvedValue({
          data: {
            ...WAITING_TICKET,
            status: "Ditolak",
            catatanKaprodi: "Mohon lengkapi makalah ke-3.",
          },
        });

      const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } },
      });

      render(
        <QueryClientProvider client={queryClient}>
          <KaprodiTicketDetail
            ticketId="tiket-014"
            userFullName="Dr. Iqbal Al-Farisi, M.Kom."
          />
        </QueryClientProvider>,
      );

      expect(
        await screen.findByText(/Tiket #TGT-2026-014/i),
      ).toBeInTheDocument();

      const rejectButton = screen.getByRole("button", {
        name: /Tolak .* Minta Revisi/i,
      });
      fireEvent.click(rejectButton);

      expect(
        await screen.findByRole("alert"),
      ).toHaveTextContent(/Catatan untuk dosen wajib diisi/i);
      expect(verifySpy).not.toHaveBeenCalled();

      const textarea = screen.getByPlaceholderText(
        /Catatan untuk dosen \(wajib jika ditolak\)/i,
      );
      fireEvent.change(textarea, {
        target: { value: "Mohon lengkapi makalah ke-3." },
      });
      fireEvent.click(rejectButton);

      await waitFor(() => {
        expect(verifySpy).toHaveBeenCalledWith("tiket-014", {
          decision: "reject",
          catatanKaprodi: "Mohon lengkapi makalah ke-3.",
        });
      });
    });
  });
});
