// @vitest-environment node
import { describe, expect, it } from "vitest";
import {
  allowedContentTypes,
  buildUploadPathname,
  checkUploadPathname,
  parseUploadPathname,
  sanitizeUploadFileName,
} from "@/lib/upload-rules";

describe("sanitizeUploadFileName dan buildUploadPathname", () => {
  it("mengganti karakter berbahaya dan membuang jalur direktori", () => {
    expect(sanitizeUploadFileName("Surat Tugas (final).pdf")).toBe(
      "Surat_Tugas__final_.pdf",
    );
    expect(sanitizeUploadFileName("..\\..\\rahasia.pdf")).toBe("rahasia.pdf");
    expect(sanitizeUploadFileName("a/b/c.png")).toBe("c.png");
  });

  it("membentuk jalur folder/waktu-nama", () => {
    expect(buildUploadPathname("bukti", "surat.pdf", 1700000000000)).toBe(
      "bukti/1700000000000-surat.pdf",
    );
  });
});

describe("parseUploadPathname", () => {
  it("menerima jalur sah, termasuk akhiran acak dari Blob", () => {
    expect(parseUploadPathname("bukti/1700-surat-AbC123.pdf")).toEqual({
      folder: "bukti",
      fileName: "1700-surat-AbC123.pdf",
    });
  });

  it.each([
    "../.env",
    "bukti/../rahasia.pdf",
    "/bukti/a.pdf",
    "bukti/sub/a.pdf",
    "rahasia/a.pdf",
    "bukti/",
    "bukti/a b.pdf",
    "bukti/a..pdf",
  ])("menolak jalur tidak sah: %s", (pathname) => {
    expect(parseUploadPathname(pathname)).toBeNull();
  });
});

describe("checkUploadPathname", () => {
  it("menerima unggahan sah", () => {
    expect(checkUploadPathname("bukti/1-a.pdf", "Dosen")).toEqual({
      ok: true,
      folder: "bukti",
    });
    expect(checkUploadPathname("dokumentasi/1-a.png", "Dosen").ok).toBe(true);
  });

  it("menolak jalur rusak dengan 400", () => {
    expect(checkUploadPathname("../x.pdf", "Admin")).toMatchObject({
      ok: false,
      status: 400,
    });
  });

  it("menolak Dosen mengunggah ke folder undangan dengan 403", () => {
    expect(checkUploadPathname("undangan/1-a.pdf", "Dosen")).toMatchObject({
      ok: false,
      status: 403,
    });
    expect(checkUploadPathname("undangan/1-a.pdf", "Kaprodi").ok).toBe(true);
  });

  it("menolak tipe berkas yang tidak diizinkan dengan 400", () => {
    expect(checkUploadPathname("bukti/1-a.exe", "Dosen")).toMatchObject({
      ok: false,
      status: 400,
    });
    expect(checkUploadPathname("dokumentasi/1-a.pdf", "Dosen")).toMatchObject({
      ok: false,
      status: 400,
    });
  });
});

describe("allowedContentTypes", () => {
  it("memetakan ekstensi ke tipe konten tanpa duplikat", () => {
    const foto = allowedContentTypes("dokumentasi");
    expect(foto).toEqual(["image/png", "image/jpeg", "image/webp"]);
    expect(allowedContentTypes("lampiran")).toContain(
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    );
  });
});
