import fs from "node:fs/promises";
import path from "node:path";
import { get, put } from "@vercel/blob";
import { parseUploadPathname, sanitizeUploadFileName } from "./upload-rules";

/**
 * Pengemudi penyimpanan berkas:
 * - "disk" (bawaan): folder lokal `STORAGE_DIR`, untuk development dan server dengan disk persisten.
 * - "blob": Vercel Blob privat, untuk Vercel (disk di sana tidak permanen).
 * Dipilih lewat NEXT_PUBLIC_STORAGE_DRIVER agar browser dan server sepakat.
 */
export type StorageDriver = "disk" | "blob";

export function getStorageDriver(): StorageDriver {
  return process.env.NEXT_PUBLIC_STORAGE_DRIVER === "blob" ? "blob" : "disk";
}

export function getStorageRoot(): string {
  const configured = process.env.STORAGE_DIR || "./storage";
  return path.resolve(/*turbopackIgnore: true*/ process.cwd(), configured);
}

export async function saveStorageFile(
  subFolder: string,
  fileName: string,
  content: Buffer | Uint8Array,
): Promise<string> {
  const safeSubFolder = subFolder.replace(/[^a-zA-Z0-9_-]/g, "");
  const safeFileName = `${Date.now()}-${sanitizeUploadFileName(path.basename(fileName))}`;

  if (getStorageDriver() === "blob") {
    const blob = await put(
      `${safeSubFolder}/${safeFileName}`,
      Buffer.from(content),
      { access: "private", addRandomSuffix: true },
    );
    return blob.pathname;
  }

  const folderPath = path.join(
    /*turbopackIgnore: true*/ getStorageRoot(),
    safeSubFolder,
  );

  await fs.mkdir(folderPath, { recursive: true });
  const fullPath = path.join(/*turbopackIgnore: true*/ folderPath, safeFileName);
  await fs.writeFile(fullPath, content);

  return `${safeSubFolder}/${safeFileName}`;
}

export async function readStorageFile(relativePath: string): Promise<Buffer> {
  if (getStorageDriver() === "blob") {
    if (!parseUploadPathname(relativePath)) {
      throw new Error("Akses path di luar direktori storage ditolak.");
    }

    const result = await get(relativePath, { access: "private" });
    if (!result || result.statusCode !== 200 || !result.stream) {
      throw new Error("Berkas tidak ditemukan.");
    }
    return Buffer.from(await new Response(result.stream).arrayBuffer());
  }

  const root = getStorageRoot();
  const fullPath = path.resolve(/*turbopackIgnore: true*/ root, relativePath);

  // Wajib berada di dalam root; tambahkan separator agar folder bersaudara
  // seperti "storage-lain" tidak lolos pengecekan awalan.
  if (!fullPath.startsWith(root + path.sep)) {
    throw new Error("Akses path di luar direktori storage ditolak.");
  }

  return fs.readFile(fullPath);
}
