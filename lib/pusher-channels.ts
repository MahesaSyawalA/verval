/**
 * Nama channel dan event Pusher yang dipakai bersama oleh server dan client.
 * Channel bersifat private per pengguna sehingga hanya pemiliknya yang dapat
 * berlangganan (diverifikasi di /api/pusher/auth).
 */
export const NOTIFIKASI_EVENT = "notifikasi.baru";

export function notifikasiChannelName(userId: string): string {
  return `private-notifikasi-${userId}`;
}

/** Muatan event realtime; daftar lengkap tetap diambil ulang lewat /api/notifikasi. */
export interface NotifikasiRealtimePayload {
  tipeNotifikasi: string;
  judulNotifikasi: string;
  pesan: string;
}
