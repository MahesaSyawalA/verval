export type TipeNotifikasi =
  | "RAPAT_PENGINGAT_1J"
  | "RAPAT_PENGINGAT_H1"
  | "UNDANGAN_BARU"
  | "NOTULENSI_FINAL"
  | "TIKET_BARU"
  | "TIKET_DITOLAK"
  | "TIKET_DISETUJUI"
  | (string & {});

export interface NotifikasiItem {
  id: string;
  tipeNotifikasi: TipeNotifikasi;
  judulNotifikasi: string;
  pesan: string;
  isRead: boolean;
  createdAt: string;
  userId: string;
}

export interface NotifikasiListResponse {
  items: NotifikasiItem[];
  unreadCount: number;
}
