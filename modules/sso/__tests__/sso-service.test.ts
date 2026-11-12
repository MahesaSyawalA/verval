// @vitest-environment node
import { createHash } from "node:crypto";
import { beforeEach, describe, expect, it } from "vitest";
import { sha256Hex } from "../server/crypto";
import { OAuthError } from "../server/oauth-error";
import {
  exchangeAuthorizationCode,
  getUserInfo,
  issueAuthorizationCode,
  listModulesForRole,
  refreshTokens,
  resolvePostLogoutRedirect,
  revokeUserSessions,
  validateAuthorizeRequest,
  type SsoDeps,
} from "../server/sso.service";
import { resetSigningKeyForTests } from "../server/keys";
import { verifyAccessToken } from "../server/tokens";
import type {
  SsoClient,
  SsoUser,
  StoredAuthCode,
  StoredRefreshToken,
} from "../types";

const ISSUER = "https://sso.test";
const REDIRECT = "https://laravel.test/callback";

const CONFIDENTIAL: SsoClient = {
  id: "db-1",
  clientId: "modul-laravel",
  name: "Modul Laravel",
  description: "Modul kelompok lain",
  launchUrl: "https://laravel.test/login/sso",
  secretHash: "hash:rahasia",
  redirectUris: [REDIRECT],
  postLogoutRedirectUris: ["https://laravel.test/"],
  allowedRoles: ["Dosen", "Kaprodi"],
  isActive: true,
};

const PUBLIC: SsoClient = {
  ...CONFIDENTIAL,
  id: "db-2",
  clientId: "modul-spa",
  name: "Modul SPA",
  secretHash: null,
  redirectUris: ["http://localhost:5173/cb"],
  allowedRoles: ["Dosen"],
};

const DOSEN: SsoUser = {
  id: "u1",
  nip: "1",
  namaLengkap: "Indira",
  email: "indira@upi.edu",
  role: "Dosen",
};

interface Store {
  clients: SsoClient[];
  users: SsoUser[];
  codes: Array<StoredAuthCode & { codeHash: string }>;
  refresh: Array<StoredRefreshToken & { tokenHash: string }>;
  now: Date;
  deps: SsoDeps;
}

function createStore(): Store {
  const store: Store = {
    clients: [CONFIDENTIAL, PUBLIC],
    users: [{ ...DOSEN }],
    codes: [],
    refresh: [],
    now: new Date("2026-11-12T10:00:00Z"),
    deps: undefined as unknown as SsoDeps,
  };
  let seq = 0;

  store.deps = {
    findClient: async (clientId) =>
      store.clients.find((c) => c.clientId === clientId) ?? null,
    listClients: async () => store.clients.filter((c) => c.isActive),
    findUser: async (id) => store.users.find((u) => u.id === id) ?? null,
    insertAuthCode: async (input) => {
      store.codes.push({
        id: `code-${++seq}`,
        codeHash: input.codeHash,
        clientDbId: input.clientDbId,
        userId: input.userId,
        redirectUri: input.redirectUri,
        codeChallenge: input.codeChallenge,
        expiresAt: input.expiresAt,
        usedAt: null,
      });
    },
    findAuthCode: async (hash) =>
      store.codes.find((c) => c.codeHash === hash) ?? null,
    markAuthCodeUsed: async (id, at) => {
      const code = store.codes.find((c) => c.id === id);
      if (!code || code.usedAt) return false;
      code.usedAt = at;
      return true;
    },
    insertRefreshToken: async (input) => {
      store.refresh.push({
        id: `rt-${++seq}`,
        tokenHash: input.tokenHash,
        clientDbId: input.clientDbId,
        userId: input.userId,
        expiresAt: input.expiresAt,
        revokedAt: null,
      });
    },
    findRefreshToken: async (hash) =>
      store.refresh.find((t) => t.tokenHash === hash) ?? null,
    rotateRefreshToken: async (oldId, next, at) => {
      const old = store.refresh.find((t) => t.id === oldId);
      if (!old || old.revokedAt) return false;
      old.revokedAt = at;
      store.refresh.push({
        id: `rt-${++seq}`,
        tokenHash: next.tokenHash,
        clientDbId: next.clientDbId,
        userId: next.userId,
        expiresAt: next.expiresAt,
        revokedAt: null,
      });
      return true;
    },
    revokeForUserClient: async (userId, clientDbId, at) => {
      for (const t of store.refresh) {
        if (t.userId === userId && t.clientDbId === clientDbId && !t.revokedAt) {
          t.revokedAt = at;
        }
      }
    },
    revokeAllForUser: async (userId, at) => {
      for (const t of store.refresh) {
        if (t.userId === userId && !t.revokedAt) t.revokedAt = at;
      }
    },
    now: () => store.now,
    compareSecret: async (plain, hash) => hash === `hash:${plain}`,
  };
  return store;
}

