export interface DokumentasiPhotoItem {
  id: string;
  rapatId: string;
  fileGambar: string;
  caption: string | null;
}

export interface RapatDokumentasiContext {
  rapatId: string;
  judulRapat: string;
  notulisId: string;
  pesertaIds: string[];
}
