export const STATUS_NOTULENSI_VALUES = ["Draf", "Final"] as const;
export type StatusNotulensiType = (typeof STATUS_NOTULENSI_VALUES)[number];

export interface RapatNotulensiContext {
  rapatId: string;
  judulRapat: string;
  notulisId: string;
  notulisNama: string;
  existingNotulensi: {
    id: string;
    agendaPembahasan: string;
    halDibahas: string;
    keputusan: string;
    tindakLanjut: string;
    fileLampiran: string | null;
    statusNotulensi: StatusNotulensiType;
  } | null;
}

export interface NotulensiItem {
  id: string;
  rapatId: string;
  agendaPembahasan: string;
  halDibahas: string;
  keputusan: string;
  tindakLanjut: string;
  fileLampiran: string | null;
  statusNotulensi: StatusNotulensiType;
  dibuatOlehId: string;
}
