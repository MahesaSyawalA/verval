import { NextResponse, type NextRequest } from "next/server";
import { SSO_ADMIN_ROLES } from "@/config/roles";
import { handleRouteError } from "@/lib/http";
import { requireServerSession } from "@/lib/session";
import { rotateSsoClientSecretAdmin } from "@/modules/sso/server/sso-admin.service";

export async function POST(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await requireServerSession(SSO_ADMIN_ROLES);
    const { id } = await context.params;
    const data = await rotateSsoClientSecretAdmin(id);
    return NextResponse.json(
      { data },
      { status: 200, headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return handleRouteError(error);
  }
}
