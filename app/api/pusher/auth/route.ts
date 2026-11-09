import { NextResponse, type NextRequest } from "next/server";
import { apiError, handleRouteError } from "@/lib/http";
import { notifikasiChannelName } from "@/lib/pusher-channels";
import { getPusherServer } from "@/lib/pusher-server";
import { requireServerSession } from "@/lib/session";

/**
 * Otorisasi channel private Pusher. Pengguna hanya boleh berlangganan channel
 * notifikasi miliknya sendiri.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await requireServerSession();
    const pusher = getPusherServer();

    if (!pusher) {
      return apiError(
        "BAD_REQUEST",
        "Notifikasi realtime belum dikonfigurasi.",
        503,
      );
    }

    const form = await request.formData();
    const socketId = String(form.get("socket_id") ?? "");
    const channelName = String(form.get("channel_name") ?? "");

    if (!socketId || channelName !== notifikasiChannelName(session.id)) {
      return apiError(
        "FORBIDDEN",
        "Anda tidak berhak berlangganan channel ini.",
        403,
      );
    }

    return NextResponse.json(pusher.authorizeChannel(socketId, channelName));
  } catch (error) {
    return handleRouteError(error);
  }
}