async function rejectionOf(promise: Promise<unknown>): Promise<OAuthError> {
  try {
    await promise;
  } catch (error) {
    expect(error).toBeInstanceOf(OAuthError);
    return error as OAuthError;
  }
  throw new Error("Seharusnya ditolak");
}

const pkce = (verifier: string) => ({
  verifier,
  challenge: createHash("sha256").update(verifier).digest("base64url"),
});

let store: Store;

beforeEach(() => {
  resetSigningKeyForTests();
  store = createStore();
});

/** Mengeluarkan kode untuk Dosen di klien rahasia, lalu mengembalikannya. */
async function issueCode(client: SsoClient = CONFIDENTIAL, challenge: string | null = null) {
  const code = await issueAuthorizationCode(
    { client, user: DOSEN, redirectUri: client.redirectUris[0], codeChallenge: challenge },
    store.deps,
  );
  expect(code).toBeTruthy();
  return code as string;
}

describe("validateAuthorizeRequest", () => {
  const base = {
    client_id: "modul-laravel",
    redirect_uri: REDIRECT,
    response_type: "code",
    state: "xyz",
  };

  it("galat fatal (tanpa redirect) untuk klien atau redirect_uri tidak sah", async () => {
    expect(await validateAuthorizeRequest({}, store.deps)).toMatchObject({ ok: false, fatal: true });
    expect(
      await validateAuthorizeRequest({ ...base, client_id: "tidak-ada" }, store.deps),
    ).toMatchObject({ ok: false, fatal: true });
    expect(
      await validateAuthorizeRequest({ ...base, redirect_uri: "https://jahat.test/cb" }, store.deps),
    ).toMatchObject({ ok: false, fatal: true });
    // Pencocokan harus persis: awalan atau path tambahan tidak boleh lolos.
    expect(
      await validateAuthorizeRequest({ ...base, redirect_uri: `${REDIRECT}/../x` }, store.deps),
    ).toMatchObject({ ok: false, fatal: true });

    store.clients = [{ ...CONFIDENTIAL, isActive: false }];
    expect(await validateAuthorizeRequest(base, store.deps)).toMatchObject({ ok: false, fatal: true });
  });

  it("galat yang boleh dialihkan: response_type dan PKCE", async () => {
    expect(
      await validateAuthorizeRequest({ ...base, response_type: "token" }, store.deps),
    ).toMatchObject({ ok: false, fatal: false, error: "unsupported_response_type", state: "xyz" });

    const { challenge } = pkce("A".repeat(43));
    expect(
      await validateAuthorizeRequest(
        { ...base, code_challenge: challenge, code_challenge_method: "plain" },
        store.deps,
      ),
    ).toMatchObject({ ok: false, fatal: false, error: "invalid_request" });

    expect(
      await validateAuthorizeRequest(
        {
          client_id: "modul-spa",
          redirect_uri: "http://localhost:5173/cb",
          response_type: "code",
        },
        store.deps,
      ),
    ).toMatchObject({ ok: false, fatal: false, error: "invalid_request" });
  });

  it("menerima permintaan sah, dengan atau tanpa PKCE", async () => {
    expect(await validateAuthorizeRequest(base, store.deps)).toMatchObject({
      ok: true,
      redirectUri: REDIRECT,
      state: "xyz",
      codeChallenge: null,
    });

    const { challenge } = pkce("A".repeat(43));
    expect(
      await validateAuthorizeRequest(
        { ...base, code_challenge: challenge, code_challenge_method: "S256" },
        store.deps,
      ),
    ).toMatchObject({ ok: true, codeChallenge: challenge });
  });
});

