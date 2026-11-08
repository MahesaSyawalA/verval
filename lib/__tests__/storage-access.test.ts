// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import {
  canReadStoredFile,
  canUploadToFolder,
  isAllowedUpload,
  isUploadFolder,
} from "@/lib/storage-access";

function fakeDb(hit: Partial<Record<"isian_bukti" | "rapat" | "dokumentasi" | "notulensi", boolean>>) {
  const finder = (found?: boolean) => ({
    findFirst: vi.fn().mockResolvedValue(found ? { id: "x" } : null),
  });
  return {
    isian_bukti: finder(hit.isian_bukti),
    rapat: finder(hit.rapat),
    dokumentasi: finder(hit.dokumentasi),
    notulensi: finder(hit.notulensi),
  } as unknown as Parameters<typeof canReadStoredFile>[2];
}

const DOSEN = { id: "dosen-1", role: "Dosen" as const };

describe("canReadStoredFile", () => {
  it("Kaprodi dan Admin boleh membaca tanpa cek data", async () => {
    const db = fakeDb({});
    expect(await canReadStoredFile({ id: "k", role: "Kaprodi" }, "bukti/a.pdf", db)).toBe(true);
    expect(await canReadStoredFile({ id: "a", role: "Admin" }, "bukti/a.pdf", db)).toBe(true);
  });

  it("dosen boleh membaca bukti miliknya", async () => {
    expect(await canReadStoredFile(DOSEN, "bukti/1-a.pdf", fakeDb({ isian_bukti: true }))).toBe(true);
  });

  it("dosen ditolak membaca bukti dosen lain", async () => {
    expect(await canReadStoredFile(DOSEN, "bukti/1-a.pdf", fakeDb({}))).toBe(false);
  });

  it.each([
    ["undangan/u.pdf", "rapat"],
    ["dokumentasi/f.png", "dokumentasi"],
    ["lampiran/l.pptx", "notulensi"],
  ] as const)("dosen peserta boleh membaca %s", async (path, table) => {
    expect(await canReadStoredFile(DOSEN, path, fakeDb({ [table]: true }))).toBe(true);
  });

  it("dosen ditolak untuk berkas rapat yang bukan miliknya", async () => {
    expect(await canReadStoredFile(DOSEN, "dokumentasi/f.png", fakeDb({}))).toBe(false);
  });

  it("dosen ditolak untuk folder tak dikenal dan path traversal", async () => {
    const db = fakeDb({ isian_bukti: true, rapat: true, dokumentasi: true, notulensi: true });
    expect(await canReadStoredFile(DOSEN, "rahasia/x.pdf", db)).toBe(false);
    expect(await canReadStoredFile(DOSEN, "../.env", db)).toBe(false);
  });
});

describe("aturan upload", () => {
  it("mengenali folder yang valid", () => {
    expect(isUploadFolder("bukti")).toBe(true);
    expect(isUploadFolder("../x")).toBe(false);
    expect(isUploadFolder(null)).toBe(false);
  });

  it("membatasi ekstensi per folder", () => {
    expect(isAllowedUpload("dokumentasi", "foto.JPG")).toBe(true);
    expect(isAllowedUpload("dokumentasi", "dokumen.pdf")).toBe(false);
    expect(isAllowedUpload("lampiran", "slide.pptx")).toBe(true);
    expect(isAllowedUpload("bukti", "malware.exe")).toBe(false);
    expect(isAllowedUpload("bukti", "page.html")).toBe(false);
    expect(isAllowedUpload("bukti", "tanpa-ekstensi")).toBe(false);
  });

  it("undangan hanya untuk Kaprodi dan Admin", () => {
    expect(canUploadToFolder("undangan", "Dosen")).toBe(false);
    expect(canUploadToFolder("undangan", "Kaprodi")).toBe(true);
    expect(canUploadToFolder("undangan", "Admin")).toBe(true);
    expect(canUploadToFolder("bukti", "Dosen")).toBe(true);
  });
});
