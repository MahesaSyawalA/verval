// @vitest-environment node
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { OAuthError } from "../server/oauth-error";
import type { SsoClient } from "../types";

const { getServerSession, service } = vi.hoisted(() => ({
  getServerSession: vi.fn(),
  service: {
    validateAuthorizeRequest: vi.fn(),
    issueAuthorizationCode: vi.fn(),
    exchangeAuthorizationCode: vi.fn(),
    refreshTokens: vi.fn(),
    getUserInfo: vi.fn(),
    revokeUserSessions: vi.fn(),
    resolvePostLogoutRedirect: vi.fn(),
  },
}));

vi.mock("@/lib/session", () => ({
  getServerSession: (...a: unknown[]) => getServerSession(...a),
  getSessionCookieOptions: (maxAge = 0) => ({
    name: "nodecraft_rpl_session",
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    path: "/",
    maxAge,
  }),
}));

vi.mock("../server/sso.service", () => service);

// connection() hanya valid di dalam request Next; di test cukup dilewati.
vi.mock("next/server", async (importOriginal) => ({
  ...(await importOriginal<typeof import("next/server")>()),
  connection: async () => {},
}));

import { GET as authorizeGET } from "@/app/api/sso/authorize/route";
import { GET as jwksGET } from "@/app/api/sso/jwks/route";
import { GET as logoutGET } from "@/app/api/sso/logout/route";
import { POST as tokenPOST } from "@/app/api/sso/token/route";
import { GET as userinfoGET } from "@/app/api/sso/userinfo/route";

const ORIGIN = "https://sso.test";
const CLIENT = { id: "db-1", clientId: "modul-laravel" } as SsoClient;
const SESSION = {
  id: "u1",
  nip: "1",
  namaLengkap: "Indira",
  email: "indira@upi.edu",
  role: "Dosen",
};

beforeEach(() => {
  getServerSession.mockReset();
  for (const fn of Object.values(service)) fn.mockReset();
});

describe("GET /api/sso/authorize", () => {
  const url = `${ORIGIN}/api/sso/authorize?client_id=modul-laravel&redirect_uri=https%3A%2F%2Flaravel.test%2Fcb&response_type=code&state=xyz`;
  const valid = {
    ok: true,
    client: CLIENT,
    redirectUri: "https://laravel.test/cb",
    state: "xyz",
    codeChallenge: null,
  };

  it("galat fatal: 400 JSON dan tidak pernah redirect", async () => {
    service.validateAuthorizeRequest.mockResolvedValue({
      ok: false,
      fatal: true,
      description: "redirect_uri tidak terdaftar untuk klien ini.",
    });

    const res = await authorizeGET(new NextRequest(url));

    expect(res.status).toBe(400);
    expect(res.headers.get("location")).toBeNull();
    expect(await res.json()).toMatchObject({ error: "invalid_request" });
    expect(getServerSession).not.toHaveBeenCalled();
  });

  it("galat yang boleh dialihkan: kembali ke redirect_uri dengan error dan state", async () => {
    service.validateAuthorizeRequest.mockResolvedValue({
      ok: false,
      fatal: false,
      redirectUri: "https://laravel.test/cb",
      state: "xyz",
      error: "invalid_request",
      description: "PKCE wajib",
    });

    const res = await authorizeGET(new NextRequest(url));
    const location = new URL(res.headers.get("location") as string);

    expect(res.status).toBe(302);
    expect(location.origin + location.pathname).toBe("https://laravel.test/cb");
    expect(location.searchParams.get("error")).toBe("invalid_request");
    expect(location.searchParams.get("state")).toBe("xyz");
  });

  it("belum login SSO: ke /login dengan next menunjuk permintaan semula", async () => {
    service.validateAuthorizeRequest.mockResolvedValue(valid);
    getServerSession.mockResolvedValue(null);

    const res = await authorizeGET(new NextRequest(url));
    const location = new URL(res.headers.get("location") as string);

    expect(res.status).toBe(302);
    expect(location.pathname).toBe("/login");
    expect(location.searchParams.get("next")).toBe(
      `/api/sso/authorize?client_id=modul-laravel&redirect_uri=https%3A%2F%2Flaravel.test%2Fcb&response_type=code&state=xyz`,
    );
    expect(service.issueAuthorizationCode).not.toHaveBeenCalled();
  });

  it("sudah login: redirect ke modul membawa code dan state", async () => {
    service.validateAuthorizeRequest.mockResolvedValue(valid);
    service.issueAuthorizationCode.mockResolvedValue("kode-123");
    getServerSession.mockResolvedValue(SESSION);

    const res = await authorizeGET(new NextRequest(url));
    const location = new URL(res.headers.get("location") as string);

    expect(location.origin + location.pathname).toBe("https://laravel.test/cb");
    expect(location.searchParams.get("code")).toBe("kode-123");
    expect(location.searchParams.get("state")).toBe("xyz");
    expect(res.headers.get("cache-control")).toBe("no-store");
    expect(service.issueAuthorizationCode).toHaveBeenCalledWith(
      expect.objectContaining({ redirectUri: "https://laravel.test/cb", user: expect.objectContaining({ id: "u1" }) }),
    );
  });

  it("role tidak diizinkan: access_denied dialihkan balik dengan state", async () => {
    service.validateAuthorizeRequest.mockResolvedValue(valid);
    service.issueAuthorizationCode.mockResolvedValue(null);
    getServerSession.mockResolvedValue(SESSION);

    const res = await authorizeGET(new NextRequest(url));
    const location = new URL(res.headers.get("location") as string);

    expect(location.searchParams.get("error")).toBe("access_denied");
    expect(location.searchParams.get("state")).toBe("xyz");
    expect(location.searchParams.get("code")).toBeNull();
  });
});