describe("issueAuthorizationCode", () => {
  it("menyimpan hash kode (bukan kode) dengan umur 60 detik", async () => {
    const code = await issueCode();

    expect(store.codes).toHaveLength(1);
    expect(store.codes[0].codeHash).toBe(sha256Hex(code));
    expect(JSON.stringify(store.codes)).not.toContain(code);
    expect(store.codes[0].expiresAt.getTime() - store.now.getTime()).toBe(60_000);
  });

  it("null bila role pengguna tidak diizinkan di klien itu", async () => {
    const code = await issueAuthorizationCode(
      { client: PUBLIC, user: { ...DOSEN, role: "Admin" }, redirectUri: PUBLIC.redirectUris[0], codeChallenge: "x" },
      store.deps,
    );
    expect(code).toBeNull();
    expect(store.codes).toHaveLength(0);
  });
});

describe("exchangeAuthorizationCode", () => {
  const grant = (code: string, extra = {}) => ({
    clientId: "modul-laravel",
    clientSecret: "rahasia",
    code,
    redirectUri: REDIRECT,
    ...extra,
  });

  it("menukar kode dengan access token, refresh token, dan data pengguna", async () => {
    const code = await issueCode();
    const tokens = await exchangeAuthorizationCode(grant(code), ISSUER, store.deps);

    expect(tokens).toMatchObject({
      token_type: "Bearer",
      expires_in: 900,
      user: { sub: "u1", email: "indira@upi.edu", role: "Dosen", name: "Indira", nip: "1" },
    });
    expect(await verifyAccessToken(tokens.access_token, ISSUER)).toMatchObject({ sub: "u1" });
    expect(store.refresh).toHaveLength(1);
    expect(store.refresh[0].tokenHash).toBe(sha256Hex(tokens.refresh_token));
  });

  it("kode hanya bisa dipakai sekali; pemakaian ulang mencabut token yang terbit", async () => {
    const code = await issueCode();
    await exchangeAuthorizationCode(grant(code), ISSUER, store.deps);

    const error = await rejectionOf(exchangeAuthorizationCode(grant(code), ISSUER, store.deps));
    expect(error.code).toBe("invalid_grant");
    expect(store.refresh.every((t) => t.revokedAt)).toBe(true);
  });

  it("menolak kode kedaluwarsa, redirect_uri berbeda, dan kode milik klien lain", async () => {
    const expired = await issueCode();
    store.now = new Date(store.now.getTime() + 61_000);
    expect((await rejectionOf(exchangeAuthorizationCode(grant(expired), ISSUER, store.deps))).code).toBe(
      "invalid_grant",
    );

    store.now = new Date("2026-11-12T10:00:00Z");
    const code = await issueCode();
    expect(
      (await rejectionOf(exchangeAuthorizationCode(grant(code, { redirectUri: "https://x.test/cb" }), ISSUER, store.deps))).code,
    ).toBe("invalid_grant");

    store.clients = [CONFIDENTIAL, { ...CONFIDENTIAL, id: "db-9", clientId: "modul-lain", secretHash: "hash:lain" }];
    expect(
      (await rejectionOf(exchangeAuthorizationCode(grant(code, { clientId: "modul-lain", clientSecret: "lain" }), ISSUER, store.deps))).code,
    ).toBe("invalid_grant");
  });

  it("menolak client_secret salah atau klien tidak dikenal dengan 401", async () => {
    const code = await issueCode();

    const wrongSecret = await rejectionOf(
      exchangeAuthorizationCode(grant(code, { clientSecret: "salah" }), ISSUER, store.deps),
    );
    expect(wrongSecret).toMatchObject({ code: "invalid_client", status: 401 });

    const noSecret = await rejectionOf(
      exchangeAuthorizationCode(grant(code, { clientSecret: undefined }), ISSUER, store.deps),
    );
    expect(noSecret.code).toBe("invalid_client");

    const unknown = await rejectionOf(
      exchangeAuthorizationCode(grant(code, { clientId: "hantu" }), ISSUER, store.deps),
    );
    expect(unknown.status).toBe(401);
  });

  it("PKCE: verifier benar lolos, salah atau hilang ditolak; klien publik tanpa secret", async () => {
    const { verifier, challenge } = pkce("V".repeat(50));
    const publicGrant = (code: string, extra = {}) => ({
      clientId: "modul-spa",
      code,
      redirectUri: PUBLIC.redirectUris[0],
      ...extra,
    });

    const ok = await issueCode(PUBLIC, challenge);
    expect(
      await exchangeAuthorizationCode(publicGrant(ok, { codeVerifier: verifier }), ISSUER, store.deps),
    ).toMatchObject({ token_type: "Bearer" });

    const wrong = await issueCode(PUBLIC, challenge);
    expect(
      (await rejectionOf(exchangeAuthorizationCode(publicGrant(wrong, { codeVerifier: "X".repeat(50) }), ISSUER, store.deps))).code,
    ).toBe("invalid_grant");

    const missing = await issueCode(PUBLIC, challenge);
    expect((await rejectionOf(exchangeAuthorizationCode(publicGrant(missing), ISSUER, store.deps))).code).toBe(
      "invalid_grant",
    );

    const withSecret = await issueCode(PUBLIC, challenge);
    expect(
      (await rejectionOf(exchangeAuthorizationCode(publicGrant(withSecret, { clientSecret: "x", codeVerifier: verifier }), ISSUER, store.deps))).code,
    ).toBe("invalid_client");
  });

  it("menolak bila role pengguna berubah dan tidak lagi diizinkan setelah kode terbit", async () => {
    const code = await issueCode();
    store.users[0].role = "Admin";

    expect((await rejectionOf(exchangeAuthorizationCode(grant(code), ISSUER, store.deps))).code).toBe(
      "invalid_grant",
    );
  });

  it("meminta code dan redirect_uri", async () => {
    const error = await rejectionOf(
      exchangeAuthorizationCode({ clientId: "modul-laravel", clientSecret: "rahasia" }, ISSUER, store.deps),
    );
    expect(error.code).toBe("invalid_request");
  });
});

