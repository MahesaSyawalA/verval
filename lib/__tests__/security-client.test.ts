import { beforeEach, describe, expect, it, vi } from "vitest";
import { alertToast } from "@/components/ui/alert";
import { checkInputSecurity, validateAndSanitizeForm } from "../security-client";

describe("Security Client Helpers & Toast Warning Integration", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(alertToast, "warning").mockImplementation(() => "" as never);
  });

  describe("checkInputSecurity", () => {
    it("mengembalikan true untuk input normal dan tidak memanggil toast", () => {
      const isSafe = checkInputSecurity({
        nama: "Dr. Iqbal Al-Farisi, M.Kom.",
        judul: "Rapat Koordinasi Kurikulum OBE 2026",
        catatan: "Harap dilengkapi sebelum hari Jumat.",
      });

      expect(isSafe).toBe(true);
      expect(alertToast.warning).not.toHaveBeenCalled();
    });

    it("mendeteksi SQL injection, memanggil alertToast.warning, dan mengembalikan false", () => {
      const isSafe = checkInputSecurity({
        username: "admin' OR '1'='1",
        password: "secret",
      });

      expect(isSafe).toBe(false);
      expect(alertToast.warning).toHaveBeenCalledTimes(1);
      expect(alertToast.warning).toHaveBeenCalledWith(
        "Peringatan Keamanan Input",
        expect.objectContaining({
          description: expect.stringContaining("SQL Injection"),
        })
      );
    });

    it("mendeteksi XSS script tag dan memicu peringatan toast", () => {
      const isSafe = checkInputSecurity({
        keterangan: "<script>alert('xss')</script>",
      });

      expect(isSafe).toBe(false);
      expect(alertToast.warning).toHaveBeenCalledTimes(1);
      expect(alertToast.warning).toHaveBeenCalledWith(
        "Peringatan Keamanan Input",
        expect.objectContaining({
          description: expect.stringContaining("XSS"),
        })
      );
    });

    it("mendeteksi event handler onload/onerror berbahaya", () => {
      const isSafe = checkInputSecurity({
        foto: [{ caption: '<img src="x" onerror="alert(1)">' }],
      });

      expect(isSafe).toBe(false);
      expect(alertToast.warning).toHaveBeenCalledTimes(1);
      expect(alertToast.warning).toHaveBeenCalledWith(
        "Peringatan Keamanan Input",
        expect.objectContaining({
          description: expect.stringContaining("XSS"),
        })
      );
    });

    it("mendeteksi path traversal dalam payload", () => {
      const isSafe = checkInputSecurity({
        filePath: "../../etc/passwd",
      });

      expect(isSafe).toBe(false);
      expect(alertToast.warning).toHaveBeenCalledTimes(1);
      expect(alertToast.warning).toHaveBeenCalledWith(
        "Peringatan Keamanan Input",
        expect.objectContaining({
          description: expect.stringContaining("path traversal"),
        })
      );
    });

    it("mendeteksi null byte injection", () => {
      const isSafe = checkInputSecurity({
        kode: "ABCD\0EFGH",
      });

      expect(isSafe).toBe(false);
      expect(alertToast.warning).toHaveBeenCalledTimes(1);
      expect(alertToast.warning).toHaveBeenCalledWith(
        "Peringatan Keamanan Input",
        expect.objectContaining({
          description: expect.stringContaining("null byte"),
        })
      );
    });

    it("menerima opsi kustom title dan customMessage", () => {
      const isSafe = checkInputSecurity(
        { input: "1; DROP TABLE users" },
        {
          title: "Akses Ditolak",
          customMessage: "Gagal menyimpan formulir.",
        }
      );

      expect(isSafe).toBe(false);
      expect(alertToast.warning).toHaveBeenCalledWith(
        "Akses Ditolak",
        expect.objectContaining({
          description: expect.stringContaining("Gagal menyimpan formulir."),
        })
      );
    });
  });

  describe("validateAndSanitizeForm", () => {
    it("mengembalikan null jika form terindikasi serangan berbahaya", () => {
      const formData = {
        judulRapat: "Rapat Anggaran",
        deskripsi: "UNION SELECT * FROM accounts",
      };

      const result = validateAndSanitizeForm(formData);

      expect(result).toBeNull();
      expect(alertToast.warning).toHaveBeenCalledTimes(1);
    });

    it("membersihkan tag HTML biasa jika aman dan mengembalikan data tersanitasi", () => {
      const formData = {
        namaTarget: " Publikasi Jurnal Internasional <b>Scopus</b> ",
        kuantitas: 5,
        catatan: "Dosen <i>wajib</i> submit bukti.",
      };

      const result = validateAndSanitizeForm(formData);

      expect(result).not.toBeNull();
      expect(result).toEqual({
        namaTarget: "Publikasi Jurnal Internasional Scopus",
        kuantitas: 5,
        catatan: "Dosen wajib submit bukti.",
      });
      expect(alertToast.warning).not.toHaveBeenCalled();
    });

    it("memproses nested array submissions pada bukti kegiatan", () => {
      const submissions = [
        {
          formatBuktiId: "fmt-1",
          urutanSubmisi: 1,
          nilaiIsian: " <b>Laporan Akhir Penelitian</b> ",
        },
        {
          formatBuktiId: "fmt-2",
          urutanSubmisi: 1,
          nilaiIsian: "https://example.com/paper.pdf",
        },
      ];

      const result = validateAndSanitizeForm(submissions);

      expect(result).not.toBeNull();
      expect(result).toEqual([
        {
          formatBuktiId: "fmt-1",
          urutanSubmisi: 1,
          nilaiIsian: "Laporan Akhir Penelitian",
        },
        {
          formatBuktiId: "fmt-2",
          urutanSubmisi: 1,
          nilaiIsian: "https://example.com/paper.pdf",
        },
      ]);
    });
  });
});
