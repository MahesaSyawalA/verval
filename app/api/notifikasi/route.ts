import { NextResponse, type NextRequest } from "next/server";
import { apiError, formatZodError, handleRouteError } from "@/lib/http";
import { requireServerSession } from "@/lib/session";
import { markNotifikasiReadSchema } from "@/modules/notifikasi/schemas/notifikasi.schema";
import {
  listUserNotifikasi,
  markUserNotifikasiRead,
} from "@/modules/notifikasi/server/notifikasi.service";

export async function GET() {
  try {
    const session = await requireServerSession();
    const data = await listUserNotifikasi(session.id);
    return NextResponse.json({ data, error: null }, { status: 200 });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await requireServerSession();
    const rawBody = await request.json().catch(() => ({}));
    const parsed = markNotifikasiReadSchema.safeParse(rawBody);

    if (!parsed.success) {
      return apiError(
        "VALIDATION_ERROR",
        "Input pembaruan notifikasi tidak valid.",
        400,
        formatZodError(parsed.error),
      );
    }

    const data = await markUserNotifikasiRead(session.id, parsed.data);
    return NextResponse.json({ data, error: null }, { status: 200 });
  } catch (error) {
    return handleRouteError(error);
  }
}
