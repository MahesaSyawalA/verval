import type { UserRole } from "@/config/roles";
import { AppError } from "@/lib/http";
import { createTicketAssignment } from "@/modules/tiket/server/tiket.service";
import type { TicketItem } from "@/modules/tiket/types";
import type {
  CreateTindakLanjutTiketInput,
  SaveNotulensiInput,
} from "../schemas/notulensi.schema";
import type { NotulensiItem } from "../types";
import {
  findRapatNotulensiContext,
  upsertNotulensiRecord,
} from "./notulensi.repository";

export interface NotulensiRepositoryDeps {
  findContext: typeof findRapatNotulensiContext;
  saveNotulensi: typeof upsertNotulensiRecord;
  createFollowUpTicket?: typeof createTicketAssignment;
}

const defaultDeps: NotulensiRepositoryDeps = {
  findContext: findRapatNotulensiContext,
  saveNotulensi: upsertNotulensiRecord,
  createFollowUpTicket: createTicketAssignment,
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

/**
 * Integrasi Fase 15:
 * Keputusan & tindak lanjut notulensi menghasilkan tiket penugasan kinerja melalui tiket.service.
 */
export async function createFollowUpTicketFromNotulensi(
  rapatId: string,
  input: CreateTindakLanjutTiketInput,
  actor: { id: string; role: UserRole },
  deps: NotulensiRepositoryDeps = defaultDeps,
): Promise<TicketItem> {
  if (actor.role !== "Kaprodi" && actor.role !== "Admin") {
    throw new AppError(
      "FORBIDDEN",
      "Hanya Kaprodi yang dapat menugaskan tiket tindak lanjut dari keputusan rapat.",
      403,
    );
  }

  const ctx = await deps.findContext(rapatId);
  if (!ctx) {
    throw new AppError("NOT_FOUND", "Rapat tidak ditemukan.", 404);
  }

  if (!ctx.existingNotulensi) {
    throw new AppError(
      "BAD_REQUEST",
      "Notulensi rapat belum tersedia untuk ditindaklanjuti menjadi tiket.",
      400,
    );
  }

  const createTicketFn = deps.createFollowUpTicket ?? createTicketAssignment;

  const catatanTindakLanjut = `Tindak lanjut ${ctx.judulRapat} — Keputusan: ${ctx.existingNotulensi.keputusan} | Tindak Lanjut: ${ctx.existingNotulensi.tindakLanjut}`;

  return createTicketFn(
    {
      targetId: input.targetId,
      dosenId: input.dosenId,
      kuantitasDitugaskan: input.kuantitasDitugaskan,
      tenggatWaktu: input.tenggatWaktu,
      prioritas: input.prioritas,
      isReminderActive: true,
      catatanKaprodi: catatanTindakLanjut,
    },
    actor.id,
  );
}
