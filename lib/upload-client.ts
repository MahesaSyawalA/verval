import { upload } from "@vercel/blob/client";
import { MAX_UPLOAD_SIZE_BYTES } from "./constants";
import {
  buildUploadPathname,
  isAllowedUpload,
  type UploadFolder,
} from "./upload-rules";

export interface UploadedStoredFile {
  path: string;
  fileName: string;
  size: number;
}

/**
 * Mengunggah berkas dari browser dan mengembalikan jalur yang disimpan di database.
 * - Driver "blob": langsung ke Vercel Blob (tidak lewat fungsi server, jadi tidak
 *   kena batas body sekitar 4,5 MB di Vercel). Token dibuat oleh /api/storage/blob-upload.
 * - Driver "disk": lewat POST /api/storage/upload.
 * Validasi di sini hanya untuk pesan yang cepat; server tetap memvalidasi ulang.
 */
export async function uploadStoredFile(
  file: File,
  folder: UploadFolder,
  failureMessage = "Gagal mengunggah berkas.",
): Promise<UploadedStoredFile> {
  if (file.size <= 0) {
    throw new Error("Berkas yang diunggah kosong.");
  }
  if (file.size > MAX_UPLOAD_SIZE_BYTES) {
    throw new Error("Ukuran berkas melebihi batas maksimal 10 MB.");
  }
  if (!isAllowedUpload(folder, file.name)) {
    throw new Error("Tipe berkas tidak diizinkan untuk kategori ini.");
  }

  if (process.env.NEXT_PUBLIC_STORAGE_DRIVER === "blob") {
    try {
      const blob = await upload(buildUploadPathname(folder, file.name), file, {
        access: "private",
        handleUploadUrl: "/api/storage/blob-upload",
      });
      return { path: blob.pathname, fileName: file.name, size: file.size };
    } catch {
      throw new Error(failureMessage);
    }
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("folder", folder);

  const response = await fetch("/api/storage/upload", {
    method: "POST",
    body: formData,
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(payload?.error?.message ?? failureMessage);
  }

  return payload.data;
}
