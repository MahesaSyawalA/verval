import fs from "node:fs/promises";
import path from "node:path";

export function getStorageRoot(): string {
  const configured = process.env.STORAGE_DIR || "./storage";
  return path.resolve(process.cwd(), configured);
}

export async function saveStorageFile(
  subFolder: string,
  fileName: string,
  content: Buffer | Uint8Array,
): Promise<string> {
  const safeSubFolder = subFolder.replace(/[^a-zA-Z0-9_-]/g, "");
  const safeFileName = `${Date.now()}-${path.basename(fileName).replace(/[^a-zA-Z0-9._-]/g, "_")}`;
  const folderPath = path.join(getStorageRoot(), safeSubFolder);

  await fs.mkdir(folderPath, { recursive: true });
  const fullPath = path.join(folderPath, safeFileName);
  await fs.writeFile(fullPath, content);

  return `${safeSubFolder}/${safeFileName}`;
}

export async function readStorageFile(relativePath: string): Promise<Buffer> {
  const root = getStorageRoot();
  const fullPath = path.resolve(root, relativePath);

  // Wajib berada di dalam root; tambahkan separator agar folder bersaudara
  // seperti "storage-lain" tidak lolos pengecekan awalan.
  if (!fullPath.startsWith(root + path.sep)) {
    throw new Error("Akses path di luar direktori storage ditolak.");
  }

  return fs.readFile(fullPath);
}