describe("refreshTokens", () => {
  async function loginTokens() {
    const code = await issueCode();
    return exchangeAuthorizationCode(
      { clientId: "modul-laravel", clientSecret: "rahasia", code, redirectUri: REDIRECT },
      ISSUER,
      store.deps,
    );
  }
  const refreshInput = (token: string, extra = {}) => ({
    clientId: "modul-laravel",
    clientSecret: "rahasia",
    refreshToken: token,
    ...extra,
  });

  it("merotasi refresh token: yang lama dicabut, yang baru diterbitkan", async () => {
    const first = await loginTokens();
    const second = await refreshTokens(refreshInput(first.refresh_token), ISSUER, store.deps);

    expect(second.refresh_token).not.toBe(first.refresh_token);
    expect(await verifyAccessToken(second.access_token, ISSUER)).toMatchObject({ sub: "u1" });
    expect(store.refresh.filter((t) => !t.revokedAt)).toHaveLength(1);
  });

  it("pemakaian ulang token lama mencabut seluruh rantai", async () => {
    const first = await loginTokens();
    const second = await refreshTokens(refreshInput(first.refresh_token), ISSUER, store.deps);

    const error = await rejectionOf(refreshTokens(refreshInput(first.refresh_token), ISSUER, store.deps));
    expect(error.code).toBe("invalid_grant");
    expect(store.refresh.every((t) => t.revokedAt)).toBe(true);

    const afterReuse = await rejectionOf(refreshTokens(refreshInput(second.refresh_token), ISSUER, store.deps));
    expect(afterReuse.code).toBe("invalid_grant");
  });

  it("menolak token kedaluwarsa, milik klien lain, dan pengguna yang sudah dihapus", async () => {
    const tokens = await loginTokens();

    store.clients = [CONFIDENTIAL, { ...CONFIDENTIAL, id: "db-9", clientId: "modul-lain", secretHash: "hash:lain" }];
    expect(
      (await rejectionOf(refreshTokens(refreshInput(tokens.refresh_token, { clientId: "modul-lain", clientSecret: "lain" }), ISSUER, store.deps))).code,
    ).toBe("invalid_grant");

    store.users = [];
    expect((await rejectionOf(refreshTokens(refreshInput(tokens.refresh_token), ISSUER, store.deps))).code).toBe(
      "invalid_grant",
    );
    expect(store.refresh.every((t) => t.revokedAt)).toBe(true);
  });

  it("menolak refresh token kedaluwarsa (30 hari)", async () => {
    const tokens = await loginTokens();
    store.now = new Date(store.now.getTime() + 31 * 24 * 3600 * 1000);

    expect((await rejectionOf(refreshTokens(refreshInput(tokens.refresh_token), ISSUER, store.deps))).code).toBe(
      "invalid_grant",
    );
  });
});

