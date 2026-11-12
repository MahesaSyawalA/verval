import { NextResponse, type NextRequest } from "next/server";
import { getServerSession } from "@/lib/session";
import {
  OAUTH_NO_STORE_HEADERS,
  oauthErrorResponse,
} from "@/modules/sso/server/oauth-error";
import {
  issueAuthorizationCode,
  validateAuthorizeRequest,
  type AuthorizeParams,
} from "@/modules/sso/server/sso.service";

function redirectTo(url: URL): NextResponse {
  return NextResponse.redirect(url, {
    status: 302,
    headers: OAUTH_NO_STORE_HEADERS,
  });
}

/** Alihkan balik ke modul dengan galat berformat OAuth. */
function redirectWithError(
  redirectUri: string,
  error: string,
  description: string,
  state?: string,
): NextResponse {
  const target = new URL(redirectUri);
  target.searchParams.set("error", error);
  target.searchParams.set("error_description", description);
  if (state) target.searchParams.set("state", state);
  return redirectTo(target);
}

export async function GET(request: NextRequest) {
  try {
    const params = Object.fromEntries(
      request.nextUrl.searchParams,
    ) as AuthorizeParams;

    const check = await validateAuthorizeRequest(params);

    // Klien/redirect_uri tidak sah: jangan pernah redirect ke alamat tak tepercaya.
    if (!check.ok && check.fatal) {
      return NextResponse.json(
        { error: "invalid_request", error_description: check.description },
        { status: 400, headers: OAUTH_NO_STORE_HEADERS },
      );
    }
    if (!check.ok) {
      return redirectWithError(
        check.redirectUri,
        check.error,
        check.description,
        check.state,
      );
    }

    const session = await getServerSession();
    if (!session) {
      // Belum login SSO: ke halaman login, lalu kembali ke permintaan ini.
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/login";
      loginUrl.search = "";
      loginUrl.searchParams.set(
        "next",
        `${request.nextUrl.pathname}${request.nextUrl.search}`,
      );
      return redirectTo(loginUrl);
    }

    const code = await issueAuthorizationCode({
      client: check.client,
      user: {
        id: session.id,
        nip: session.nip,
        namaLengkap: session.namaLengkap,
        email: session.email,
        role: session.role,
      },
      redirectUri: check.redirectUri,
      codeChallenge: check.codeChallenge,
    });

    if (!code) {
      return redirectWithError(
        check.redirectUri,
        "access_denied",
        "Role Anda tidak diizinkan mengakses modul ini.",
        check.state,
      );
    }

    const target = new URL(check.redirectUri);
    target.searchParams.set("code", code);
    if (check.state) target.searchParams.set("state", check.state);
    return redirectTo(target);
  } catch (error) {
    return oauthErrorResponse(error);
  }
}
