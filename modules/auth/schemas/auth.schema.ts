import { z } from "zod";

export const loginSchema = z.object({
  identifier: z
    .string()
    .trim()
    .min(3, "Email atau NIP wajib diisi (minimal 3 karakter)."),
  password: z
    .string()
    .min(6, "Kata sandi wajib diisi (minimal 6 karakter)."),
});

export type LoginInput = z.infer<typeof loginSchema>;
