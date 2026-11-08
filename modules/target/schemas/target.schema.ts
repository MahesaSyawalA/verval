import { z } from "zod";
import {
  STATUS_ISIAN_BUKTI_VALUES,
  TIPE_DATA_BUKTI_VALUES,
} from "../types";

export const formatBuktiItemSchema = z.object({
  id: z.string().optional(),
  namaField: z
    .string()
    .trim()
    .min(1, "Nama isian bukti wajib diisi.")
    .max(100, "Nama isian bukti maksimal 100 karakter."),
  tipeData: z.enum(TIPE_DATA_BUKTI_VALUES, {
    message: "Tipe data bukti tidak valid.",
  }),
  statusIsian: z.enum(STATUS_ISIAN_BUKTI_VALUES, {
    message: "Status isian bukti tidak valid.",
  }),
});

export const masterTargetSchema = z.object({
  kodeTarget: z
    .string()
    .trim()
    .min(2, "Kode target wajib diisi (contoh: T-06).")
    .max(50, "Kode target maksimal 50 karakter."),
  namaTarget: z
    .string()
    .trim()
    .min(3, "Nama target wajib diisi (minimal 3 karakter).")
    .max(255, "Nama target maksimal 255 karakter."),
  kuantitasTotal: z.coerce
    .number()
    .int("Kuantitas harus berupa bilangan bulat.")
    .min(1, "Kuantitas target minimal 1."),
  satuan: z
    .string()
    .trim()
    .min(1, "Satuan wajib diisi.")
    .max(50, "Satuan maksimal 50 karakter."),
  tahun: z.coerce
    .number()
    .int()
    .min(2020, "Tahun minimal 2020.")
    .max(2100, "Tahun maksimal 2100."),
  formatBukti: z
    .array(formatBuktiItemSchema)
    .min(1, "Minimal 1 format isian bukti harus ditambahkan."),
});

export type MasterTargetInput = z.infer<typeof masterTargetSchema>;
export type FormatBuktiInput = z.infer<typeof formatBuktiItemSchema>;
