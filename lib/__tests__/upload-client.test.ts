import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const upload = vi.fn();
vi.mock("@vercel/blob/client", () => ({
  upload: (...args: unknown[]) => upload(...args),
}));

import { MAX_UPLOAD_SIZE_BYTES } from "@/lib/constants";
import { uploadStoredFile } from "@/lib/upload-client";

const pdf = (name = "surat.pdf", size = 5) =>
  new File([new Uint8Array(size)], name, { type: "application/pdf" });

beforeEach(() => {
  upload.mockReset();
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("uploadStoredFile — validasi awal", () => {
  it("menolak berkas kosong, terlalu besar, dan tipe tidak diizinkan", async () => {
    await expect(uploadStoredFile(pdf("a.pdf", 0), "bukti")).rejects.toThrow(/kosong/);

    const besar = pdf("a.pdf", 1);
    Object.defineProperty(besar, "size", { value: MAX_UPLOAD_SIZE_BYTES + 1 });
    await expect(uploadStoredFile(besar, "bukti")).rejects.toThrow(/10 MB/);

    await expect(uploadStoredFile(pdf("a.exe"), "bukti")).rejects.toThrow(
      /tidak diizinkan/,
    );
    await expect(uploadStoredFile(pdf("a.pdf"), "dokumentasi")).rejects.toThrow(
      /tidak diizinkan/,
    );
  });
});

describe("uploadStoredFile — driver blob", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_STORAGE_DRIVER", "blob");
  });

  it("mengunggah langsung ke Blob dan mengembalikan jalur dari Blob", async () => {
    upload.mockResolvedValue({ pathname: "bukti/1700-surat-Ab1.pdf" });

    const result = await uploadStoredFile(pdf("surat tugas.pdf", 7), "bukti");

    expect(result).toEqual({
      path: "bukti/1700-surat-Ab1.pdf",
      fileName: "surat tugas.pdf",
      size: 7,
    });
    const [pathname, , options] = upload.mock.calls[0];
    expect(pathname).toMatch(/^bukti\/\d+-surat_tugas\.pdf$/);
    expect(options).toMatchObject({
      access: "private",
      handleUploadUrl: "/api/storage/blob-upload",
    });
  });

  it("memakai pesan kegagalan bawaan bila Blob menolak", async () => {
    upload.mockRejectedValue(new Error("Failed to retrieve the client token"));

    await expect(
      uploadStoredFile(pdf(), "bukti", "Gagal mengunggah berkas bukti."),
    ).rejects.toThrow("Gagal mengunggah berkas bukti.");
  });
});

describe("uploadStoredFile — driver disk", () => {
  it("memakai POST /api/storage/upload dan tidak menyentuh Blob", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: { path: "bukti/1-a.pdf", fileName: "a.pdf", size: 5 } }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await uploadStoredFile(pdf("a.pdf"), "bukti");

    expect(result.path).toBe("bukti/1-a.pdf");
    expect(upload).not.toHaveBeenCalled();
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/storage/upload");
    expect((init.body as FormData).get("folder")).toBe("bukti");
  });

  it("meneruskan pesan error dari server", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ error: { message: "Tipe berkas tidak diizinkan." } }),
      }),
    );

    await expect(uploadStoredFile(pdf(), "bukti")).rejects.toThrow(
      "Tipe berkas tidak diizinkan.",
    );
  });
});
