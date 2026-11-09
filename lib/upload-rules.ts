import type { UserRole } from "@/config/roles";

/**
 * Aturan unggahan yang dipakai browser (validasi awal) dan server (validasi
 * yang berwenang). File ini sengaja murni: tanpa Prisma, fs, atau next/server.
 */

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

const CONTENT_TYPE_BY_EXTENSION: Record<string, string> = {
  pdf: "application/pdf",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ppt: "application/vnd.ms-powerpoint",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
};

/** Hanya Kaprodi/Admin yang menyiapkan surat undangan; folder lain terbuka untuk semua. */
const UPLOAD_ROLES: Partial<Record<UploadFolder, readonly UserRole[]>> = {
  undangan: ["Kaprodi", "Admin"],
};

const PATHNAME_PATTERN = /^(bukti|undangan|dokumentasi|lampiran)\/([A-Za-z0-9._-]+)$/;

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

/** Tipe konten yang diizinkan untuk satu folder (untuk token unggah Blob). */
export function allowedContentTypes(folder: UploadFolder): string[] {
  return [
    ...new Set(
      ALLOWED_EXTENSIONS[folder].map((ext) => CONTENT_TYPE_BY_EXTENSION[ext]),
    ),
  ];
}

export function sanitizeUploadFileName(fileName: string): string {
  const base = fileName.split(/[\\/]/).pop() ?? "";
  return base.replace(/[^a-zA-Z0-9._-]/g, "_");
}

/** Jalur penyimpanan seperti `bukti/1731100000000-surat.pdf`. */
export function buildUploadPathname(
  folder: UploadFolder,
  fileName: string,
  now: number = Date.now(),
): string {
  return `${folder}/${now}-${sanitizeUploadFileName(fileName)}`;
}

/** Memecah jalur penyimpanan; null bila bentuknya tidak sah (mis. mengandung `..`). */
export function parseUploadPathname(
  pathname: string,
): { folder: UploadFolder; fileName: string } | null {
  const match = PATHNAME_PATTERN.exec(pathname);
  if (!match || match[2].includes("..")) return null;
  return { folder: match[1] as UploadFolder, fileName: match[2] };
}

export type UploadCheck =
  | { ok: true; folder: UploadFolder }
  | { ok: false; status: 400 | 403; message: string };

/** Validasi berwenang untuk permintaan token unggah langsung ke Blob. */
export function checkUploadPathname(
  pathname: string,
  role: UserRole,
): UploadCheck {
  const parsed = parseUploadPathname(pathname);
  if (!parsed) {
    return { ok: false, status: 400, message: "Jalur berkas tidak valid." };
  }
  if (!canUploadToFolder(parsed.folder, role)) {
    return {
      ok: false,
      status: 403,
      message: "Anda tidak memiliki hak untuk mengunggah berkas ke kategori ini.",
    };
  }
  if (!isAllowedUpload(parsed.folder, parsed.fileName)) {
    return {
      ok: false,
      status: 400,
      message: "Tipe berkas tidak diizinkan untuk kategori ini.",
    };
  }
  return { ok: true, folder: parsed.folder };
}
