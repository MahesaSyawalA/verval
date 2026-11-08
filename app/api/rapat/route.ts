import { NextResponse, type NextRequest } from "next/server";
import { apiError, formatZodError, handleRouteError } from "@/lib/http";
import { requireServerSession } from "@/lib/session";
import { createAgendaRapatSchema } from "@/modules/rapat/schemas/rapat.schema";
import {
  createAgendaRapat,
  listRapatForUser,
  listRapatUserOptions,
} from "@/modules/rapat/server/rapat.service";
import type { StatusRapatType } from "@/modules/rapat/types";

export async function GET(request: NextRequest) {
  try {
    const session = await requireServerSession();
    const { searchParams } = new URL(request.url);
    const status = (searchParams.get("status") ?? undefined) as
      | StatusRapatType
      | undefined;
    const search = searchParams.get("search") ?? undefined;
    const completeness = (searchParams.get("completeness") ?? undefined) as
      | "ALL"
      | "COMPLETE"
      | "INCOMPLETE"
      | undefined;

    const [data, userOptions] = await Promise.all([
      listRapatForUser(session, { status, search, completeness }),
      listRapatUserOptions(),
    ]);

    return NextResponse.json({ data, userOptions }, { status: 200 });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireServerSession(["Kaprodi", "Admin"]);
    const body = await request.json().catch(() => null);
    const parsed = createAgendaRapatSchema.safeParse(body);

    if (!parsed.success) {
      return apiError(
        "VALIDATION_ERROR",
        "Data agenda rapat tidak valid.",
        400,
        formatZodError(parsed.error),
      );
    }

    const data = await createAgendaRapat(parsed.data, session);

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
