import { z } from "zod";

/**
 * Pilihan opsi konfigurasi sanitasi input.
 */
export interface SanitizeOptions {
  /**
   * Menghapus seluruh tag HTML dari teks (default: true).
   */
  stripHtmlTags?: boolean;
  /**
   * Mengizinkan baris baru (\n, \r) dan tab (\t) - berguna untuk textarea (default: true).
   */
  allowMultiline?: boolean;
  /**
   * Meng-encode karakter HTML khusus (&, <, >, ", ') menjadi entitas aman (default: false).
   */
  escapeSpecialChars?: boolean;
  /**
   * Trim spasi di awal dan akhir teks (default: true).
   */
  trim?: boolean;
}

/**
 * Daftar pola regex untuk mendeteksi indikasi SQL Injection berbahaya.
 */
const SQL_INJECTION_PATTERNS = [
  // UNION SELECT injection
  /\bUNION\s+(?:ALL\s+)?SELECT\b/i,
  // Tautologi boolean injection (mis: ' OR '1'='1, " OR 1=1 --, ' OR ''=')
  /(?:'|"|`)\s*(?:OR|AND)\s+[\w\s'"`()]+=\s*[\w\s'"`()]+/i,
  // Query chaining berbahaya (; DROP TABLE, ; DELETE FROM, dll)
  /;\s*(?:SELECT|INSERT|UPDATE|DELETE|DROP|ALTER|TRUNCATE|EXEC|EXECUTE|CREATE|GRANT|REVOKE)\b/i,
  // Comment injection yang diawali pemutusan string (mis: admin'--, '/*)
  /(?:'|"|`)\s*(?:--|#|\/\*)/,
  // Time-based blind SQL injection
  /\b(?:WAITFOR\s+DELAY|SLEEP\s*\(|BENCHMARK\s*\(|PG_SLEEP\s*\()/i,
  // System commands & stored procedures execution
  /\b(?:XP_CMDSHELL|SP_EXECUTESQL|SYS\.XP_)\b/i,
  // Outfile / file manipulation
  /\b(?:LOAD_FILE|INTO\s+(?:OUTFILE|DUMPFILE))\b/i,
];

/**
 * Daftar pola regex untuk mendeteksi Cross-Site Scripting (XSS) dan tag eksekusi berbahaya.
 */
const XSS_PATTERNS = [
  // Tag script lengkap maupun pembuka
  /<\s*script\b[^>]*>/i,
  // Event handler inline HTML (onload=, onerror=, onclick=, dll)
  /\bon(?:load|error|click|focus|blur|change|submit|mouseover|mouseenter|mouseleave|keydown|keyup)\s*=/i,
  // Pseudo-protocol javascript: atau vbscript:
  /\b(?:javascript|vbscript)\s*:/i,
  // Data URI text/html
  /\bdata\s*:\s*text\/html/i,
  // Tag embed berbahaya
  /<\s*(?:iframe|object|embed|applet|meta|link|base)\b/i,
];

/**
 * Pola path traversal dan null-byte injection.
 */
const PATH_TRAVERSAL_PATTERN = /(?:\.\.[/\\]|[/\\]\.\.)/;
const NULL_BYTE_PATTERN = /\0|\u0000|%00/g;

/**
 * Cek apakah string mengandung indikasi payload SQL Injection.
 */
export function hasSqlInjectionPattern(value: string): boolean {
  if (!value || typeof value !== "string") return false;
  return SQL_INJECTION_PATTERNS.some((pattern) => pattern.test(value));
}

/**
 * Cek apakah string mengandung indikasi payload XSS / skrip berbahaya.
 */
export function hasXssPattern(value: string): boolean {
  if (!value || typeof value !== "string") return false;
  return XSS_PATTERNS.some((pattern) => pattern.test(value));
}

/**
 * Cek apakah string mengandung percobaan path traversal.
 */
export function hasPathTraversalPattern(value: string): boolean {
  if (!value || typeof value !== "string") return false;
  return PATH_TRAVERSAL_PATTERN.test(value);
}

/**
 * Meng-encode karakter HTML menjadi entitas aman.
 */
export function escapeHtml(value: string): string {
  if (!value || typeof value !== "string") return "";
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Menghapus seluruh tag HTML dari teks.
 */
export function stripHtml(value: string): string {
  if (!value || typeof value !== "string") return "";
  return value.replace(/<[^>]*>/g, "");
}

/**
 * Sanitasi string tunggal untuk membersihkan null byte, karakter kontrol berbahaya,
 * dan tag HTML yang tidak diinginkan. Aman digunakan di FE maupun BE.
 */
export function sanitizeString(
  value: unknown,
  options: SanitizeOptions = {},
): string {
  if (value === null || value === undefined) return "";
  if (typeof value !== "string") return String(value);

  const {
    stripHtmlTags = true,
    allowMultiline = true,
    escapeSpecialChars = false,
    trim = true,
  } = options;

  // 1. Hapus null bytes
  let cleaned = value.replace(NULL_BYTE_PATTERN, "");

  // 2. Bersihkan karakter kontrol tak terlihat (ASCII 0-31 & 127)
  if (allowMultiline) {
    // Pertahankan \n (10), \r (13), \t (9)
    cleaned = cleaned.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");
  } else {
    cleaned = cleaned.replace(/[\x00-\x1F\x7F]/g, " ");
  }

  // 3. Strip HTML jika diaktifkan
  if (stripHtmlTags) {
    cleaned = stripHtml(cleaned);
  }

  // 4. Escape karakter khusus jika diminta
  if (escapeSpecialChars) {
    cleaned = escapeHtml(cleaned);
  }

  // 5. Trim spasi jika diaktifkan
  if (trim) {
    cleaned = cleaned.trim();
  }

  return cleaned;
}

/**
 * Hasil verifikasi keamanan input.
 */
export interface ValidationSafetyResult {
  isValid: boolean;
  error?: string;
  cleanedValue: string;
}

/**
 * Memvalidasi apakah suatu input string aman sebelum diproses atau disimpan ke database.
 * Mengembalikan status validitas beserta pesan error ramah pengguna dalam Bahasa Indonesia.
 */
export function validateInputSafety(
  value: unknown,
  fieldName: string = "Input",
  options: SanitizeOptions = {},
): ValidationSafetyResult {
  if (value === null || value === undefined) {
    return { isValid: true, cleanedValue: "" };
  }

  const str = String(value);

  // Cek null bytes
  if (NULL_BYTE_PATTERN.test(str)) {
    return {
      isValid: false,
      error: `${fieldName} mengandung karakter ilegal (null byte).`,
      cleanedValue: sanitizeString(str, options),
    };
  }

  // Cek SQL Injection
  if (hasSqlInjectionPattern(str)) {
    return {
      isValid: false,
      error: `${fieldName} mengandung karakter atau pola kueri berbahaya (SQL Injection).`,
      cleanedValue: sanitizeString(str, options),
    };
  }

  // Cek XSS
  if (hasXssPattern(str)) {
    return {
      isValid: false,
      error: `${fieldName} mengandung tag atau skrip yang tidak diizinkan.`,
      cleanedValue: sanitizeString(str, options),
    };
  }

  // Cek Path Traversal
  if (hasPathTraversalPattern(str)) {
    return {
      isValid: false,
      error: `${fieldName} mengandung pola direktori ilegal.`,
      cleanedValue: sanitizeString(str, options),
    };
  }

  return {
    isValid: true,
    cleanedValue: sanitizeString(str, options),
  };
}

/**
 * Memastikan input aman. Melempar Error jika input terdeteksi berbahaya.
 */
export function assertSafeInput(
  value: unknown,
  fieldName: string = "Input",
  options: SanitizeOptions = {},
): string {
  const result = validateInputSafety(value, fieldName, options);
  if (!result.isValid) {
    throw new Error(result.error);
  }
  return result.cleanedValue;
}

/**
 * Memeriksa seluruh struktur payload (objek, array, atau string) secara rekursif
 * dan mengembalikan deskripsi ancaman jika ditemukan pola serangan mencurigakan (SQLi, XSS, Path Traversal, Null Byte).
 */
export function inspectPayloadThreats(payload: unknown): string | null {
  if (payload === null || payload === undefined) {
    return null;
  }

  if (typeof payload === "string") {
    if (NULL_BYTE_PATTERN.test(payload)) {
      return "Terdeteksi karakter ilegal (null byte).";
    }
    if (hasSqlInjectionPattern(payload)) {
      return "Terdeteksi pola kueri mencurigakan (indikasi SQL Injection).";
    }
    if (hasXssPattern(payload)) {
      return "Terdeteksi tag atau skrip eksekusi yang tidak diizinkan (indikasi XSS).";
    }
    if (hasPathTraversalPattern(payload)) {
      return "Terdeteksi karakter manipulasi path direktori (path traversal).";
    }
    return null;
  }

  if (Array.isArray(payload)) {
    for (const item of payload) {
      const threat = inspectPayloadThreats(item);
      if (threat) return threat;
    }
    return null;
  }

  if (typeof payload === "object") {
    for (const [key, val] of Object.entries(payload)) {
      if (key === "__proto__" || key === "constructor" || key === "prototype") {
        return "Terdeteksi manipulasi objek sistem (prototype pollution).";
      }
      const threat = inspectPayloadThreats(val);
      if (threat) return threat;
    }
    return null;
  }

  return null;
}

/**
 * Cek cepat apakah payload mengandung konten tidak aman.
 */
export function hasInsecureContent(payload: unknown): boolean {
  return inspectPayloadThreats(payload) !== null;
}
export function sanitizeObject<T>(input: T, options: SanitizeOptions = {}): T {
  if (input === null || input === undefined) {
    return input;
  }

  if (typeof input === "string") {
    return sanitizeString(input, options) as unknown as T;
  }

  if (Array.isArray(input)) {
    return input.map((item) => sanitizeObject(item, options)) as unknown as T;
  }

  if (typeof input === "object") {
    const result: Record<string, unknown> = {};

    for (const [key, val] of Object.entries(input)) {
      // Cegah prototype pollution
      if (key === "__proto__" || key === "constructor" || key === "prototype") {
        continue;
      }
      result[key] = sanitizeObject(val, options);
    }

    return result as T;
  }

  return input;
}

/**
 * Helper pembersih payload formulir di sisi Front-End (FE) sebelum dikirimkan ke endpoint.
 */
export function sanitizeFormPayload<T>(formData: T): T {
  return sanitizeObject(formData, {
    stripHtmlTags: true,
    allowMultiline: true,
    trim: true,
  });
}

/**
 * Helper pelindung payload di sisi Back-End (BE) sebelum validasi schema atau query DB.
 * Membersihkan seluruh string dalam body dan memvalidasi keamanannya.
 */
export function protectPayload<T>(body: T): T {
  const sanitized = sanitizeObject(body, {
    stripHtmlTags: true,
    allowMultiline: true,
    trim: true,
  });

  return sanitized;
}

/**
 * Opsi untuk Zod helper `safeString`.
 */
export interface SafeStringOptions extends SanitizeOptions {
  fieldName?: string;
  min?: number;
  max?: number;
  minMessage?: string;
  maxMessage?: string;
}

/**
 * Reusable Zod schema untuk string yang secara otomatis:
 * 1. Mendukung validasi panjang min dan max.
 * 2. Membersihkan karakter kontrol, null byte, dan tag HTML berbahaya.
 * 3. Memeriksa pola SQL Injection, XSS, dan Path Traversal.
 * 4. Memberikan pesan validasi yang ramah dan deskriptif.
 */
export function safeString(options: SafeStringOptions = {}) {
  const {
    fieldName = "Field",
    min,
    max,
    minMessage,
    maxMessage,
    ...sanitizeOpts
  } = options;

  let baseSchema = z.string();
  if (min !== undefined) {
    baseSchema = baseSchema.min(
      min,
      minMessage ?? `${fieldName} minimal ${min} karakter.`,
    );
  }
  if (max !== undefined) {
    baseSchema = baseSchema.max(
      max,
      maxMessage ?? `${fieldName} maksimal ${max} karakter.`,
    );
  }

  return baseSchema
    .refine((val) => !hasSqlInjectionPattern(val), {
      message: `${fieldName} mengandung karakter atau pola kueri yang tidak diizinkan.`,
    })
    .refine((val) => !hasXssPattern(val), {
      message: `${fieldName} mengandung tag atau skrip yang tidak diizinkan.`,
    })
    .refine((val) => !hasPathTraversalPattern(val), {
      message: `${fieldName} mengandung karakter direktori yang tidak diizinkan.`,
    })
    .transform((val) => sanitizeString(val, sanitizeOpts));
}
