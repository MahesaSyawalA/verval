import { NextResponse } from "next/server";
import { handleRouteError } from "@/lib/http";
import { PRIVILEGED_ROLES } from "@/config/roles";
import { requireServerSession } from "@/lib/session";
import { getKaprodiDashboardSummary } from "@/modules/dashboard/server/dashboard.service";

export async function GET() {
  try {
    await requireServerSession(PRIVILEGED_ROLES);
    const data = await getKaprodiDashboardSummary();
    return NextResponse.json({ data, error: null }, { status: 200 });
  } catch (error) {
    return handleRouteError(error);
  }
}
