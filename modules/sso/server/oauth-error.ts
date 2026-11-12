import { NextResponse } from "next/server";

export type OAuthErrorCode =
  | "invalid_request"
  | "invalid_client"
  | "invalid_grant"
  | "unauthorized_client"
  | "unsupported_grant_type"
  | "unsupported_response_type"
  | "access_denied"
  | "invalid_token"
  | "server_error";

/** Galat berformat OAuth 2.0 (`error` + `error_description`). */
export class OAuthError extends Error {
  constructor(
    public readonly code: OAuthErrorCode,
    description: string,
    public readonly status: number = 400,
  ) {
    super(description);
    this.name = "OAuthError";
  }
}

const NO_STORE = { "Cache-Control": "no-store", Pragma: "no-cache" };

export function oauthErrorResponse(error: unknown): NextResponse {
  // Error kontrol internal Next (mis. keluar dari prerender karena memakai cookies())
  // harus dilempar kembali, bukan dijadikan respons 500.
  if (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    typeof (error as { digest?: unknown }).digest === "string"
  ) {
    throw error;
  }

  if (error instanceof OAuthError) {
    return NextResponse.json(
      { error: error.code, error_description: error.message },
      {
        status: error.status,
        headers: {
          ...NO_STORE,
          ...(error.status === 401 && error.code === "invalid_token"
            ? { "WWW-Authenticate": 'Bearer error="invalid_token"' }
            : {}),
        },
      },
    );
  }

  console.error("[SSO Error]", error);
  return NextResponse.json(
    { error: "server_error", error_description: "Terjadi kesalahan pada server SSO." },
    { status: 500, headers: NO_STORE },
  );
}

export const OAUTH_NO_STORE_HEADERS = NO_STORE;
