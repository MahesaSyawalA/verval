import { NextResponse, type NextRequest } from "next/server";
import { apiError, formatZodError, handleRouteError } from "@/lib/http";
import { requireServerSession } from "@/lib/session";
import { verifyTiketSchema } from "@/modules/tiket/schemas/tiket.schema";
import { verifyTicketByKaprodi } from "@/modules/tiket/server/tiket.service";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const session = await requireServerSession(["Kaprodi", "Admin"]);
    const { id } = await context.params;
    const body = await request.json().catch(() => null);
    const parsed = verifyTiketSchema.safeParse(body);

    if (!parsed.success) {
      return apiError(
        "VALIDATION_ERROR",
        "Data verifikasi tiket tidak valid.",
        400,
        formatZodError(parsed.error),
      );
    }

    const data = await verifyTicketByKaprodi(id, parsed.data, session);
    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    return handleRouteError(error);
  }
}
