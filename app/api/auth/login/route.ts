import { NextResponse, type NextRequest } from "next/server";
import { apiError, formatZodError, handleRouteError } from "@/lib/http";
import { getSessionCookieOptions, signSessionToken } from "@/lib/session";
import { loginSchema } from "@/modules/auth/schemas/auth.schema";
import { authenticateUser } from "@/modules/auth/server/auth.service";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return apiError(
        "VALIDATION_ERROR",
        "Data login tidak valid.",
        400,
        formatZodError(parsed.error),
      );
    }

    const result = await authenticateUser(parsed.data);
    const token = await signSessionToken(result.user);

    const response = NextResponse.json(result, { status: 200 });
    response.cookies.set({
      ...getSessionCookieOptions(),
      value: token,
    });

    return response;
  } catch (error) {
    return handleRouteError(error);
  }
}
