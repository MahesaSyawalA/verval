import bcrypt from "bcryptjs";
import type {
  LaunchableModule,
  SsoClient,
  SsoUser,
  TokenResponse,
  UserInfo,
} from "../types";
import {
  isValidCodeChallenge,
  randomToken,
  sha256Hex,
  verifyPkceS256,
} from "./crypto";
import { OAuthError } from "./oauth-error";
import {
  findAuthCodeByHash,
  findClientByClientId,
  findRefreshTokenByHash,
  findSsoUserById,
  insertAuthCode,
  insertRefreshToken,
  listActiveClients,
  markAuthCodeUsed,
  revokeAllRefreshTokensForUser,
  revokeRefreshTokensForUserClient,
  rotateRefreshToken,
} from "./sso.repository";
import {
  ACCESS_TOKEN_TTL_SECONDS,
  AUTH_CODE_TTL_SECONDS,
  REFRESH_TOKEN_TTL_SECONDS,
  signAccessToken,
  verifyAccessToken,
} from "./tokens";

export interface SsoDeps {
  findClient: typeof findClientByClientId;
  listClients: typeof listActiveClients;
  findUser: typeof findSsoUserById;
  insertAuthCode: typeof insertAuthCode;
  findAuthCode: typeof findAuthCodeByHash;
  markAuthCodeUsed: typeof markAuthCodeUsed;
  insertRefreshToken: typeof insertRefreshToken;
  findRefreshToken: typeof findRefreshTokenByHash;
  rotateRefreshToken: typeof rotateRefreshToken;
  revokeForUserClient: typeof revokeRefreshTokensForUserClient;
  revokeAllForUser: typeof revokeAllRefreshTokensForUser;
  now: () => Date;
  compareSecret: (plain: string, hash: string) => Promise<boolean>;
}

const defaultDeps: SsoDeps = {
  findClient: findClientByClientId,
  listClients: listActiveClients,
  findUser: findSsoUserById,
  insertAuthCode,
  findAuthCode: findAuthCodeByHash,
  markAuthCodeUsed,
  insertRefreshToken,
  findRefreshToken: findRefreshTokenByHash,
  rotateRefreshToken,
  revokeForUserClient: revokeRefreshTokensForUserClient,
  revokeAllForUser: revokeAllRefreshTokensForUser,
  now: () => new Date(),
  compareSecret: (plain, hash) => bcrypt.compare(plain, hash),
};

const addSeconds = (date: Date, seconds: number) =>
  new Date(date.getTime() + seconds * 1000);

/* ---------------------------- /authorize ---------------------------- */

export interface AuthorizeParams {
  client_id?: string;
  redirect_uri?: string;
  response_type?: string;
  state?: string;
  code_challenge?: string;
  code_challenge_method?: string;
}

export type AuthorizeCheck =
  | { ok: true; client: SsoClient; redirectUri: string; state?: string; codeChallenge: string | null }
  /** Klien atau redirect_uri tidak sah: JANGAN redirect, tampilkan galat. */
  | { ok: false; fatal: true; description: string }
  /** Galat yang aman dikirim balik ke redirect_uri yang sudah terdaftar. */
  | { ok: false; fatal: false; redirectUri: string; state?: string; error: string; description: string };

export async function validateAuthorizeRequest(
  params: AuthorizeParams,
  deps: SsoDeps = defaultDeps,
): Promise<AuthorizeCheck> {
  if (!params.client_id || !params.redirect_uri) {
    return { ok: false, fatal: true, description: "client_id dan redirect_uri wajib diisi." };
  }

  const client = await deps.findClient(params.client_id);
  if (!client || !client.isActive) {
    return { ok: false, fatal: true, description: "client_id tidak dikenal atau tidak aktif." };
  }
  // Pencocokan persis; tanpa wildcard agar tidak jadi open redirect.
  if (!client.redirectUris.includes(params.redirect_uri)) {
    return { ok: false, fatal: true, description: "redirect_uri tidak terdaftar untuk klien ini." };
  }

  const redirectError = (error: string, description: string): AuthorizeCheck => ({
    ok: false,
    fatal: false,
    redirectUri: params.redirect_uri as string,
    state: params.state,
    error,
    description,
  });

  if (params.response_type !== "code") {
    return redirectError("unsupported_response_type", "response_type harus 'code'.");
  }

  const challenge = params.code_challenge ?? null;
  if (challenge) {
    if (params.code_challenge_method !== "S256") {
      return redirectError("invalid_request", "code_challenge_method harus 'S256'.");
    }
    if (!isValidCodeChallenge(challenge)) {
      return redirectError("invalid_request", "code_challenge tidak valid.");
    }
  } else if (!client.secretHash) {
    return redirectError("invalid_request", "Klien publik wajib memakai PKCE (code_challenge).");
  }

  return { ok: true, client, redirectUri: params.redirect_uri, state: params.state, codeChallenge: challenge };
}

