import { z } from "zod";
import { validateMeetingDuration } from "@/lib/utils";
import {
  FORMAT_RAPAT_VALUES,
  METODE_UNDANGAN_VALUES,
  STATUS_RAPAT_VALUES,
} from "../types";

export function parseTimeToMinutes(timeStr: string): number | null {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(timeStr.trim());
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

export const createAgendaRapatSchema = z
  .object({
    judulRapat: z.string().trim().min(3, "Judul rapat minimal 3 karakter."),
    tanggal: z.string().trim().min(1, "Tanggal rapat wajib diisi."),
    waktuMulai: z
      .string()
      .trim()
      .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Format waktu mulai harus HH:mm."),
    waktuSelesai: z
      .string()
      .trim()
      .regex(
        /^([01]\d|2[0-3]):([0-5]\d)$/,
        "Format waktu selesai harus HH:mm.",
      ),
    format: z.enum(FORMAT_RAPAT_VALUES, {
      message: "Format rapat tidak valid.",
    }),
    lokasi: z.string().trim().min(2, "Lokasi rapat wajib diisi."),
    pesertaIds: z
      .array(z.string().trim().min(1))
      .min(1, "Minimal 1 peserta rapat harus dipilih."),
    notulisId: z.string().trim().min(1, "Notulis rapat wajib dipilih."),
    deskripsiAgenda: z
      .string()
      .trim()
      .min(5, "Agenda / deskripsi rapat minimal 5 karakter."),
    metodeUndangan: z.enum(METODE_UNDANGAN_VALUES, {
      message: "Metode surat undangan tidak valid.",
    }),
    fileUndangan: z.string().trim().optional(),
    isReminderActive: z.boolean().default(true),
  })
  .superRefine((val, ctx) => {
    const startMins = parseTimeToMinutes(val.waktuMulai);
    const endMins = parseTimeToMinutes(val.waktuSelesai);

    if (startMins !== null && endMins !== null) {
      const duration = endMins - startMins;
      const check = validateMeetingDuration(duration);
      if (!check.valid) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["waktuSelesai"],
          message: `${check.message} (15 - 240 menit).`,
        });
      }
    }

    if (
      val.metodeUndangan === "Upload_Manual" &&
      (!val.fileUndangan || val.fileUndangan.trim().length === 0)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["fileUndangan"],
        message: "Berkas surat undangan wajib diunggah untuk metode Upload Manual.",
      });
    }
  });

export const updateStatusRapatSchema = z.object({
  statusRapat: z.enum(STATUS_RAPAT_VALUES, {
    message: "Status rapat tidak valid.",
  }),
});

export type CreateAgendaRapatInput = z.infer<typeof createAgendaRapatSchema>;
export type UpdateStatusRapatInput = z.infer<typeof updateStatusRapatSchema>;
