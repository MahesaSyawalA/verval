import { z } from "zod";

export const createNotifikasiSchema = z.object({
  userId: z.string().min(1, "User ID wajib diisi"),
  tipeNotifikasi: z.string().min(1, "Tipe notifikasi wajib diisi"),
  judulNotifikasi: z.string().min(1, "Judul notifikasi wajib diisi"),
  pesan: z.string().min(1, "Pesan notifikasi wajib diisi"),
});

export const markNotifikasiReadSchema = z.object({
  notifikasiId: z.string().optional(),
  markAll: z.boolean().optional(),
});

export type CreateNotifikasiInput = z.infer<typeof createNotifikasiSchema>;
export type MarkNotifikasiReadInput = z.infer<typeof markNotifikasiReadSchema>;
