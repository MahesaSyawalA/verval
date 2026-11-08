// @vitest-environment node
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { readStorageFile, saveStorageFile } from "@/lib/storage";

let base: string;
let root: string;

beforeEach(async () => {
  base = await fs.mkdtemp(path.join(os.tmpdir(), "rpl-storage-"));
  root = path.join(base, "storage");
  await fs.mkdir(root);
  vi.stubEnv("STORAGE_DIR", root);
});

afterEach(async () => {
  vi.unstubAllEnvs();
  await fs.rm(base, { recursive: true, force: true });
});

describe("readStorageFile", () => {
  it("membaca berkas yang disimpan di dalam storage", async () => {
    const saved = await saveStorageFile("bukti", "surat tugas.txt", Buffer.from("isi"));
    const content = await readStorageFile(saved);
    expect(content.toString()).toBe("isi");
  });

  it("menolak path traversal", async () => {
    await fs.writeFile(path.join(base, "rahasia.txt"), "rahasia");
    await expect(readStorageFile("../rahasia.txt")).rejects.toThrow(/ditolak/);
    await expect(readStorageFile("bukti/../../rahasia.txt")).rejects.toThrow(
      /ditolak/,
    );
  });

  it("menolak folder bersaudara yang berawalan sama dengan root", async () => {
    const sibling = path.join(base, "storage-lain");
    await fs.mkdir(sibling);
    await fs.writeFile(path.join(sibling, "data.txt"), "bocor");

    await expect(readStorageFile("../storage-lain/data.txt")).rejects.toThrow(
      /ditolak/,
    );
  });

  it("menolak path absolut ke luar root", async () => {
    const outside = path.join(base, "luar.txt");
    await fs.writeFile(outside, "luar");
    await expect(readStorageFile(outside)).rejects.toThrow(/ditolak/);
  });
});
