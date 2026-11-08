import { z } from "zod";

export const dokumentasiPhotoEntrySchema = z.object({
  fileGambar: z
    .string()
    .trim()
    .min(1, "Path berkas foto dokumentasi wajib diisi."),
  caption: z.string().trim().max(255, "Keterangan maksimal 255 karakter.").optional(),
});

export const saveDokumentasiSchema = z.object({
  photos: z
    .array(dokumentasiPhotoEntrySchema)
    .min(1, "Minimal 1 foto dokumentasi harus dipilih."),
});

export type DokumentasiPhotoEntryInput = z.infer<
  typeof dokumentasiPhotoEntrySchema
>;
export type SaveDokumentasiInput = z.infer<typeof saveDokumentasiSchema>;
