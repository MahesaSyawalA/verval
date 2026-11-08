import { NextResponse, type NextRequest } from "next/server";
import { apiError, formatZodError, handleRouteError } from "@/lib/http";
import { requireServerSession } from "@/lib/session";
import { masterTargetSchema } from "@/modules/target/schemas/target.schema";
import {
  deleteMasterTarget,
  getMasterTargetById,
  updateMasterTarget,
} from "@/modules/target/server/target.service";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    await requireServerSession();
    const { id } = await context.params;
    const data = await getMasterTargetById(id);
    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    await requireServerSession(["Kaprodi", "Admin"]);
    const { id } = await context.params;
    const body = await request.json().catch(() => null);
    const parsed = masterTargetSchema.safeParse(body);

    if (!parsed.success) {
      return apiError(
        "VALIDATION_ERROR",
        "Data master target tidak valid.",
        400,
        formatZodError(parsed.error),
      );
    }

    const data = await updateMasterTarget(id, parsed.data);
    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    await requireServerSession(["Kaprodi", "Admin"]);
    const { id } = await context.params;
    await deleteMasterTarget(id);
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    return handleRouteError(error);
  }
}
