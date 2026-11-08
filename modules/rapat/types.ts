import type { UangCompletenessStatus } from "@/lib/utils";

export const FORMAT_RAPAT_VALUES = ["Luring", "Daring", "Hybrid"] as const;
export type FormatRapatType = (typeof FORMAT_RAPAT_VALUES)[number];

export const METODE_UNDANGAN_VALUES = [
  "Generate_Otomatis",
  "Upload_Manual",
] as const;
export type MetodeUndanganType = (typeof METODE_UNDANGAN_VALUES)[number];

export const STATUS_RAPAT_VALUES = [
  "Dijadwalkan",
  "Berlangsung",
  "Selesai",
] as const;
export type StatusRapatType = (typeof STATUS_RAPAT_VALUES)[number];

export const STATUS_KEHADIRAN_VALUES = [
  "Belum_Hadir",
  "Hadir",
  "Izin",
  "Sakit",
] as const;
export type StatusKehadiranType = (typeof STATUS_KEHADIRAN_VALUES)[number];

export const METODE_PRESENSI_VALUES = ["Kode", "Scan_QR", "Manual"] as const;
export type MetodePresensiType = (typeof METODE_PRESENSI_VALUES)[number];

export interface RapatUserOption {
  id: string;
  nip: string;
  namaLengkap: string;
  email: string;
  role: "Kaprodi" | "Dosen" | "Admin";
}

export interface PesertaRapatItem {
  id: string;
  dosenId: string;
  dosenNama: string;
  dosenNip: string;
  dosenRole: "Kaprodi" | "Dosen" | "Admin";
  statusKehadiran: StatusKehadiranType;
  waktuPresensi: string | null;
  metodePresensi: MetodePresensiType | null;
  keteranganAbsen: string | null;
}

export interface NotulensiSnapshot {
  id: string;
  agendaPembahasan: string;
  halDibahas: string;
  keputusan: string;
  tindakLanjut: string;
  fileLampiran: string | null;
  statusNotulensi: "Draf" | "Final";
  dibuatOlehId: string;
  dibuatOlehNama: string;
}

export interface DokumentasiSnapshot {
  id: string;
  fileGambar: string;
  caption: string | null;
}

export interface RapatItem {
  id: string;
  judulRapat: string;
  tanggal: string;
  waktuMulai: string;
  waktuSelesai: string;
  durasiMenit: number;
  format: FormatRapatType;
  lokasi: string;
  deskripsiAgenda: string;
  kodePresensi: string;
  isReminderActive: boolean;
  metodeUndangan: MetodeUndanganType;
  fileUndangan: string | null;
  statusRapat: StatusRapatType;
  notulisId: string;
  notulisNama: string;
  peserta: PesertaRapatItem[];
  notulensi: NotulensiSnapshot | null;
  dokumentasi: DokumentasiSnapshot[];
  uangStatus: UangCompletenessStatus;
  totalPeserta: number;
  hadirCount: number;
  izinCount: number;
  sakitCount: number;
  belumHadirCount: number;
}

export interface RapatFilterParams {
  status?: StatusRapatType;
  search?: string;
  completeness?: "ALL" | "COMPLETE" | "INCOMPLETE";
}