describe("POST /api/sso/token", () => {
  const tokens = { access_token: "a", token_type: "Bearer", expires_in: 900, refresh_token: "r", user: {} };

  function form(fields: Record<string, string>, headers: Record<string, string> = {}) {
    return new NextRequest(`${ORIGIN}/api/sso/token`, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded", ...headers },
      body: new URLSearchParams(fields).toString(),
    });
  }

  it("authorization_code (form): meneruskan parameter dan mengembalikan token tanpa cache", async () => {
    service.exchangeAuthorizationCode.mockResolvedValue(tokens);

    const res = await tokenPOST(
      form({
        grant_type: "authorization_code",
        client_id: "modul-laravel",
        client_secret: "rahasia",
        code: "kode",
        redirect_uri: "https://laravel.test/cb",
        code_verifier: "ver",
      }),
    );

    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toBe("no-store");
    expect(await res.json()).toMatchObject({ access_token: "a", token_type: "Bearer" });
    expect(service.exchangeAuthorizationCode).toHaveBeenCalledWith(
      {
        clientId: "modul-laravel",
        clientSecret: "rahasia",
        code: "kode",
        redirectUri: "https://laravel.test/cb",
        codeVerifier: "ver",
      },
      ORIGIN,
    );
  });

  it("kredensial klien lewat header Basic (di-URL-decode)", async () => {
    service.exchangeAuthorizationCode.mockResolvedValue(tokens);
    const basic = Buffer.from(`modul-laravel:${encodeURIComponent("ra:hasia/+")}`).toString("base64");

    await tokenPOST(
      form(
        { grant_type: "authorization_code", code: "k", redirect_uri: "https://laravel.test/cb" },
        { authorization: `Basic ${basic}` },
      ),
    );

    expect(service.exchangeAuthorizationCode).toHaveBeenCalledWith(
      expect.objectContaining({ clientId: "modul-laravel", clientSecret: "ra:hasia/+" }),
      ORIGIN,
    );
  });

  it("refresh_token dengan body JSON", async () => {
    service.refreshTokens.mockResolvedValue(tokens);

    const res = await tokenPOST(
      new NextRequest(`${ORIGIN}/api/sso/token`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          grant_type: "refresh_token",
          client_id: "modul-laravel",
          client_secret: "rahasia",
          refresh_token: "rt",
        }),
      }),
    );

    expect(res.status).toBe(200);
    expect(service.refreshTokens).toHaveBeenCalledWith(
      { clientId: "modul-laravel", clientSecret: "rahasia", refreshToken: "rt" },
      ORIGIN,
    );
  });

  it("grant_type tidak didukung: 400 unsupported_grant_type", async () => {
    const res = await tokenPOST(form({ grant_type: "password" }));

    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({ error: "unsupported_grant_type" });
  });

  it("meneruskan OAuthError dari service dengan status dan bentuk standar", async () => {
    service.exchangeAuthorizationCode.mockRejectedValue(
      new OAuthError("invalid_client", "client_secret salah.", 401),
    );

    const res = await tokenPOST(form({ grant_type: "authorization_code" }));

    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({
      error: "invalid_client",
      error_description: "client_secret salah.",
    });
  });

  it("galat tak terduga menjadi 500 server_error tanpa membocorkan detail", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    service.exchangeAuthorizationCode.mockRejectedValue(new Error("DB meledak: password=rahasia"));

    const res = await tokenPOST(form({ grant_type: "authorization_code" }));
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBe("server_error");
    expect(JSON.stringify(body)).not.toContain("rahasia");
    spy.mockRestore();
  });
});