/** Terbitkan kode otorisasi untuk pengguna yang sudah login; null bila role tidak diizinkan. */
export async function issueAuthorizationCode(
  input: {
    client: SsoClient;
    user: SsoUser;
    redirectUri: string;
    codeChallenge: string | null;
  },
  deps: SsoDeps = defaultDeps,
): Promise<string | null> {
  if (!input.client.allowedRoles.includes(input.user.role)) return null;

  const code = randomToken();
  await deps.insertAuthCode({
    codeHash: sha256Hex(code),
    clientDbId: input.client.id,
    userId: input.user.id,
    redirectUri: input.redirectUri,
    codeChallenge: input.codeChallenge,
    expiresAt: addSeconds(deps.now(), AUTH_CODE_TTL_SECONDS),
  });
  return code;
}

/* ------------------------------ /token ------------------------------ */

async function authenticateClient(
  clientId: string | undefined,
  clientSecret: string | undefined,
  deps: SsoDeps,
): Promise<SsoClient> {
  const client = clientId ? await deps.findClient(clientId) : null;
  if (!client || !client.isActive) {
    throw new OAuthError("invalid_client", "Klien tidak dikenal atau tidak aktif.", 401);
  }

  if (client.secretHash) {
    const valid = clientSecret
      ? await deps.compareSecret(clientSecret, client.secretHash)
      : false;
    if (!valid) {
      throw new OAuthError("invalid_client", "client_secret salah.", 401);
    }
  } else if (clientSecret) {
    throw new OAuthError("invalid_client", "Klien publik tidak memakai client_secret.", 401);
  }

  return client;
}

async function buildTokenResponse(
  user: SsoUser,
  client: SsoClient,
  issuer: string,
  refreshToken: string,
): Promise<TokenResponse> {
  return {
    access_token: await signAccessToken(user, client.clientId, issuer),
    token_type: "Bearer",
    expires_in: ACCESS_TOKEN_TTL_SECONDS,
    refresh_token: refreshToken,
    user: {
      sub: user.id,
      name: user.namaLengkap,
      email: user.email,
      nip: user.nip,
      role: user.role,
    },
  };
}

export interface CodeGrantInput {
  clientId?: string;
  clientSecret?: string;
  code?: string;
  redirectUri?: string;
  codeVerifier?: string;
}

export async function exchangeAuthorizationCode(
  input: CodeGrantInput,
  issuer: string,
  deps: SsoDeps = defaultDeps,
): Promise<TokenResponse> {
  const client = await authenticateClient(input.clientId, input.clientSecret, deps);
  if (!input.code || !input.redirectUri) {
    throw new OAuthError("invalid_request", "code dan redirect_uri wajib diisi.");
  }

  const record = await deps.findAuthCode(sha256Hex(input.code));
  if (!record || record.clientDbId !== client.id) {
    throw new OAuthError("invalid_grant", "Kode tidak valid.");
  }

  const now = deps.now();

  if (record.usedAt) {
    // Kode dipakai ulang: anggap bocor dan cabut token yang sudah terbit darinya.
    await deps.revokeForUserClient(record.userId, client.id, now);
    throw new OAuthError("invalid_grant", "Kode sudah dipakai.");
  }
  if (record.expiresAt <= now) {
    throw new OAuthError("invalid_grant", "Kode sudah kedaluwarsa.");
  }
  if (record.redirectUri !== input.redirectUri) {
    throw new OAuthError("invalid_grant", "redirect_uri tidak sama dengan saat otorisasi.");
  }
  if (record.codeChallenge) {
    if (!input.codeVerifier || !verifyPkceS256(input.codeVerifier, record.codeChallenge)) {
      throw new OAuthError("invalid_grant", "code_verifier tidak cocok.");
    }
  }

  if (!(await deps.markAuthCodeUsed(record.id, now))) {
    throw new OAuthError("invalid_grant", "Kode sudah dipakai.");
  }

  const user = await deps.findUser(record.userId);
  if (!user || !client.allowedRoles.includes(user.role)) {
    throw new OAuthError("invalid_grant", "Pengguna tidak lagi berhak mengakses klien ini.");
  }

  const refreshToken = randomToken();
  await deps.insertRefreshToken({
    tokenHash: sha256Hex(refreshToken),
    clientDbId: client.id,
    userId: user.id,
    expiresAt: addSeconds(now, REFRESH_TOKEN_TTL_SECONDS),
  });

  return buildTokenResponse(user, client, issuer, refreshToken);
}

