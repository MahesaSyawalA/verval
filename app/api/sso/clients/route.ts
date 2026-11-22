import { NextResponse, type NextRequest } from "next/server";
import { SSO_ADMIN_ROLES } from "@/config/roles";
import { apiError, formatZodError, handleRouteError } from "@/lib/http";
import { protectPayload } from "@/lib/security";
import { requireServerSession } from "@/lib/session";
import { createSsoClientSchema } from "@/modules/sso/schemas/sso-client.schema";
import {
  createSsoClientAdmin,
  listSsoClientsAdmin,
} from "@/modules/sso/server/sso-admin.service";

export async function GET() {
  try {
    await requireServerSession(SSO_ADMIN_ROLES);
    const data = await listSsoClientsAdmin();
    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireServerSession(SSO_ADMIN_ROLES);
    const rawBody = await request.json().catch(() => null);
    const body = protectPayload(rawBody);
    const parsed = createSsoClientSchema.safeParse(body);

    if (!parsed.success) {
      return apiError(
        "VALIDATION_ERROR",
        "Data modul SSO tidak valid.",
        400,
        formatZodError(parsed.error),
      );
    }

    const data = await createSsoClientAdmin(parsed.data);
    return NextResponse.json(
      { data },
      { status: 201, headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return handleRouteError(error);
  }
}
