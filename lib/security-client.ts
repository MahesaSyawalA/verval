"use client";

import { alertToast } from "@/components/ui/alert";
import { inspectPayloadThreats, sanitizeFormPayload } from "./security";

export interface CheckSecurityOptions {
  /**
   * Judul peringatan toast jika terdeteksi ancaman (default: "Peringatan Keamanan").
   */
  title?: string;
  /**
   * Pesan tambahan atau penyesuaian deskripsi peringatan.
   */
  customMessage?: string;
  /**
   * Durasi timeout toast dalam milidetik (default: 5000 ms).
   */
  timeout?: number;
}

/**
 * Memeriksa apakah suatu input, string, objek, atau array aman dari indikasi
 * SQL Injection, XSS, script berbahaya, path traversal, null-byte, dan prototype pollution.
 *
 * Bila terdeteksi ancaman:
 * - Menampilkan alertToast.warning bawaan HeroUI dengan rincian bahaya.
 * - Mengembalikan `false` (validasi gagal, proses harus dihentikan).
 *
 * Bila aman:
 * - Mengembalikan `true`.
 *
 * @example
 * ```ts
 * if (!checkInputSecurity({ username, password })) {
 *   return;
 * }
 * ```
 */
export function checkInputSecurity(
  payload: unknown,
  options: CheckSecurityOptions = {}
): boolean {
  const threat = inspectPayloadThreats(payload);
  if (threat) {
    const title = options.title ?? "Peringatan Keamanan Input";
    const description = options.customMessage
      ? `${options.customMessage} ${threat}`
      : `${threat} Masukan dibatalkan demi keamanan.`;

    alertToast.warning(title, {
      description,
      timeout: options.timeout ?? 5000,
    });
    return false;
  }
  return true;
}

/**
 * Memvalidasi keamanan formulir sekaligus membersihkan karakter kontrol/HTML berlebih.
 *
 * Bila terdeteksi ancaman mencurigakan:
 * - Menampilkan alertToast.warning.
 * - Mengembalikan `null` sehingga caller cukup melakukan:
 *   ```ts
 *   const safeData = validateAndSanitizeForm(formData);
 *   if (!safeData) return;
 *   // lanjutkan submit safeData
 *   ```
 *
 * Bila aman:
 * - Mengembalikan data yang telah disanitasi (`T`).
 */
export function validateAndSanitizeForm<T>(
  formData: T,
  options: CheckSecurityOptions = {}
): T | null {
  const isSafe = checkInputSecurity(formData, options);
  if (!isSafe) {
    return null;
  }
  return sanitizeFormPayload(formData);
}
