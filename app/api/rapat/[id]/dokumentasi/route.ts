import { NextResponse, type NextRequest } from "next/server";
import { apiError, formatZodError, handleRouteError } from "@/lib/http";
import { requireServerSession } from "@/lib/session";
import { saveDokumentasiSchema } from "@/modules/dokumentasi/schemas/dokumentasi.schema";
import { saveDokumentasiRapat } from "@/modules/dokumentasi/server/dokumentasi.service";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const session = await requireServerSession();
    const { id } = await context.params;
    const body = await request.json().catch(() => null);
    const parsed = saveDokumentasiSchema.safeParse(body);

    if (!parsed.success) {
      return apiError(
        "VALIDATION_ERROR",
        "Data foto dokumentasi tidak valid.",
        400,
        formatZodError(parsed.error),
      );
    }

    const data = await saveDokumentasiRapat(id, parsed.data, session);
    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
