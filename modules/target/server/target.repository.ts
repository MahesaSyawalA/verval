import { db } from "@/lib/db";
import type { MasterTargetInput } from "../schemas/target.schema";
import type { MasterTargetItem, TargetFilterParams } from "../types";

type RawTargetWithRelations = NonNullable<
  Awaited<ReturnType<typeof findTargetRecordById>>
>;

function mapTargetRecord(record: RawTargetWithRelations): MasterTargetItem {
  const kuantitasDitugaskan = record.tiket_penugasan.reduce(
    (sum, t) => sum + t.kuantitas_ditugaskan,
    0,
  );

  return {
    id: record.id,
    kodeTarget: record.kode_target,
    namaTarget: record.nama_target,
    kuantitasTotal: record.kuantitas_total,
    kuantitasDitugaskan,
    satuan: record.satuan,
    tahun: record.tahun,
    formatBukti: record.format_bukti.map((fb) => ({
      id: fb.id,
      namaField: fb.nama_field,
      tipeData: fb.tipe_data,
      statusIsian: fb.status_isian,
    })),
  };
}

export async function findTargetRecordById(id: string) {
  return db.master_target.findUnique({
    where: { id },
    include: {
      format_bukti: true,
      tiket_penugasan: {
        select: { kuantitas_ditugaskan: true },
      },
    },
  });
}

export async function findTargetByKode(kodeTarget: string) {
  return db.master_target.findUnique({
    where: { kode_target: kodeTarget.trim() },
  });
}

export async function findAllTargets(
  filter?: TargetFilterParams,
): Promise<MasterTargetItem[]> {
  const search = filter?.search?.trim();

  const records = await db.master_target.findMany({
    where: {
      ...(filter?.tahun ? { tahun: filter.tahun } : {}),
      ...(search
        ? {
            OR: [
              { kode_target: { contains: search } },
              { nama_target: { contains: search } },
            ],
          }
        : {}),
    },
    include: {
      format_bukti: true,
      tiket_penugasan: {
        select: { kuantitas_ditugaskan: true },
      },
    },
    orderBy: { kode_target: "asc" },
  });

  return records.map(mapTargetRecord);
}

export async function findTargetById(
  id: string,
): Promise<MasterTargetItem | null> {
  const record = await findTargetRecordById(id);
  return record ? mapTargetRecord(record) : null;
}

export async function insertTarget(
  input: MasterTargetInput,
): Promise<MasterTargetItem> {
  const created = await db.master_target.create({
    data: {
      kode_target: input.kodeTarget.trim(),
      nama_target: input.namaTarget.trim(),
      kuantitas_total: input.kuantitasTotal,
      satuan: input.satuan.trim(),
      tahun: input.tahun,
      format_bukti: {
        create: input.formatBukti.map((fb) => ({
          nama_field: fb.namaField.trim(),
          tipe_data: fb.tipeData,
          status_isian: fb.statusIsian,
        })),
      },
    },
    include: {
      format_bukti: true,
      tiket_penugasan: {
        select: { kuantitas_ditugaskan: true },
      },
    },
  });

  return mapTargetRecord(created);
}

export async function updateTargetRecord(
  id: string,
  input: MasterTargetInput,
): Promise<MasterTargetItem> {
  const updated = await db.$transaction(async (tx) => {
    const existingBukti = await tx.format_bukti.findMany({
      where: { target_id: id },
      include: { _count: { select: { isian_bukti: true } } },
    });

    const incomingWithId = new Set(
      input.formatBukti.map((fb) => fb.id).filter(Boolean),
    );

    // Delete format_bukti that are removed AND have no submissions yet
    for (const old of existingBukti) {
      if (!incomingWithId.has(old.id) && old._count.isian_bukti === 0) {
        await tx.format_bukti.delete({ where: { id: old.id } });
      }
    }

    // Upsert/create incoming format_bukti
    for (const fb of input.formatBukti) {
      if (fb.id && existingBukti.some((e) => e.id === fb.id)) {
        await tx.format_bukti.update({
          where: { id: fb.id },
          data: {
            nama_field: fb.namaField.trim(),
            tipe_data: fb.tipeData,
            status_isian: fb.statusIsian,
          },
        });
      } else {
        await tx.format_bukti.create({
          data: {
            target_id: id,
            nama_field: fb.namaField.trim(),
            tipe_data: fb.tipeData,
            status_isian: fb.statusIsian,
          },
        });
      }
    }

    return tx.master_target.update({
      where: { id },
      data: {
        kode_target: input.kodeTarget.trim(),
        nama_target: input.namaTarget.trim(),
        kuantitas_total: input.kuantitasTotal,
        satuan: input.satuan.trim(),
        tahun: input.tahun,
      },
      include: {
        format_bukti: true,
        tiket_penugasan: {
          select: { kuantitas_ditugaskan: true },
        },
      },
    });
  });

  return mapTargetRecord(updated);
}

export async function removeTargetRecord(id: string): Promise<void> {
  await db.master_target.delete({
    where: { id },
  });
}
