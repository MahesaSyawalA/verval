import { randomInt } from "node:crypto";
import type { UserRole } from "@/config/roles";
import { AppError } from "@/lib/http";
import type { CreateAgendaRapatInput } from "../schemas/rapat.schema";
import type {
  RapatFilterParams,
  RapatItem,
  RapatUserOption,
  StatusRapatType,
} from "../types";
import {
  findAllRapat,
  findRapatById,
  findRapatUserOptions,
  insertRapatRecord,
  updateRapatStatusRecord,
} from "./rapat.repository";

/**
 * Menghasilkan 6 karakter kode presensi sesuai aturan bisnis 4 (Spec Bagian 8).
 */
export function generateKodePresensi(seedNumber?: number): string {
  if (typeof seedNumber === "number" && Number.isFinite(seedNumber)) {
    return String((Math.abs(Math.trunc(seedNumber)) % 900000) + 100000);
  }
  return String(randomInt(100000, 1000000));
}

/**
 * Kode presensi hanya boleh dilihat Kaprodi, Admin, dan notulis rapat itu
 * (yang menampilkannya di ruang rapat). Peserta lain harus memperolehnya di ruang rapat.
 */
export function redactKodePresensi(
  rapat: RapatItem,
  actor: { id: string; role: UserRole },
): RapatItem {
  const canSeeCode =
    actor.role === "Kaprodi" ||
    actor.role === "Admin" ||
    rapat.notulisId === actor.id;
  return canSeeCode ? rapat : { ...rapat, kodePresensi: "" };
}

export interface RapatRepositoryDeps {
  findAll: typeof findAllRapat;
  findById: typeof findRapatById;
  findUserOptions: typeof findRapatUserOptions;
  insert: typeof insertRapatRecord;
  updateStatus: typeof updateRapatStatusRecord;
}

const defaultDeps: RapatRepositoryDeps = {
  findAll: findAllRapat,
  findById: findRapatById,
  findUserOptions: findRapatUserOptions,
  insert: insertRapatRecord,
  updateStatus: updateRapatStatusRecord,
};

export async function listRapatForUser(
  actor: { id: string; role: UserRole },
  filter?: RapatFilterParams,
  deps: RapatRepositoryDeps = defaultDeps,
): Promise<RapatItem[]> {
  const items = await deps.findAll(filter);
  return items.map((item) => redactKodePresensi(item, actor));
}

export async function listRapatUserOptions(
  deps: RapatRepositoryDeps = defaultDeps,
): Promise<RapatUserOption[]> {
  return deps.findUserOptions();
}

export async function getRapatDetail(
  rapatId: string,
  deps: RapatRepositoryDeps = defaultDeps,
): Promise<RapatItem> {
  const rapat = await deps.findById(rapatId);
  if (!rapat) {
    throw new AppError("NOT_FOUND", "Agenda rapat tidak ditemukan.", 404);
  }
  return rapat;
}

export async function getRapatDetailForUser(
  rapatId: string,
  actor: { id: string; role: UserRole },
  deps: RapatRepositoryDeps = defaultDeps,
): Promise<RapatItem> {
  return redactKodePresensi(await getRapatDetail(rapatId, deps), actor);
}

export async function createAgendaRapat(
  input: CreateAgendaRapatInput,
  actor: { id: string; role: UserRole },
  deps: RapatRepositoryDeps = defaultDeps,
): Promise<RapatItem> {
  if (actor.role !== "Kaprodi" && actor.role !== "Admin") {
    throw new AppError(
      "FORBIDDEN",
      "Hanya Kaprodi atau Admin yang dapat membuat agenda rapat.",
      403,
    );
  }

  const kodePresensi = generateKodePresensi();
  const slug = input.judulRapat
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const generatedFileUndangan =
    input.metodeUndangan === "Generate_Otomatis"
      ? `undangan/undangan-${slug || "rapat"}.pdf`
      : (input.fileUndangan ?? null);

  return deps.insert(input, kodePresensi, generatedFileUndangan);
}

export async function changeRapatStatus(
  rapatId: string,
  statusRapat: StatusRapatType,
  actor: { id: string; role: UserRole },
  deps: RapatRepositoryDeps = defaultDeps,
): Promise<RapatItem> {
  if (actor.role !== "Kaprodi" && actor.role !== "Admin") {
    throw new AppError(
      "FORBIDDEN",
      "Hanya Kaprodi atau Admin yang dapat mengubah status rapat.",
      403,
    );
  }

  await getRapatDetail(rapatId, deps);
  return deps.updateStatus(rapatId, statusRapat);
}
