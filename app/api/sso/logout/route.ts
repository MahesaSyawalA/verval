import { NextResponse, type NextRequest } from "next/server";
import { getServerSession, getSessionCookieOptions } from "@/lib/session";
import {
  OAUTH_NO_STORE_HEADERS,
  oauthErrorResponse,
} from "@/modules/sso/server/oauth-error";
import {
  resolvePostLogoutRedirect,
  revokeUserSessions,
} from "@/modules/sso/server/sso.service";

/**
 * Keluar dari SSO: cabut semua refresh token pengguna, hapus cookie sesi SSO,
 * lalu alihkan ke `post_logout_redirect_uri` yang terdaftar (atau halaman login).
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (session) {
      await revokeUserSessions(session.id);
    }

    const params = request.nextUrl.searchParams;
    const redirectUri = await resolvePostLogoutRedirect(
      params.get("client_id") ?? undefined,
      params.get("post_logout_redirect_uri") ?? undefined,
    );

    let target: URL;
    if (redirectUri) {
      target = new URL(redirectUri);
      const state = params.get("state");
      if (state) target.searchParams.set("state", state);
    } else {
      target = request.nextUrl.clone();
      target.pathname = "/login";
      target.search = "";
    }

    const response = NextResponse.redirect(target, {
      status: 302,
      headers: OAUTH_NO_STORE_HEADERS,
    });
    response.cookies.set({ ...getSessionCookieOptions(0), value: "" });
    return response;
  } catch (error) {
    return oauthErrorResponse(error);
  }
}
