import { NextResponse, type NextRequest } from "next/server";
import {
  OAUTH_NO_STORE_HEADERS,
  OAuthError,
  oauthErrorResponse,
} from "@/modules/sso/server/oauth-error";
import {
  exchangeAuthorizationCode,
  refreshTokens,
} from "@/modules/sso/server/sso.service";
import { getIssuer } from "@/modules/sso/server/tokens";

type TokenBody = Record<string, string | undefined>;

/** Menerima form-urlencoded (standar OAuth) maupun JSON. */
async function readBody(request: NextRequest): Promise<TokenBody> {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    const json = await request.json().catch(() => null);
    if (!json || typeof json !== "object") return {};
    return Object.fromEntries(
      Object.entries(json).filter(([, value]) => typeof value === "string"),
    ) as TokenBody;
  }

  const form = await request.formData().catch(() => null);
  if (!form) return {};
  return Object.fromEntries(
    [...form.entries()].filter(([, value]) => typeof value === "string"),
  ) as TokenBody;
}

/** Kredensial klien dari header Basic atau dari body. */
function readClientCredentials(request: NextRequest, body: TokenBody) {
  const header = request.headers.get("authorization");
  if (header?.toLowerCase().startsWith("basic ")) {
    try {
      const decoded = Buffer.from(header.slice(6), "base64").toString("utf8");
      const separator = decoded.indexOf(":");
      if (separator > 0) {
        return {
          clientId: decodeURIComponent(decoded.slice(0, separator)),
          clientSecret: decodeURIComponent(decoded.slice(separator + 1)),
        };
      }
    } catch {
      // Header rusak: jatuh ke kredensial di body, lalu ditolak sebagai invalid_client.
    }
  }
  return { clientId: body.client_id, clientSecret: body.client_secret };
}

export async function POST(request: NextRequest) {
  try {
    const body = await readBody(request);
    const { clientId, clientSecret } = readClientCredentials(request, body);
    const issuer = getIssuer(request);

    let tokens;
    if (body.grant_type === "authorization_code") {
      tokens = await exchangeAuthorizationCode(
        {
          clientId,
          clientSecret,
          code: body.code,
          redirectUri: body.redirect_uri,
          codeVerifier: body.code_verifier,
        },
        issuer,
      );
    } else if (body.grant_type === "refresh_token") {
      tokens = await refreshTokens(
        { clientId, clientSecret, refreshToken: body.refresh_token },
        issuer,
      );
    } else {
      throw new OAuthError(
        "unsupported_grant_type",
        "grant_type harus 'authorization_code' atau 'refresh_token'.",
      );
    }

    return NextResponse.json(tokens, { headers: OAUTH_NO_STORE_HEADERS });
  } catch (error) {
    return oauthErrorResponse(error);
  }
}
