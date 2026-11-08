import type {
  MetodePresensiType,
  PesertaRapatItem,
  StatusKehadiranType,
  StatusRapatType,
} from "@/modules/rapat";

export type { MetodePresensiType, PesertaRapatItem, StatusKehadiranType };

export interface RapatPresensiContext {
  rapatId: string;
  judulRapat: string;
  statusRapat: StatusRapatType;
  kodePresensi: string;
  peserta: PesertaRapatItem[];
}

export interface PresensiSubmissionResult {
  rapatId: string;
  judulRapat: string;
  dosenId: string;
  dosenNama: string;
  statusKehadiran: StatusKehadiranType;
  metodePresensi: MetodePresensiType;
  waktuPresensi: string;
  keteranganAbsen: string | null;
}
