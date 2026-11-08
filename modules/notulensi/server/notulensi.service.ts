import type { UserRole } from "@/config/roles";
import { AppError } from "@/lib/http";
import type { SaveNotulensiInput } from "../schemas/notulensi.schema";
import type { NotulensiItem } from "../types";
import {
  findRapatNotulensiContext,
  upsertNotulensiRecord,
} from "./notulensi.repository";

export interface NotulensiRepositoryDeps {
  findContext: typeof findRapatNotulensiContext;
  saveNotulensi: typeof upsertNotulensiRecord;
}

const defaultDeps: NotulensiRepositoryDeps = {
  findContext: findRapatNotulensiContext,
  saveNotulensi: upsertNotulensiRecord,
};

/**
 * Aturan bisnis 5 (Spec Bagian 8):
 * - Status Draf atau Final.
 * - Hanya notulis yang ditunjuk pada rapat tersebut yang dapat mengubah notulensi.
 * - Notulensi yang sudah Final masuk ke arsip dan tidak dapat diubah lagi.
 */
export async function saveNotulensiRapat(
  rapatId: string,
  input: SaveNotulensiInput,
  actor: { id: string; role: UserRole },
  deps: NotulensiRepositoryDeps = defaultDeps,
): Promise<NotulensiItem> {
  const ctx = await deps.findContext(rapatId);
  if (!ctx) {
    throw new AppError("NOT_FOUND", "Rapat tidak ditemukan.", 404);
  }

  if (ctx.notulisId !== actor.id) {
    throw new AppError(
      "FORBIDDEN",
      "Hanya dosen yang ditunjuk sebagai notulis rapat ini yang dapat mengubah notulensi.",
      403,
    );
  }

  if (ctx.existingNotulensi?.statusNotulensi === "Final") {
    throw new AppError(
      "CONFLICT",
      "Notulensi sudah berstatus Final di arsip dan tidak dapat diubah lagi.",
      409,
    );
  }

  return deps.saveNotulensi(rapatId, actor.id, input);
}