describe("getUserInfo", () => {
  async function accessToken() {
    const code = await issueCode();
    const tokens = await exchangeAuthorizationCode(
      { clientId: "modul-laravel", clientSecret: "rahasia", code, redirectUri: REDIRECT },
      ISSUER,
      store.deps,
    );
    return tokens.access_token;
  }

  it("mengembalikan data terbaru pengguna, bukan isi token lama", async () => {
    const token = await accessToken();
    store.users[0].namaLengkap = "Indira Baru";

    expect(await getUserInfo(token, ISSUER, store.deps)).toMatchObject({ sub: "u1", name: "Indira Baru" });
  });

  it("401 invalid_token untuk token kosong, rusak, atau pengguna yang sudah dihapus", async () => {
    for (const bad of [null, "sampah"]) {
      const error = await rejectionOf(getUserInfo(bad, ISSUER, store.deps));
      expect(error).toMatchObject({ code: "invalid_token", status: 401 });
    }

    const token = await accessToken();
    store.users = [];
    expect((await rejectionOf(getUserInfo(token, ISSUER, store.deps))).status).toBe(401);
  });
});

describe("logout dan menu", () => {
  it("resolvePostLogoutRedirect hanya menerima URI terdaftar milik klien aktif", async () => {
    expect(await resolvePostLogoutRedirect("modul-laravel", "https://laravel.test/", store.deps)).toBe(
      "https://laravel.test/",
    );
    expect(await resolvePostLogoutRedirect("modul-laravel", "https://jahat.test/", store.deps)).toBeNull();
    expect(await resolvePostLogoutRedirect("hantu", "https://laravel.test/", store.deps)).toBeNull();
    expect(await resolvePostLogoutRedirect(undefined, undefined, store.deps)).toBeNull();

    store.clients = [{ ...CONFIDENTIAL, isActive: false }];
    expect(await resolvePostLogoutRedirect("modul-laravel", "https://laravel.test/", store.deps)).toBeNull();
  });

  it("revokeUserSessions mencabut semua refresh token pengguna di semua klien", async () => {
    const code = await issueCode();
    await exchangeAuthorizationCode(
      { clientId: "modul-laravel", clientSecret: "rahasia", code, redirectUri: REDIRECT },
      ISSUER,
      store.deps,
    );
    expect(store.refresh.some((t) => !t.revokedAt)).toBe(true);

    await revokeUserSessions("u1", store.deps);
    expect(store.refresh.every((t) => t.revokedAt)).toBe(true);
  });

  it("listModulesForRole hanya menampilkan klien aktif yang mengizinkan role itu", async () => {
    expect((await listModulesForRole("Dosen", store.deps)).map((m) => m.id)).toEqual([
      "modul-laravel",
      "modul-spa",
    ]);
    expect((await listModulesForRole("Kaprodi", store.deps)).map((m) => m.id)).toEqual(["modul-laravel"]);
    expect(await listModulesForRole("Admin", store.deps)).toEqual([]);

    store.clients = [{ ...CONFIDENTIAL, isActive: false }];
    expect(await listModulesForRole("Dosen", store.deps)).toEqual([]);

    const [first] = await listModulesForRole("Dosen", { ...store.deps, listClients: async () => [CONFIDENTIAL] });
    expect(first).toMatchObject({ url: "https://laravel.test/login/sso", external: true });
  });
});
