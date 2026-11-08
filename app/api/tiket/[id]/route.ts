import { NextResponse, type NextRequest } from "next/server";
import { handleRouteError } from "@/lib/http";
import { requireServerSession } from "@/lib/session";
import { getTicketDetailForUser } from "@/modules/tiket/server/tiket.service";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const session = await requireServerSession();
    const { id } = await context.params;
    const data = await getTicketDetailForUser(id, session);
    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    return handleRouteError(error);
  }
}
