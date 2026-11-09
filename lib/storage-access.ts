import type { UserRole } from "@/config/roles";
import prisma from "@/lib/db";

// Aturan unggahan dipindah ke upload-rules (murni, bisa dipakai browser);
// diekspor ulang agar impor lama tetap berfungsi.
export {
  UPLOAD_FOLDERS,
  canUploadToFolder,
  isAllowedUpload,
  isUploadFolder,
  type UploadFolder,
} from "./upload-rules";

type StorageDb = Pick<
  typeof prisma,
  "isian_bukti" | "rapat" | "dokumentasi" | "notulensi"
>;

/**
 * Kaprodi/Admin boleh membaca semua berkas. Dosen hanya berkas yang terhubung ke
 * data miliknya: bukti tiketnya, atau berkas rapat yang ia ikuti / notulisi.
 * Berkas yang belum dirujuk data mana pun ditolak.
 */
export async function canReadStoredFile(
  actor: { id: string; role: UserRole },
  relativePath: string,
  db: StorageDb = prisma,
): Promise<boolean> {
  if (actor.role === "Kaprodi" || actor.role === "Admin") return true;

  const folder = relativePath.split("/")[0];
  const rapatMilikku = {
    OR: [
      { notulis_id: actor.id },
      { peserta_rapat: { some: { dosen_id: actor.id } } },
    ],
  };

  switch (folder) {
    case "bukti":
      return Boolean(
        await db.isian_bukti.findFirst({
          where: {
            nilai_isian: relativePath,
            tiket_penugasan: { dosen_id: actor.id },
          },
          select: { id: true },
        }),
      );
    case "undangan":
      return Boolean(
        await db.rapat.findFirst({
          where: { file_undangan: relativePath, ...rapatMilikku },
          select: { id: true },
        }),
      );
    case "dokumentasi":
      return Boolean(
        await db.dokumentasi.findFirst({
          where: { file_gambar: relativePath, rapat: rapatMilikku },
          select: { id: true },
        }),
      );
    case "lampiran":
      return Boolean(
        await db.notulensi.findFirst({
          where: { file_lampiran: relativePath, rapat: rapatMilikku },
          select: { id: true },
        }),
      );
    default:
      return false;
  }
}
