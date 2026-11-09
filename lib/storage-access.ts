import type { UserRole } from "@/config/roles";
import prisma from "@/lib/db";

export const UPLOAD_FOLDERS = [
  "bukti",
  "undangan",
  "dokumentasi",
  "lampiran",
] as const;

export type UploadFolder = (typeof UPLOAD_FOLDERS)[number];

const ALLOWED_EXTENSIONS: Record<UploadFolder, readonly string[]> = {
  bukti: ["pdf", "png", "jpg", "jpeg", "doc", "docx"],
  undangan: ["pdf", "doc", "docx"],
  dokumentasi: ["png", "jpg", "jpeg", "webp"],
  lampiran: ["pdf", "ppt", "pptx", "doc", "docx"],
};

/** Hanya Kaprodi/Admin yang menyiapkan surat undangan; folder lain terbuka untuk semua. */
const UPLOAD_ROLES: Partial<Record<UploadFolder, readonly UserRole[]>> = {
  undangan: ["Kaprodi", "Admin"],
};

export function isUploadFolder(value: unknown): value is UploadFolder {
  return (
    typeof value === "string" &&
    (UPLOAD_FOLDERS as readonly string[]).includes(value)
  );
}

export function isAllowedUpload(folder: UploadFolder, fileName: string): boolean {
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
  return fileName.includes(".") && ALLOWED_EXTENSIONS[folder].includes(ext);
}

export function canUploadToFolder(folder: UploadFolder, role: UserRole): boolean {
  const allowed = UPLOAD_ROLES[folder];
  return !allowed || allowed.includes(role);
}

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
