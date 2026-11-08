import { z } from "zod";
import { STATUS_NOTULENSI_VALUES } from "../types";

export const saveNotulensiSchema = z.object({
  agendaPembahasan: z
    .string()
    .trim()
    .min(3, "Agenda pembahasan minimal 3 karakter."),
  halDibahas: z
    .string()
    .trim()
    .min(3, "Hal yang dibahas minimal 3 karakter."),
  keputusan: z.string().trim().min(3, "Keputusan rapat minimal 3 karakter."),
  tindakLanjut: z
    .string()
    .trim()
    .min(3, "Tindak lanjut rapat minimal 3 karakter."),
  fileLampiran: z.string().trim().optional(),
  statusNotulensi: z.enum(STATUS_NOTULENSI_VALUES, {
    message: "Status notulensi harus Draf atau Final.",
  }),
});

export const createTindakLanjutTiketSchema = z.object({
  targetId: z.string().min(1, "Target wajib dipilih."),
  dosenId: z.string().min(1, "Dosen wajib dipilih."),
  kuantitasDitugaskan: z.coerce
    .number()
    .int()
    .min(1, "Kuantitas penugasan minimal 1."),
  tenggatWaktu: z.string().min(1, "Tenggat waktu wajib diisi."),
  prioritas: z.enum(["Normal", "Tinggi"]).default("Normal"),
});

export type SaveNotulensiInput = z.infer<typeof saveNotulensiSchema>;
export type CreateTindakLanjutTiketInput = z.infer<
  typeof createTindakLanjutTiketSchema
>;
