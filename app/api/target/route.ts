import { NextResponse, type NextRequest } from "next/server";
import { apiError, formatZodError, handleRouteError } from "@/lib/http";
import { protectPayload, sanitizeString } from "@/lib/security";
import { requireServerSession } from "@/lib/session";
import { masterTargetSchema } from "@/modules/target/schemas/target.schema";
import {
  createMasterTarget,
  listMasterTargets,
} from "@/modules/target/server/target.service";

export async function GET(request: NextRequest) {
  try {
    await requireServerSession();
    const { searchParams } = request.nextUrl;
    const tahunParam = searchParams.get("tahun");
    const rawSearch = searchParams.get("search");
    const search = rawSearch ? sanitizeString(rawSearch) : undefined;

    const data = await listMasterTargets({
      tahun: tahunParam ? Number(tahunParam) : undefined,
      search,
    });

    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireServerSession(["Kaprodi", "Admin"]);
    const rawBody = await request.json().catch(() => null);
    const body = protectPayload(rawBody);
    const parsed = masterTargetSchema.safeParse(body);

    if (!parsed.success) {
      return apiError(
        "VALIDATION_ERROR",
        "Data master target tidak valid.",
        400,
        formatZodError(parsed.error),
      );
    }

    const data = await createMasterTarget(parsed.data);
    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
