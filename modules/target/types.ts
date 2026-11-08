export const TIPE_DATA_BUKTI_VALUES = [
  "Teks",
  "Angka",
  "Tanggal",
  "Tautan",
  "File",
] as const;

export type TipeDataBuktiType = (typeof TIPE_DATA_BUKTI_VALUES)[number];

export const STATUS_ISIAN_BUKTI_VALUES = ["Wajib", "Opsional"] as const;

export type StatusIsianBuktiType = (typeof STATUS_ISIAN_BUKTI_VALUES)[number];

export interface FormatBuktiItem {
  id: string;
  namaField: string;
  tipeData: TipeDataBuktiType;
  statusIsian: StatusIsianBuktiType;
}

export interface MasterTargetItem {
  id: string;
  kodeTarget: string;
  namaTarget: string;
  kuantitasTotal: number;
  kuantitasDitugaskan: number;
  satuan: string;
  tahun: number;
  formatBukti: FormatBuktiItem[];
}

export interface TargetFilterParams {
  tahun?: number;
  search?: string;
}
