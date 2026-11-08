import { AppError } from "@/lib/http";
import type { MasterTargetInput } from "../schemas/target.schema";
import type { MasterTargetItem, TargetFilterParams } from "../types";
import {
  findAllTargets,
  findTargetById,
  findTargetByKode,
  insertTarget,
  removeTargetRecord,
  updateTargetRecord,
} from "./target.repository";

export interface TargetRepositoryDeps {
  findAll: typeof findAllTargets;
  findById: typeof findTargetById;
  findByKode: typeof findTargetByKode;
  insert: typeof insertTarget;
  update: typeof updateTargetRecord;
  remove: typeof removeTargetRecord;
}

const defaultDeps: TargetRepositoryDeps = {
  findAll: findAllTargets,
  findById: findTargetById,
  findByKode: findTargetByKode,
  insert: insertTarget,
  update: updateTargetRecord,
  remove: removeTargetRecord,
};

export async function listMasterTargets(
  filter?: TargetFilterParams,
  deps: TargetRepositoryDeps = defaultDeps,
): Promise<MasterTargetItem[]> {
  return deps.findAll(filter);
}

export async function getMasterTargetById(
  id: string,
  deps: TargetRepositoryDeps = defaultDeps,
): Promise<MasterTargetItem> {
  const item = await deps.findById(id);
  if (!item) {
    throw new AppError("NOT_FOUND", "Master target tidak ditemukan.", 404);
  }
  return item;
}

export async function createMasterTarget(
  input: MasterTargetInput,
  deps: TargetRepositoryDeps = defaultDeps,
): Promise<MasterTargetItem> {
  const existing = await deps.findByKode(input.kodeTarget);
  if (existing) {
    throw new AppError(
      "CONFLICT",
      `Kode target "${input.kodeTarget}" sudah digunakan.`,
      409,
      { kodeTarget: "Kode target sudah terdaftar." },
    );
  }

  return deps.insert(input);
}

export async function updateMasterTarget(
  id: string,
  input: MasterTargetInput,
  deps: TargetRepositoryDeps = defaultDeps,
): Promise<MasterTargetItem> {
  const current = await deps.findById(id);
  if (!current) {
    throw new AppError("NOT_FOUND", "Master target tidak ditemukan.", 404);
  }

  const byKode = await deps.findByKode(input.kodeTarget);
  if (byKode && byKode.id !== id) {
    throw new AppError(
      "CONFLICT",
      `Kode target "${input.kodeTarget}" sudah digunakan oleh target lain.`,
      409,
      { kodeTarget: "Kode target sudah digunakan." },
    );
  }

  return deps.update(id, input);
}

export async function deleteMasterTarget(
  id: string,
  deps: TargetRepositoryDeps = defaultDeps,
): Promise<void> {
  const current = await deps.findById(id);
  if (!current) {
    throw new AppError("NOT_FOUND", "Master target tidak ditemukan.", 404);
  }

  if (current.kuantitasDitugaskan > 0) {
    throw new AppError(
      "CONFLICT",
      "Target yang sudah memiliki tiket penugasan tidak dapat dihapus.",
      409,
    );
  }

  await deps.remove(id);
}
