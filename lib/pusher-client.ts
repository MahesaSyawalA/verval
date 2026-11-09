import Pusher from "pusher-js";

let cached: Pusher | null = null;

/**
 * Klien Pusher sisi browser (singleton). `null` bila kunci publik belum diisi
 * atau dipanggil di server. Channel private diotorisasi lewat /api/pusher/auth
 * memakai cookie sesi yang sama.
 */
export function getPusherClient(): Pusher | null {
  if (typeof window === "undefined") return null;

  const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
  const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;
  if (!key || !cluster) return null;

  cached ??= new Pusher(key, {
    cluster,
    channelAuthorization: {
      endpoint: "/api/pusher/auth",
      transport: "ajax",
    },
  });
  return cached;
}
