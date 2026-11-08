import { z } from "zod";

export const submitPresensiSchema = z
  .object({
    statusKehadiran: z.enum(["Hadir", "Izin", "Sakit"], {
      message: "Status kehadiran wajib dipilih (Hadir, Izin, atau Sakit).",
    }),
    metodePresensi: z.enum(["Kode", "Scan_QR", "Manual"], {
      message: "Metode presensi tidak valid.",
    }),
    kodePresensi: z.string().trim().optional(),
    keteranganAbsen: z.string().trim().optional(),
  })
  .superRefine((val, ctx) => {
    if (
      val.statusKehadiran === "Hadir" &&
      val.metodePresensi === "Kode" &&
      (!val.kodePresensi || val.kodePresensi.trim().length !== 6)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["kodePresensi"],
        message: "Kode presensi wajib terdiri dari 6 karakter.",
      });
    }
  });

export type SubmitPresensiInput = z.infer<typeof submitPresensiSchema>;
