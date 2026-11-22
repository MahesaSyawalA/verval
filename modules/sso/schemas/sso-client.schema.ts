import { z } from "zod";
import { ROLES, type UserRole } from "@/config/roles";

export function isValidSsoUrl(value: string): boolean {
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    return false;
  }
  const isLocal = ["localhost", "127.0.0.1"].includes(parsed.hostname);
  const allowedProtocol =
    parsed.protocol === "https:" || (parsed.protocol === "http:" && isLocal);
  if (!allowedProtocol) return false;
  if (parsed.hash) return false;
  return true;
}

const ssoUrlSchema = z
  .string()
  .trim()
  .min(1, "URL wajib diisi.")
  .max(500, "URL maksimal 500 karakter.")
  .refine(
    isValidSsoUrl,
    "URL harus valid dengan https:// (http:// hanya untuk localhost/127.0.0.1) dan tanpa fragmen (#).",
  );

const roleEnum = z.enum(ROLES as unknown as [UserRole, ...UserRole[]]);

export const createSsoClientSchema = z.object({
  clientId: z
    .string()
    .trim()
    .regex(
      /^[a-z0-9][a-z0-9._-]{1,99}$/,
      "Client ID hanya boleh huruf kecil, angka, titik, garis bawah, atau strip (2–100 karakter).",
    ),
  name: z
    .string()
    .trim()
    .min(2, "Nama modul minimal 2 karakter.")
    .max(150, "Nama modul maksimal 150 karakter."),
  description: z
    .string()
    .trim()
    .max(255, "Deskripsi maksimal 255 karakter.")
    .optional()
    .nullable()
    .transform((v) => (v && v.length > 0 ? v : null)),
  launchUrl: ssoUrlSchema,
  redirectUris: z
    .array(ssoUrlSchema)
    .min(1, "Minimal satu Redirect URI wajib diisi.")
    .transform((uris) => Array.from(new Set(uris))),
  postLogoutRedirectUris: z
    .array(ssoUrlSchema)
    .optional()
    .default([])
    .transform((uris) => Array.from(new Set(uris))),
  allowedRoles: z
    .array(roleEnum)
    .min(1, "Pilih minimal satu role yang diizinkan.")
    .transform((roles) => Array.from(new Set(roles))),
  isPublic: z.boolean().optional().default(false),
});

export const updateSsoClientSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Nama modul minimal 2 karakter.")
    .max(150, "Nama modul maksimal 150 karakter.")
    .optional(),
  description: z
    .string()
    .trim()
    .max(255, "Deskripsi maksimal 255 karakter.")
    .nullable()
    .transform((v) => (v && v.length > 0 ? v : null))
    .optional(),
  launchUrl: ssoUrlSchema.optional(),
  redirectUris: z
    .array(ssoUrlSchema)
    .min(1, "Minimal satu Redirect URI wajib diisi.")
    .transform((uris) => Array.from(new Set(uris)))
    .optional(),
  postLogoutRedirectUris: z
    .array(ssoUrlSchema)
    .transform((uris) => Array.from(new Set(uris)))
    .optional(),
  allowedRoles: z
    .array(roleEnum)
    .min(1, "Pilih minimal satu role yang diizinkan.")
    .transform((roles) => Array.from(new Set(roles)))
    .optional(),
  isActive: z.boolean().optional(),
});

export type CreateSsoClientInput = z.infer<typeof createSsoClientSchema>;
export type UpdateSsoClientInput = z.infer<typeof updateSsoClientSchema>;
