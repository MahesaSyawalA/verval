import type { UserRole } from "@/config/roles";
import { AppError } from "@/lib/http";
import type { SaveDokumentasiInput } from "../schemas/dokumentasi.schema";
import type { DokumentasiPhotoItem } from "../types";
import {
  findRapatDokumentasiContext,
  insertDokumentasiPhotosRecord,
} from "./dokumentasi.repository";

export interface DokumentasiRepositoryDeps {
  findContext: typeof findRapatDokumentasiContext;
  insertPhotos: typeof insertDokumentasiPhotosRecord;
}

const defaultDeps: DokumentasiRepositoryDeps = {
  findContext: findRapatDokumentasiContext,
  insertPhotos: insertDokumentasiPhotosRecord,
};

/**
 * Menyimpan foto dokumentasi rapat sebagai elemen G (Gambar) dari paket UANG.
 * Diizinkan bagi Kaprodi, Admin, Notulis rapat, atau peserta rapat.
 */
export async function saveDokumentasiRapat(
  rapatId: string,
  input: SaveDokumentasiInput,
  actor: { id: string; role: UserRole },
  deps: DokumentasiRepositoryDeps = defaultDeps,
): Promise<DokumentasiPhotoItem[]> {
  const ctx = await deps.findContext(rapatId);
  if (!ctx) {
    throw new AppError("NOT_FOUND", "Rapat tidak ditemukan.", 404);
  }

  const isPrivileged = actor.role === "Kaprodi" || actor.role === "Admin";
  const isParticipantOrNotulis =
    ctx.notulisId === actor.id || ctx.pesertaIds.includes(actor.id);

  if (!isPrivileged && !isParticipantOrNotulis) {
    throw new AppError(
      "FORBIDDEN",
      "Hanya notulis, peserta rapat, atau Kaprodi/Admin yang dapat mengunggah foto dokumentasi rapat ini.",
      403,
    );
  }

  return deps.insertPhotos(rapatId, input.photos);
}
