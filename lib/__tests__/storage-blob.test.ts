// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const put = vi.fn();
const get = vi.fn();
vi.mock("@vercel/blob", () => ({ put: (...a: unknown[]) => put(...a), get: (...a: unknown[]) => get(...a) }));

import {
  getStorageDriver,
  readStorageFile,
  saveStorageFile,
} from "@/lib/storage";

beforeEach(() => {
  put.mockReset();
  get.mockReset();
});

afterEach(() => {
  vi.unstubAllEnvs();
});

function streamOf(text: string): ReadableStream<Uint8Array> {
  return new Response(text).body as ReadableStream<Uint8Array>;
}

describe("getStorageDriver", () => {
  it("bawaan disk, blob hanya bila diminta eksplisit", () => {
    expect(getStorageDriver()).toBe("disk");
    vi.stubEnv("NEXT_PUBLIC_STORAGE_DRIVER", "blob");
    expect(getStorageDriver()).toBe("blob");
    vi.stubEnv("NEXT_PUBLIC_STORAGE_DRIVER", "s3");
    expect(getStorageDriver()).toBe("disk");
  });
});

describe("driver blob", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_STORAGE_DRIVER", "blob");
  });

  it("menyimpan berkas sebagai blob privat dan mengembalikan jalur dari Blob", async () => {
    put.mockResolvedValue({ pathname: "bukti/1700-surat-Zx9.pdf" });

    const result = await saveStorageFile("bukti", "Surat Tugas.pdf", Buffer.from("isi"));

    expect(result).toBe("bukti/1700-surat-Zx9.pdf");
    const [pathname, body, options] = put.mock.calls[0];
    expect(pathname).toMatch(/^bukti\/\d+-Surat_Tugas\.pdf$/);
    expect(Buffer.isBuffer(body)).toBe(true);
    expect(options).toMatchObject({ access: "private", addRandomSuffix: true });
  });

  it("membaca berkas privat menjadi Buffer", async () => {
    get.mockResolvedValue({ statusCode: 200, stream: streamOf("halo dunia") });

    const content = await readStorageFile("bukti/1700-surat.pdf");

    expect(content.toString()).toBe("halo dunia");
    expect(get).toHaveBeenCalledWith("bukti/1700-surat.pdf", { access: "private" });
  });

  it("menolak jalur tidak sah tanpa menghubungi Blob", async () => {
    await expect(readStorageFile("../.env")).rejects.toThrow(/ditolak/);
    await expect(readStorageFile("rahasia/x.pdf")).rejects.toThrow(/ditolak/);
    expect(get).not.toHaveBeenCalled();
  });

  it("melempar error bila berkas tidak ada atau bukan 200", async () => {
    get.mockResolvedValueOnce(null);
    await expect(readStorageFile("bukti/1-a.pdf")).rejects.toThrow(/tidak ditemukan/);

    get.mockResolvedValueOnce({ statusCode: 304, stream: null });
    await expect(readStorageFile("bukti/1-a.pdf")).rejects.toThrow(/tidak ditemukan/);
  });
});
