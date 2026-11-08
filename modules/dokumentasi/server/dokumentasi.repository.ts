import prisma from "@/lib/db";
import type { DokumentasiPhotoEntryInput } from "../schemas/dokumentasi.schema";
import type {
  DokumentasiPhotoItem,
  RapatDokumentasiContext,
} from "../types";

export async function findRapatDokumentasiContext(
  rapatId: string,
): Promise<RapatDokumentasiContext | null> {
  const row = await prisma.rapat.findUnique({
    where: { id: rapatId },
    include: {
      peserta_rapat: {
        select: { dosen_id: true },
      },
    },
  });

  if (!row) return null;

  return {
    rapatId: row.id,
    judulRapat: row.judul_rapat,
    notulisId: row.notulis_id,
    pesertaIds: row.peserta_rapat.map((p) => p.dosen_id),
  };
}

export async function insertDokumentasiPhotosRecord(
  rapatId: string,
  photos: DokumentasiPhotoEntryInput[],
): Promise<DokumentasiPhotoItem[]> {
  await prisma.dokumentasi.createMany({
    data: photos.map((p) => ({
      rapat_id: rapatId,
      file_gambar: p.fileGambar,
      caption: p.caption ?? null,
    })),
  });

  const rows = await prisma.dokumentasi.findMany({
    where: { rapat_id: rapatId },
    orderBy: { id: "asc" },
  });

  return rows.map((d) => ({
    id: d.id,
    rapatId: d.rapat_id,
    fileGambar: d.file_gambar,
    caption: d.caption,
  }));
}
