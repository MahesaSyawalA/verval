import { z } from "zod";
import { PRIORITAS_TIKET_VALUES, STATUS_TIKET_VALUES } from "../types";

export const createTiketSchema = z.object({
  targetId: z.string().trim().min(1, "Master target wajib dipilih."),
  dosenId: z.string().trim().min(1, "Dosen wajib dipilih."),
  kuantitasDitugaskan: z.coerce
    .number()
    .int("Kuantitas harus bilangan bulat.")
    .min(1, "Kuantitas dibebankan minimal 1."),
  tenggatWaktu: z
    .string()
    .trim()
    .min(1, "Tenggat waktu wajib diisi."),
  prioritas: z.enum(PRIORITAS_TIKET_VALUES, {
    message: "Prioritas tidak valid.",
  }),
  isReminderActive: z.boolean().default(true),
  catatanKaprodi: z.string().trim().optional(),
});

export const statusTransitionSchema = z.object({
  nextStatus: z.enum(STATUS_TIKET_VALUES, {
    message: "Status tiket tidak valid.",
  }),
  catatanKaprodi: z.string().trim().optional(),
});

export const isianBuktiSubmissionItemSchema = z.object({
  formatBuktiId: z.string().trim().min(1, "Format bukti wajib diisi."),
  urutanSubmisi: z.coerce.number().int().min(1).default(1),
  nilaiIsian: z.string().trim().min(1, "Nilai isian bukti wajib diisi."),
});

export const submitBuktiSchema = z.object({
  action: z.enum(["draft", "submit"]).default("submit"),
  submissions: z
    .array(isianBuktiSubmissionItemSchema)
    .min(1, "Minimal 1 isian bukti harus dilengkapi."),
});

export const verifyTiketSchema = z
  .object({
    decision: z.enum(["approve", "reject"]),
    catatanKaprodi: z.string().trim().optional(),
  })
  .superRefine((val, ctx) => {
    if (val.decision === "reject" && (!val.catatanKaprodi || val.catatanKaprodi.length < 5)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["catatanKaprodi"],
        message: "Catatan untuk dosen wajib diisi (minimal 5 karakter) saat menolak tiket.",
      });
    }
  });

export type CreateTiketInput = z.infer<typeof createTiketSchema>;
export type StatusTransitionInput = z.infer<typeof statusTransitionSchema>;
export type SubmitBuktiInput = z.infer<typeof submitBuktiSchema>;
export type VerifyTiketInput = z.infer<typeof verifyTiketSchema>;
