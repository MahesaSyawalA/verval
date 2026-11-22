import { NextResponse, type NextRequest } from "next/server";
import { SSO_ADMIN_ROLES } from "@/config/roles";
import { apiError, formatZodError, handleRouteError } from "@/lib/http";
import { protectPayload } from "@/lib/security";
import { requireServerSession } from "@/lib/session";
import { updateSsoClientSchema } from "@/modules/sso/schemas/sso-client.schema";
import { updateSsoClientAdmin } from "@/modules/sso/server/sso-admin.service";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await requireServerSession(SSO_ADMIN_ROLES);
    const { id } = await context.params;
    const rawBody = await request.json().catch(() => null);
    const body = protectPayload(rawBody);
    const parsed = updateSsoClientSchema.safeParse(body);

    if (!parsed.success) {
      return apiError(
        "VALIDATION_ERROR",
        "Data pembaruan modul SSO tidak valid.",
        400,
        formatZodError(parsed.error),
      );
    }

    const data = await updateSsoClientAdmin(id, parsed.data);
    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    return handleRouteError(error);
  }
}
