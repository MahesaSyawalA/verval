import { describe, expect, it } from "vitest";
import { evaluateUangCompleteness } from "@/lib/utils";
import { mapRapatRecord } from "../server/rapat.repository";

describe("Phase 11 — Arsip Rapat & Kelengkapan UANG", () => {
  it("menandai paket UANG sebagai Lengkap (4 dari 4 bagian) apabila U, A, N (Final), dan G terpenuhi", () => {
    const status = evaluateUangCompleteness({
      hasUndangan: true,
      hasAbsensi: true,
      hasFinalNotulensi: true,
      hasDokumentasi: true,
    });

    expect(status.isComplete).toBe(true);
    expect(status.missing).toEqual([]);
  });

  it("mendeteksi elemen UANG yang belum lengkap (mis. kurang G atau kurang N, G) secara akurat", () => {
    const missingG = evaluateUangCompleteness({
      hasUndangan: true,
      hasAbsensi: true,
      hasFinalNotulensi: true,
      hasDokumentasi: false,
    });
    expect(missingG.isComplete).toBe(false);
    expect(missingG.missing).toEqual(["G"]);

    const missingNG = evaluateUangCompleteness({
      hasUndangan: true,
      hasAbsensi: true,
      hasFinalNotulensi: false,
      hasDokumentasi: false,
    });
    expect(missingNG.isComplete).toBe(false);
    expect(missingNG.missing).toEqual(["N", "G"]);
  });

  it("memetakan record rapat Prisma beserta perhitungan hadir/izin/sakit/belum dan status UANG", () => {
    const mapped = mapRapatRecord({
      id: "rapat-mutu",
      notulis_id: "u-budi",
      judul_rapat: "Rapat Penjaminan Mutu",
      tanggal: new Date("2026-10-14T00:00:00.000Z"),
      waktu_mulai: new Date("1970-01-01T08:30:00.000Z"),
      waktu_selesai: new Date("1970-01-01T10:00:00.000Z"),
      format: "Luring",
      lokasi: "Ruang Sidang A",
      deskripsi_agenda: "Evaluasi mutu perkuliahan",
      kode_presensi: "RPL404",
      is_reminder_active: true,
      metode_undangan: "Generate_Otomatis",
      file_undangan: "undangan/mutu.pdf",
      status_rapat: "Selesai",
      notulis: {
        id: "u-budi",
        nip: "198801012015041001",
        nama_lengkap: "Budi Santoso, M.Kom.",
        email: "budi@upi.edu",
        role: "Dosen",
        password: "hash",
      },
      peserta_rapat: [
        {
          id: "pr-1",
          dosen_id: "u-budi",
          rapat_id: "rapat-mutu",
          status_kehadiran: "Hadir",
          waktu_presensi: new Date("2026-10-14T08:25:00.000Z"),
          metode_presensi: "Kode",
          keterangan_absen: null,
          dosen: {
            id: "u-budi",
            nip: "198801012015041001",
            nama_lengkap: "Budi Santoso, M.Kom.",
            email: "budi@upi.edu",
            role: "Dosen",
            password: "hash",
          },
        },
      ],
      notulensi: {
        id: "not-mutu",
        rapat_id: "rapat-mutu",
        dibuat_oleh: "u-budi",
        agenda_pembahasan: "Standar mutu",
        hal_dibahas: "Evaluasi akhir semester",
        keputusan: "Standar penjaminan mutu diperbarui",
        tindak_lanjut: "Gugus mutu menyusun instrumen",
        file_lampiran: null,
        status_notulensi: "Final",
        pembuat: {
          id: "u-budi",
          nip: "198801012015041001",
          nama_lengkap: "Budi Santoso, M.Kom.",
          email: "budi@upi.edu",
          role: "Dosen",
          password: "hash",
        },
      },
      dokumentasi: [],
    });

    expect(mapped.durasiMenit).toBe(90);
    expect(mapped.hadirCount).toBe(1);
    expect(mapped.uangStatus.U).toBe(true);
    expect(mapped.uangStatus.A).toBe(true);
    expect(mapped.uangStatus.N).toBe(true);
    expect(mapped.uangStatus.G).toBe(false);
    expect(mapped.uangStatus.isComplete).toBe(false);
    expect(mapped.uangStatus.missing).toEqual(["G"]);
  });
});