export interface RefreshGrantInput {
  clientId?: string;
  clientSecret?: string;
  refreshToken?: string;
}

export async function refreshTokens(
  input: RefreshGrantInput,
  issuer: string,
  deps: SsoDeps = defaultDeps,
): Promise<TokenResponse> {
  const client = await authenticateClient(input.clientId, input.clientSecret, deps);
  if (!input.refreshToken) {
    throw new OAuthError("invalid_request", "refresh_token wajib diisi.");
  }

  const record = await deps.findRefreshToken(sha256Hex(input.refreshToken));
  if (!record || record.clientDbId !== client.id) {
    throw new OAuthError("invalid_grant", "Refresh token tidak valid.");
  }

  const now = deps.now();

  if (record.revokedAt) {
    // Token lama dipakai lagi: kemungkinan dicuri, batalkan seluruh rantainya.
    await deps.revokeForUserClient(record.userId, client.id, now);
    throw new OAuthError("invalid_grant", "Refresh token sudah dicabut.");
  }
  if (record.expiresAt <= now) {
    throw new OAuthError("invalid_grant", "Refresh token sudah kedaluwarsa.");
  }

  const user = await deps.findUser(record.userId);
  if (!user || !client.allowedRoles.includes(user.role)) {
    await deps.revokeForUserClient(record.userId, client.id, now);
    throw new OAuthError("invalid_grant", "Pengguna tidak lagi berhak mengakses klien ini.");
  }

  const nextRefreshToken = randomToken();
  const rotated = await deps.rotateRefreshToken(
    record.id,
    {
      tokenHash: sha256Hex(nextRefreshToken),
      clientDbId: client.id,
      userId: user.id,
      expiresAt: addSeconds(now, REFRESH_TOKEN_TTL_SECONDS),
    },
    now,
  );
  if (!rotated) {
    throw new OAuthError("invalid_grant", "Refresh token sudah dipakai.");
  }

  return buildTokenResponse(user, client, issuer, nextRefreshToken);
}

/* ----------------------------- /userinfo ---------------------------- */

export async function getUserInfo(
  accessToken: string | null,
  issuer: string,
  deps: SsoDeps = defaultDeps,
): Promise<UserInfo> {
  const claims = accessToken ? await verifyAccessToken(accessToken, issuer) : null;
  if (!claims) {
    throw new OAuthError("invalid_token", "Access token tidak valid atau kedaluwarsa.", 401);
  }

  // Ambil data terbaru: role bisa berubah atau akun dihapus setelah token terbit.
  const user = await deps.findUser(claims.sub);
  if (!user) {
    throw new OAuthError("invalid_token", "Pengguna tidak ditemukan.", 401);
  }

  return {
    sub: user.id,
    name: user.namaLengkap,
    email: user.email,
    nip: user.nip,
    role: user.role,
  };
}

/* ----------------------------- /logout ------------------------------ */

export async function revokeUserSessions(
  userId: string,
  deps: SsoDeps = defaultDeps,
): Promise<void> {
  await deps.revokeAllForUser(userId, deps.now());
}

/** URL tujuan setelah logout; hanya yang terdaftar di klien yang diterima. */
export async function resolvePostLogoutRedirect(
  clientId: string | undefined,
  redirectUri: string | undefined,
  deps: SsoDeps = defaultDeps,
): Promise<string | null> {
  if (!clientId || !redirectUri) return null;
  const client = await deps.findClient(clientId);
  return client?.isActive && client.postLogoutRedirectUris.includes(redirectUri)
    ? redirectUri
    : null;
}

/* ------------------------------- Menu ------------------------------- */

export async function listModulesForRole(
  role: string,
  deps: SsoDeps = defaultDeps,
): Promise<LaunchableModule[]> {
  const clients = await deps.listClients();
  return clients
    .filter((client) => client.allowedRoles.includes(role))
    .map((client) => ({
      id: client.clientId,
      name: client.name,
      description: client.description,
      url: client.launchUrl,
      external: true,
    }));
}
