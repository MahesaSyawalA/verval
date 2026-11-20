import { NextResponse } from "next/server";
import { handleRouteError } from "@/lib/http";
import { STAFF_ROLES } from "@/config/roles";
import { requireServerSession } from "@/lib/session";
import { getDosenDashboardSummary } from "@/modules/dashboard/server/dashboard.service";

export async function GET() {
  try {
    const session = await requireServerSession(STAFF_ROLES);
    const data = await getDosenDashboardSummary(session.id);
    return NextResponse.json({ data, error: null }, { status: 200 });
  } catch (error) {
    return handleRouteError(error);
  }
}
