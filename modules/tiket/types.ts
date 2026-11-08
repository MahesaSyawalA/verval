import type { FormatBuktiItem } from "@/modules/target";

export const STATUS_TIKET_VALUES = [
  "Ditugaskan",
  "Dikerjakan",
  "Menunggu_Verifikasi",
  "Tercapai",
  "Ditolak",
] as const;

export type StatusTiketType = (typeof STATUS_TIKET_VALUES)[number];

export const PRIORITAS_TIKET_VALUES = ["Normal", "Tinggi"] as const;

export type PrioritasTiketType = (typeof PRIORITAS_TIKET_VALUES)[number];

export interface DosenOption {
  id: string;
  nip: string;
  namaLengkap: string;
  email: string;
}

export interface IsianBuktiEntry {
  id: string;
  formatBuktiId: string;
  namaField: string;
  tipeData: string;
  urutanSubmisi: number;
  nilaiIsian: string;
}

export interface RiwayatTiketEntry {
  id: string;
  statusRiwayat: string;
  createdAt: string;
  aktorId: string;
  aktorNama: string;
  aktorRole: string;
}

export interface TicketItem {
  id: string;
  kodeTiket: string;
  targetId: string;
  kodeTarget: string;
  namaTarget: string;
  satuan: string;
  tahunTarget: number;
  kuantitasTargetTotal: number;
  kuantitasDitugaskan: number;
  progresSubmisiCount: number;
  progresPersen: number;
  tenggatWaktu: string;
  prioritas: PrioritasTiketType;
  isReminderActive: boolean;
  status: StatusTiketType;
  catatanKaprodi: string | null;
  tanggalDibuat: string;
  dosenId: string;
  dosenNama: string;
  dosenNip: string;
  dosenEmail: string;
  formatBukti: FormatBuktiItem[];
  isianBukti: IsianBuktiEntry[];
  riwayatTiket: RiwayatTiketEntry[];
}

export interface TicketFilterParams {
  status?: StatusTiketType;
  dosenId?: string;
  search?: string;
}
