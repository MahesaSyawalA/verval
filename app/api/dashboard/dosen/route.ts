import { NextResponse } from "next/server";
import { handleRouteError } from "@/lib/http";
import { requireServerSession } from "@/lib/session";
import { getDosenDashboardSummary } from "@/modules/dashboard/server/dashboard.service";

export async function GET() {
  try {
    const session = await requireServerSession();
    const data = await getDosenDashboardSummary(session.id);
    return NextResponse.json({ data, error: null }, { status: 200 });
  } catch (error) {
    return handleRouteError(error);
  }
}
