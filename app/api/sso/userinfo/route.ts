import { NextResponse, type NextRequest } from "next/server";
import {
  OAUTH_NO_STORE_HEADERS,
  oauthErrorResponse,
} from "@/modules/sso/server/oauth-error";
import { getUserInfo } from "@/modules/sso/server/sso.service";
import { getIssuer } from "@/modules/sso/server/tokens";

/** Cek sesi: kembalikan data pengguna terbaru untuk access token yang sah. */
export async function GET(request: NextRequest) {
  try {
    const header = request.headers.get("authorization") ?? "";
    const token = header.toLowerCase().startsWith("bearer ")
      ? header.slice(7).trim()
      : null;

    const user = await getUserInfo(token, getIssuer(request));
    return NextResponse.json(user, { headers: OAUTH_NO_STORE_HEADERS });
  } catch (error) {
    return oauthErrorResponse(error);
  }
}
