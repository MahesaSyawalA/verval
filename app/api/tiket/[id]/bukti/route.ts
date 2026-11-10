import { NextResponse, type NextRequest } from "next/server";
import { apiError, formatZodError, handleRouteError } from "@/lib/http";
import { protectPayload } from "@/lib/security";
import { requireServerSession } from "@/lib/session";
import { submitBuktiSchema } from "@/modules/tiket/schemas/tiket.schema";
import { submitTicketBukti } from "@/modules/tiket/server/tiket.service";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const session = await requireServerSession();
    const { id } = await context.params;
    const rawBody = await request.json().catch(() => null);
    const body = protectPayload(rawBody);
    const parsed = submitBuktiSchema.safeParse(body);

    if (!parsed.success) {
      return apiError(
        "VALIDATION_ERROR",
        "Data isian bukti tidak valid.",
        400,
        formatZodError(parsed.error),
      );
    }

    const data = await submitTicketBukti(id, parsed.data, session);
    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    return handleRouteError(error);
  }
}
