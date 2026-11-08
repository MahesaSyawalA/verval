import prisma from "@/lib/db";
import type { SaveNotulensiInput } from "../schemas/notulensi.schema";
import type { NotulensiItem, RapatNotulensiContext } from "../types";

export async function findRapatNotulensiContext(
  rapatId: string,
): Promise<RapatNotulensiContext | null> {
  const row = await prisma.rapat.findUnique({
    where: { id: rapatId },
    include: {
      notulis: true,
      notulensi: true,
    },
  });

  if (!row) return null;

  return {
    rapatId: row.id,
    judulRapat: row.judul_rapat,
    notulisId: row.notulis_id,
    notulisNama: row.notulis.nama_lengkap,
    existingNotulensi: row.notulensi
      ? {
          id: row.notulensi.id,
          agendaPembahasan: row.notulensi.agenda_pembahasan,
          halDibahas: row.notulensi.hal_dibahas,
          keputusan: row.notulensi.keputusan,
          tindakLanjut: row.notulensi.tindak_lanjut,
          fileLampiran: row.notulensi.file_lampiran,
          statusNotulensi: row.notulensi.status_notulensi,
        }
      : null,
  };
}

export async function upsertNotulensiRecord(
  rapatId: string,
  aktorId: string,
  input: SaveNotulensiInput,
): Promise<NotulensiItem> {
  const saved = await prisma.$transaction(async (tx) => {
    const result = await tx.notulensi.upsert({
      where: { rapat_id: rapatId },
      update: {
        agenda_pembahasan: input.agendaPembahasan,
        hal_dibahas: input.halDibahas,
        keputusan: input.keputusan,
        tindak_lanjut: input.tindakLanjut,
        file_lampiran: input.fileLampiran ?? null,
        status_notulensi: input.statusNotulensi,
      },
      create: {
        rapat_id: rapatId,
        dibuat_oleh: aktorId,
        agenda_pembahasan: input.agendaPembahasan,
        hal_dibahas: input.halDibahas,
        keputusan: input.keputusan,
        tindak_lanjut: input.tindakLanjut,
        file_lampiran: input.fileLampiran ?? null,
        status_notulensi: input.statusNotulensi,
      },
    });

    if (input.statusNotulensi === "Final") {
      await tx.rapat.update({
        where: { id: rapatId },
        data: { status_rapat: "Selesai" },
      });
    }

    return result;
  });

  return {
    id: saved.id,
    rapatId: saved.rapat_id,
    agendaPembahasan: saved.agenda_pembahasan,
    halDibahas: saved.hal_dibahas,
    keputusan: saved.keputusan,
    tindakLanjut: saved.tindak_lanjut,
    fileLampiran: saved.file_lampiran,
    statusNotulensi: saved.status_notulensi,
    dibuatOlehId: saved.dibuat_oleh,
  };
}
