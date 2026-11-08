import { NextResponse } from "next/server";
import { handleRouteError } from "@/lib/http";
import { requireServerSession } from "@/lib/session";
import { getAuthenticatedProfile } from "@/modules/auth/server/auth.service";

export async function GET() {
  try {
    const session = await requireServerSession();
    const user = await getAuthenticatedProfile(session.id);
    return NextResponse.json({ user }, { status: 200 });
  } catch (error) {
    return handleRouteError(error);
  }
}
