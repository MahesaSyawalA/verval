import type { UserRole } from "@/config/roles";
import { AppError } from "@/lib/http";
import type { SubmitPresensiInput } from "../schemas/presensi.schema";
import type { PresensiSubmissionResult } from "../types";
import {
  findRapatPresensiContext,
  upsertPesertaPresensiRecord,
} from "./presensi.repository";

export interface PresensiRepositoryDeps {
  findContext: typeof findRapatPresensiContext;
  savePresensi: typeof upsertPesertaPresensiRecord;
}

const defaultDeps: PresensiRepositoryDeps = {
  findContext: findRapatPresensiContext,
  savePresensi: upsertPesertaPresensiRecord,
};

/**
 * Aturan bisnis 4 (Spec Bagian 8):
 * - Presensi hanya dapat diisi saat rapat berstatus Berlangsung.
 * - Metode: Kode, Scan_QR, atau Manual.
 * - Satu dosen satu presensi per rapat (menolak pengisian ganda bila sudah tercatat Hadir/Izin/Sakit).
 * - Kode presensi 6 karakter diverifikasi terhadap rapat.kode_presensi.
 */
export async function submitPresensiRapat(
  rapatId: string,
  input: SubmitPresensiInput,
  actor: { id: string; role: UserRole },
  deps: PresensiRepositoryDeps = defaultDeps,
): Promise<PresensiSubmissionResult> {
  const ctx = await deps.findContext(rapatId);
  if (!ctx) {
    throw new AppError("NOT_FOUND", "Rapat tidak ditemukan.", 404);
  }

  if (ctx.statusRapat !== "Berlangsung") {
    throw new AppError(
      "CONFLICT",
      "Presensi hanya dapat diisi saat rapat berstatus Berlangsung.",
      409,
    );
  }

  const existing = ctx.peserta.find((p) => p.dosenId === actor.id);
  if (existing && existing.statusKehadiran !== "Belum_Hadir") {
    throw new AppError(
      "CONFLICT",
      "Anda sudah mengisi presensi pada rapat ini.",
      409,
    );
  }

  if (input.statusKehadiran === "Hadir" && input.metodePresensi === "Kode") {
    const submittedCode = (input.kodePresensi ?? "").trim().toUpperCase();
    const expectedCode = ctx.kodePresensi.trim().toUpperCase();
    if (submittedCode !== expectedCode) {
      throw new AppError(
        "BAD_REQUEST",
        "Kode presensi tidak sesuai dengan kode rapat yang sedang berlangsung.",
        400,
      );
    }
  }

  const effectiveMetode =
    input.statusKehadiran === "Hadir" ? input.metodePresensi : "Manual";

  return deps.savePresensi({
    rapatId: ctx.rapatId,
    judulRapat: ctx.judulRapat,
    dosenId: actor.id,
    statusKehadiran: input.statusKehadiran,
    metodePresensi: effectiveMetode,
    keteranganAbsen: input.keteranganAbsen,
  });
}
