import {
  NOTIFIKASI_EVENT,
  notifikasiChannelName,
  type NotifikasiRealtimePayload,
} from "@/lib/pusher-channels";
import { getPusherServer } from "@/lib/pusher-server";

const BATCH_LIMIT = 10;

/**
 * Menyiarkan notifikasi baru ke channel private pengguna. Kegagalan Pusher
 * hanya dicatat dan tidak membatalkan proses bisnis yang membuat notifikasi.
 */
export async function broadcastNotifikasi(
  events: Array<{ userId: string } & NotifikasiRealtimePayload>,
): Promise<void> {
  const pusher = getPusherServer();
  if (!pusher || events.length === 0) return;

  const batch = events.map(({ userId, ...payload }) => ({
    channel: notifikasiChannelName(userId),
    name: NOTIFIKASI_EVENT,
    data: payload,
  }));

  try {
    for (let i = 0; i < batch.length; i += BATCH_LIMIT) {
      await pusher.triggerBatch(batch.slice(i, i + BATCH_LIMIT));
    }
  } catch (error) {
    console.error("[pusher] Gagal menyiarkan notifikasi realtime:", error);
  }
}