describe("GET /api/sso/userinfo", () => {
  it("mengekstrak bearer token dan mengembalikan data pengguna", async () => {
    service.getUserInfo.mockResolvedValue({ sub: "u1", role: "Dosen" });

    const res = await userinfoGET(
      new NextRequest(`${ORIGIN}/api/sso/userinfo`, { headers: { authorization: "Bearer abc.def.ghi" } }),
    );

    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ sub: "u1" });
    expect(service.getUserInfo).toHaveBeenCalledWith("abc.def.ghi", ORIGIN);
  });

  it("tanpa header Authorization: token null, 401 dengan WWW-Authenticate", async () => {
    service.getUserInfo.mockRejectedValue(new OAuthError("invalid_token", "Access token tidak valid.", 401));

    const res = await userinfoGET(new NextRequest(`${ORIGIN}/api/sso/userinfo`));

    expect(service.getUserInfo).toHaveBeenCalledWith(null, ORIGIN);
    expect(res.status).toBe(401);
    expect(res.headers.get("www-authenticate")).toContain("invalid_token");
  });
});

describe("GET /api/sso/jwks", () => {
  it("menyajikan kunci publik saja", async () => {
    const res = await jwksGET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toContain("max-age");
    expect(body.keys).toHaveLength(1);
    expect(body.keys[0]).toMatchObject({ kty: "RSA", alg: "RS256", use: "sig" });
    expect(body.keys[0].kid).toBeTruthy();
    expect(body.keys[0]).not.toHaveProperty("d");
  });
});

describe("GET /api/sso/logout", () => {
  it("mencabut token, menghapus cookie, dan kembali ke URI terdaftar dengan state", async () => {
    getServerSession.mockResolvedValue(SESSION);
    service.resolvePostLogoutRedirect.mockResolvedValue("https://laravel.test/");

    const res = await logoutGET(
      new NextRequest(
        `${ORIGIN}/api/sso/logout?client_id=modul-laravel&post_logout_redirect_uri=https%3A%2F%2Flaravel.test%2F&state=s1`,
      ),
    );
    const location = new URL(res.headers.get("location") as string);

    expect(service.revokeUserSessions).toHaveBeenCalledWith("u1");
    expect(location.origin + location.pathname).toBe("https://laravel.test/");
    expect(location.searchParams.get("state")).toBe("s1");
    const cookie = res.headers.get("set-cookie") ?? "";
    expect(cookie).toContain("nodecraft_rpl_session=;");
    expect(cookie.toLowerCase()).toContain("max-age=0");
  });

  it("URI tidak terdaftar: jatuh ke /login, dan tetap aman tanpa sesi", async () => {
    getServerSession.mockResolvedValue(null);
    service.resolvePostLogoutRedirect.mockResolvedValue(null);

    const res = await logoutGET(
      new NextRequest(`${ORIGIN}/api/sso/logout?client_id=x&post_logout_redirect_uri=https%3A%2F%2Fjahat.test%2F`),
    );

    expect(service.revokeUserSessions).not.toHaveBeenCalled();
    expect(new URL(res.headers.get("location") as string).pathname).toBe("/login");
  });
});
