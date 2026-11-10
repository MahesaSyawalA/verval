import { NextResponse, type NextRequest } from "next/server";
import { apiError, formatZodError, handleRouteError } from "@/lib/http";
import { protectPayload, sanitizeString } from "@/lib/security";
import { requireServerSession } from "@/lib/session";
import { createTiketSchema } from "@/modules/tiket/schemas/tiket.schema";
import {
  createTicketAssignment,
  listDosenOptions,
  listTicketsForUser,
} from "@/modules/tiket/server/tiket.service";
import type { StatusTiketType } from "@/modules/tiket/types";

export async function GET(request: NextRequest) {
  try {
    const session = await requireServerSession();
    const { searchParams } = request.nextUrl;
    const status = (searchParams.get("status") as StatusTiketType) || undefined;
    const dosenId = searchParams.get("dosenId")
      ? sanitizeString(searchParams.get("dosenId"))
      : undefined;
    const rawSearch = searchParams.get("search");
    const search = rawSearch ? sanitizeString(rawSearch) : undefined;

    const [data, dosenOptions] = await Promise.all([
      listTicketsForUser(session, { status, dosenId, search }),
      listDosenOptions(),
    ]);

    return NextResponse.json({ data, dosenOptions }, { status: 200 });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireServerSession(["Kaprodi", "Admin"]);
    const rawBody = await request.json().catch(() => null);
    const body = protectPayload(rawBody);
    const parsed = createTiketSchema.safeParse(body);

    if (!parsed.success) {
      return apiError(
        "VALIDATION_ERROR",
        "Data penugasan tiket tidak valid.",
        400,
        formatZodError(parsed.error),
      );
    }

    const data = await createTicketAssignment(parsed.data, session.id);
    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
