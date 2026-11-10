import { describe, expect, it } from "vitest";
import { z } from "zod";
import {
  assertSafeInput,
  escapeHtml,
  hasPathTraversalPattern,
  hasSqlInjectionPattern,
  hasXssPattern,
  protectPayload,
  safeString,
  sanitizeFormPayload,
  sanitizeObject,
  sanitizeString,
  stripHtml,
  validateInputSafety,
} from "../security";

describe("Security Sanitizer & Detector Helpers", () => {
  describe("SQL Injection Detection", () => {
    it("mendeteksi pola tautologi SQL injection", () => {
      expect(hasSqlInjectionPattern("' OR '1'='1")).toBe(true);
      expect(hasSqlInjectionPattern('" OR 1=1')).toBe(true);
      expect(hasSqlInjectionPattern("' OR ''='")).toBe(true);
    });

    it("mendeteksi UNION SELECT injection", () => {
      expect(hasSqlInjectionPattern("UNION SELECT * FROM users")).toBe(true);
      expect(hasSqlInjectionPattern("1 union all select null, null")).toBe(true);
    });

    it("mendeteksi comment injection setelah pemutusan kutip", () => {
      expect(hasSqlInjectionPattern("admin'--")).toBe(true);
      expect(hasSqlInjectionPattern("test'/*")).toBe(true);
      expect(hasSqlInjectionPattern("user' #")).toBe(true);
    });

    it("mendeteksi query chaining berbahaya", () => {
      expect(hasSqlInjectionPattern("; DROP TABLE master_target")).toBe(true);
      expect(hasSqlInjectionPattern("1; DELETE FROM users")).toBe(true);
      expect(hasSqlInjectionPattern("x; EXEC xp_cmdshell")).toBe(true);
    });

    it("mendeteksi blind & time-based SQL injection", () => {
      expect(hasSqlInjectionPattern("WAITFOR DELAY '0:0:5'")).toBe(true);
      expect(hasSqlInjectionPattern("AND SLEEP(5)")).toBe(true);
      expect(hasSqlInjectionPattern("BENCHMARK(1000000,MD5(1))")).toBe(true);
    });

    it("tidak salah mendeteksi teks normal sehari-hari (false positive prevention)", () => {
      expect(hasSqlInjectionPattern("Nama Dosen: O'Connor")).toBe(false);
      expect(hasSqlInjectionPattern("Laporan Evaluasi - Semester Ganjil 2026")).toBe(false);
      expect(hasSqlInjectionPattern("SELECT item yang sesuai target")).toBe(false);
      expect(hasSqlInjectionPattern("Target: 10 publikasi atau buku")).toBe(false);
      expect(hasSqlInjectionPattern("Program Studi Pendidikan Ilmu Komputer")).toBe(false);
    });
  });

  describe("XSS Detection & HTML Sanitization", () => {
    it("mendeteksi tag script dan skrip berbahaya", () => {
      expect(hasXssPattern("<script>alert(1)</script>")).toBe(true);
      expect(hasXssPattern("<script src='evil.js'></script>")).toBe(true);
      expect(hasXssPattern("<SCRIPT>malicious()</SCRIPT>")).toBe(true);
    });

    it("mendeteksi inline event handler", () => {
      expect(hasXssPattern("<img src=x onerror=alert(1)>")).toBe(true);
      expect(hasXssPattern("<div onload=evil()>")).toBe(true);
      expect(hasXssPattern("onclick=hack()")).toBe(true);
    });

    it("mendeteksi pseudo-protocol javascript:", () => {
      expect(hasXssPattern("javascript:alert(1)")).toBe(true);
      expect(hasXssPattern("JAVASCRIPT:void(0)")).toBe(true);
    });

    it("membersihkan tag HTML dengan stripHtml", () => {
      expect(stripHtml("<p>Halo <b>Dunia</b></p>")).toBe("Halo Dunia");
      expect(stripHtml("<script>test</script>")).toBe("test");
    });

    it("meng-escape karakter khusus dengan escapeHtml", () => {
      expect(escapeHtml("<script> & 'quotes' \"double\"")).toBe(
        "&lt;script&gt; &amp; &#39;quotes&#39; &quot;double&quot;",
      );
    });
  });

  describe("Path Traversal & Null Byte Protection", () => {
    it("mendeteksi pola path traversal", () => {
      expect(hasPathTraversalPattern("../../etc/passwd")).toBe(true);
      expect(hasPathTraversalPattern("..\\..\\windows\\system32")).toBe(true);
      expect(hasPathTraversalPattern("documents/2026/target.pdf")).toBe(false);
    });

    it("membersihkan null byte dari teks", () => {
      expect(sanitizeString("file\0.pdf")).toBe("file.pdf");
      expect(sanitizeString("payload%00test")).toBe("payloadtest");
    });
  });

  describe("Input Safety Validation & Assertion", () => {
    it("memvalidasi input aman dan mengembalikan cleaned value", () => {
      const res = validateInputSafety("  Rapat Kurikulum 2026  ", "Judul");
      expect(res.isValid).toBe(true);
      expect(res.cleanedValue).toBe("Rapat Kurikulum 2026");
      expect(res.error).toBeUndefined();
    });

    it("menolak input yang mengandung SQL injection dengan pesan yang ramah", () => {
      const res = validateInputSafety("admin' OR '1'='1", "Username");
      expect(res.isValid).toBe(false);
      expect(res.error).toContain("SQL Injection");
    });

    it("menolak input yang mengandung XSS", () => {
      const res = validateInputSafety("<script>alert('xss')</script>", "Komentar");
      expect(res.isValid).toBe(false);
      expect(res.error).toContain("tag atau skrip");
    });

    it("assertSafeInput melempar error saat input berbahaya", () => {
      expect(() => {
        assertSafeInput("'; DROP TABLE dosen; --", "Kode");
      }).toThrowError(/SQL Injection/);

      expect(assertSafeInput("Kode T-01", "Kode")).toBe("Kode T-01");
    });
  });

  describe("Recursive Object & Form Payload Sanitizer (FE & BE)", () => {
    it("membersihkan seluruh properti string dalam objek dan array secara rekursif", () => {
      const raw = {
        title: "  <b>Rapat Evaluasi</b> \0 ",
        count: 5,
        isActive: true,
        tags: ["  Tag 1  ", "<script>alert(1)</script>Safe Text"],
        meta: {
          note: "  Catatan rapat penting  ",
        },
      };

      const clean = sanitizeObject(raw);
      expect(clean.title).toBe("Rapat Evaluasi");
      expect(clean.count).toBe(5);
      expect(clean.isActive).toBe(true);
      expect(clean.tags).toEqual(["Tag 1", "alert(1)Safe Text"]);
      expect(clean.meta.note).toBe("Catatan rapat penting");
    });

    it("melindungi dari prototype pollution", () => {
      const maliciousJson = JSON.parse(
        '{"title": "Valid", "__proto__": {"polluted": true}, "constructor": {"evil": true}}',
      );

      const sanitized = sanitizeObject(maliciousJson);
      expect(sanitized.title).toBe("Valid");
      expect((sanitized as Record<string, unknown>).__proto__).not.toEqual({ polluted: true });
      expect(Object.prototype.hasOwnProperty.call(sanitized, "constructor")).toBe(false);
      expect((sanitized as Record<string, unknown>).constructor).not.toEqual({ evil: true });
    });

    it("sanitizeFormPayload dan protectPayload bekerja konsisten di FE dan BE", () => {
      const fePayload = sanitizeFormPayload({
        kode: " T-01 ",
        nama: "<b>Publikasi</b>",
      });
      expect(fePayload.kode).toBe("T-01");
      expect(fePayload.nama).toBe("Publikasi");

      const bePayload = protectPayload({
        search: "  artikel ilmiah  \0",
      });
      expect(bePayload.search).toBe("artikel ilmiah");
    });
  });

  describe("Zod Integration: safeString()", () => {
    const testSchema = z.object({
      kode: safeString({ fieldName: "Kode Target", min: 2 }),
      keterangan: safeString({ fieldName: "Keterangan" }).optional(),
    });

    it("meloloskan string normal dan membersihkannya otomatis", () => {
      const result = testSchema.safeParse({
        kode: "  T-01  ",
        keterangan: "<b>Catatan</b> awal",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.kode).toBe("T-01");
        expect(result.data.keterangan).toBe("Catatan awal");
      }
    });

    it("menggagalkan validasi Zod jika terdeteksi SQL injection", () => {
      const result = testSchema.safeParse({
        kode: "' OR '1'='1",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("Kode Target");
        expect(result.error.issues[0].message).toContain("pola kueri");
      }
    });

    it("menggagalkan validasi Zod jika terdeteksi XSS script", () => {
      const result = testSchema.safeParse({
        kode: "<script>alert(1)</script>",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("tag atau skrip");
      }
    });
  });
});
