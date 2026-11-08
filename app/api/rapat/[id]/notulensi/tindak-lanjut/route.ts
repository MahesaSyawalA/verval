import { NextResponse, type NextRequest } from "next/server";
import { apiError, formatZodError, handleRouteError } from "@/lib/http";
import { requireServerSession } from "@/lib/session";
import { createTindakLanjutTiketSchema } from "@/modules/notulensi/schemas/notulensi.schema";
import { createFollowUpTicketFromNotulensi } from "@/modules/notulensi/server/notulensi.service";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireServerSession(["Kaprodi", "Admin"]);
    const { id: rapatId } = await context.params;
    const rawBody = await request.json().catch(() => null);
    const parsed = createTindakLanjutTiketSchema.safeParse(rawBody);

    if (!parsed.success) {
      return apiError(
        "VALIDATION_ERROR",
        "Data tiket tindak lanjut rapat tidak valid.",
        400,
        formatZodError(parsed.error),
      );
    }

    const data = await createFollowUpTicketFromNotulensi(
      rapatId,
      parsed.data,
      session,
    );

    return NextResponse.json({ data, error: null }, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
