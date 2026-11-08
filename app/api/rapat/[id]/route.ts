import { NextResponse, type NextRequest } from "next/server";
import { apiError, formatZodError, handleRouteError } from "@/lib/http";
import { requireServerSession } from "@/lib/session";
import { updateStatusRapatSchema } from "@/modules/rapat/schemas/rapat.schema";
import {
  changeRapatStatus,
  getRapatDetail,
} from "@/modules/rapat/server/rapat.service";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    await requireServerSession();
    const { id } = await context.params;
    const data = await getRapatDetail(id);
    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const session = await requireServerSession(["Kaprodi", "Admin"]);
    const { id } = await context.params;
    const body = await request.json().catch(() => null);
    const parsed = updateStatusRapatSchema.safeParse(body);

    if (!parsed.success) {
      return apiError(
        "VALIDATION_ERROR",
        "Status rapat tidak valid.",
        400,
        formatZodError(parsed.error),
      );
    }

    const data = await changeRapatStatus(id, parsed.data.statusRapat, {
      id: session.userId,
      role: session.role,
    });

    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    return handleRouteError(error);
  }
}
