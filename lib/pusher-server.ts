import Pusher from "pusher";

let cached: Pusher | null | undefined;

/**
 * Klien Pusher sisi server. Mengembalikan `null` bila kredensial belum diisi,
 * sehingga fitur realtime nonaktif tanpa mengganggu alur aplikasi lainnya.
 */
export function getPusherServer(): Pusher | null {
  if (cached !== undefined) return cached;

  const appId = process.env.PUSHER_APP_ID;
  const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
  const secret = process.env.PUSHER_SECRET;
  const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;

  cached =
    appId && key && secret && cluster
      ? new Pusher({ appId, key, secret, cluster, useTLS: true })
      : null;

  return cached;
}
