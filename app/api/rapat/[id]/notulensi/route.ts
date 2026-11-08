import { NextResponse, type NextRequest } from "next/server";
import { apiError, formatZodError, handleRouteError } from "@/lib/http";
import { requireServerSession } from "@/lib/session";
import { saveNotulensiSchema } from "@/modules/notulensi/schemas/notulensi.schema";
import { saveNotulensiRapat } from "@/modules/notulensi/server/notulensi.service";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const session = await requireServerSession();
    const { id } = await context.params;
    const body = await request.json().catch(() => null);
    const parsed = saveNotulensiSchema.safeParse(body);

    if (!parsed.success) {
      return apiError(
        "VALIDATION_ERROR",
        "Data notulensi rapat tidak valid.",
        400,
        formatZodError(parsed.error),
      );
    }

    const data = await saveNotulensiRapat(id, parsed.data, session);
    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    return handleRouteError(error);
  }
}
