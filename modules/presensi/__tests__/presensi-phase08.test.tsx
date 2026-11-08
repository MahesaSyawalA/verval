import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AppError } from "@/lib/http";
import type { RapatItem } from "@/modules/rapat";
import * as presensiApi from "../api";
import { IsiPresensiModal } from "../components/isi-presensi-modal";
import {
  type PresensiRepositoryDeps,
  submitPresensiRapat,
} from "../server/presensi.service";
import type { RapatPresensiContext } from "../types";

const SAMPLE_CONTEXT: RapatPresensiContext = {
  rapatId: "rapat-eval",
  judulRapat: "Evaluasi Kinerja Dosen Semester Ganjil",
  statusRapat: "Berlangsung",
  kodePresensi: "482719",
  peserta: [
    {
      id: "pr-1",
      dosenId: "dosen-indira",
      dosenNama: "Indira Maharani",
      dosenNip: "199008212018032001",
      dosenRole: "Dosen",
      statusKehadiran: "Belum_Hadir",
      waktuPresensi: null,
      metodePresensi: null,
      keteranganAbsen: null,
    },
  ],
};

const SAMPLE_RAPAT_ITEM: RapatItem = {
  id: "rapat-eval",
  judulRapat: "Evaluasi Kinerja Dosen Semester Ganjil",
  tanggal: "2026-10-21T00:00:00.000Z",
  waktuMulai: "13:00",
  waktuSelesai: "14:30",
  durasiMenit: 90,
  format: "Luring",
  lokasi: "Ruang Sidang B",
  deskripsiAgenda: "Evaluasi capaian publikasi.",
  kodePresensi: "482719",
  isReminderActive: true,
  metodeUndangan: "Generate_Otomatis",
  fileUndangan: "undangan/eval.pdf",
  statusRapat: "Berlangsung",
  notulisId: "dosen-indira",
  notulisNama: "Indira Maharani",
  peserta: SAMPLE_CONTEXT.peserta,
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
  totalPeserta: 1,
  hadirCount: 0,
  izinCount: 0,
  sakitCount: 0,
  belumHadirCount: 1,
};

function createMockDeps(
  overrides?: Partial<PresensiRepositoryDeps>,
): PresensiRepositoryDeps {
  return {
    findContext: vi.fn().mockResolvedValue(SAMPLE_CONTEXT),
    savePresensi: vi.fn().mockImplementation(async (params) => ({
      rapatId: params.rapatId,
      judulRapat: params.judulRapat,
      dosenId: params.dosenId,
      dosenNama: "Indira Maharani",
      statusKehadiran: params.statusKehadiran,
      metodePresensi: params.metodePresensi,
      waktuPresensi: "2026-10-21T06:04:00.000Z",
      keteranganAbsen: params.keteranganAbsen ?? null,
    })),
    ...overrides,
  };
}

describe("Phase 08 — Presensi Rapat & Daftar Hadir", () => {
  describe("submitPresensiRapat service", () => {
    it("mencatat presensi Hadir dengan kode presensi 6 karakter yang tepat saat rapat Berlangsung", async () => {
      const deps = createMockDeps();
      const res = await submitPresensiRapat(
        "rapat-eval",
        {
          statusKehadiran: "Hadir",
          metodePresensi: "Kode",
          kodePresensi: "482719",
        },
        { id: "dosen-indira", role: "Dosen" },
        deps,
      );

      expect(res.statusKehadiran).toBe("Hadir");
      expect(res.metodePresensi).toBe("Kode");
      expect(deps.savePresensi).toHaveBeenCalledTimes(1);
    });

    it("menolak presensi apabila rapat belum atau sudah tidak berstatus Berlangsung", async () => {
      const deps = createMockDeps({
        findContext: vi.fn().mockResolvedValue({
          ...SAMPLE_CONTEXT,
          statusRapat: "Selesai",
        }),
      });

      await expect(
        submitPresensiRapat(
          "rapat-eval",
          {
            statusKehadiran: "Hadir",
            metodePresensi: "Kode",
            kodePresensi: "482719",
          },
          { id: "dosen-indira", role: "Dosen" },
          deps,
        ),
      ).rejects.toThrow(AppError);
    });

    it("menolak presensi kedua oleh dosen yang sudah tercatat hadir pada rapat yang sama", async () => {
      const deps = createMockDeps({
        findContext: vi.fn().mockResolvedValue({
          ...SAMPLE_CONTEXT,
          peserta: [
            {
              ...SAMPLE_CONTEXT.peserta[0],
              statusKehadiran: "Hadir",
            },
          ],
        }),
      });

      await expect(
        submitPresensiRapat(
          "rapat-eval",
          {
            statusKehadiran: "Hadir",
            metodePresensi: "Kode",
            kodePresensi: "482719",
          },
          { id: "dosen-indira", role: "Dosen" },
          deps,
        ),
      ).rejects.toThrow(AppError);
    });

    it("menolak kode presensi yang salah", async () => {
      const deps = createMockDeps();
      await expect(
        submitPresensiRapat(
          "rapat-eval",
          {
            statusKehadiran: "Hadir",
            metodePresensi: "Kode",
            kodePresensi: "000000",
          },
          { id: "dosen-indira", role: "Dosen" },
          deps,
        ),
      ).rejects.toThrow(AppError);
    });
  });

  describe("Komponen IsiPresensiModal (Alur Kritis Presensi)", () => {
    it("menampilkan validasi saat kode presensi kurang dari 6 karakter, lalu menampilkan modal Presensi Berhasil saat 6 digit diisi", async () => {
      const submitSpy = vi
        .spyOn(presensiApi, "submitPresensiRapatApi")
        .mockResolvedValue({
          data: {
            rapatId: "rapat-eval",
            judulRapat: "Evaluasi Kinerja Dosen Semester Ganjil",
            dosenId: "dosen-indira",
            dosenNama: "Indira Maharani",
            statusKehadiran: "Hadir",
            metodePresensi: "Kode",
            waktuPresensi: "2026-10-21T06:04:00.000Z",
            keteranganAbsen: null,
          },
        });

      const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } },
      });

      render(
        <QueryClientProvider client={queryClient}>
          <IsiPresensiModal
            isOpen={true}
            onClose={() => {}}
            rapat={SAMPLE_RAPAT_ITEM}
          />
        </QueryClientProvider>,
      );

      const confirmButton = screen.getByRole("button", {
        name: /Konfirmasi Kehadiran/i,
      });
      fireEvent.click(confirmButton);

      expect(await screen.findByRole("alert")).toHaveTextContent(
        /Kode presensi wajib terdiri dari 6 karakter/i,
      );
      expect(submitSpy).not.toHaveBeenCalled();

      const codeChars = ["4", "8", "2", "7", "1", "9"];
      codeChars.forEach((char, idx) => {
        const input = screen.getByLabelText(`Digit kode presensi ${idx + 1}`);
        fireEvent.change(input, { target: { value: char } });
      });

      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(submitSpy).toHaveBeenCalledWith("rapat-eval", {
          statusKehadiran: "Hadir",
          metodePresensi: "Kode",
          kodePresensi: "482719",
          keteranganAbsen: undefined,
        });
      });

      expect(
        await screen.findByText(/Presensi Berhasil/i),
      ).toBeInTheDocument();
    });
  });
});
