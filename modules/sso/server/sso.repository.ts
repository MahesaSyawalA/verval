import type { UserRole } from "@/config/roles";
import prisma from "@/lib/db";
import type {
  SsoClient,
  SsoUser,
  StoredAuthCode,
  StoredRefreshToken,
} from "../types";

function toStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function mapClient(row: {
  id: string;
  client_id: string;
  name: string;
  description: string | null;
  launch_url: string;
  client_secret_hash: string | null;
  redirect_uris: unknown;
  post_logout_redirect_uris: unknown;
  allowed_roles: unknown;
  is_active: boolean;
  created_at?: Date;
}): SsoClient {
  return {
    id: row.id,
    clientId: row.client_id,
    name: row.name,
    description: row.description,
    launchUrl: row.launch_url,
    secretHash: row.client_secret_hash,
    redirectUris: toStringArray(row.redirect_uris),
    postLogoutRedirectUris: toStringArray(row.post_logout_redirect_uris),
    allowedRoles: toStringArray(row.allowed_roles),
    isActive: row.is_active,
    createdAt: row.created_at,
  };
}

export async function findClientByClientId(
  clientId: string,
): Promise<SsoClient | null> {
  const row = await prisma.sso_clients.findUnique({
    where: { client_id: clientId },
  });
  return row ? mapClient(row) : null;
}

export async function findClientById(id: string): Promise<SsoClient | null> {
  const row = await prisma.sso_clients.findUnique({
    where: { id },
  });
  return row ? mapClient(row) : null;
}

export async function listActiveClients(): Promise<SsoClient[]> {
  const rows = await prisma.sso_clients.findMany({
    where: { is_active: true },
    orderBy: { name: "asc" },
  });
  return rows.map(mapClient);
}

export async function listAllClients(): Promise<SsoClient[]> {
  const rows = await prisma.sso_clients.findMany({
    orderBy: { created_at: "desc" },
  });
  return rows.map(mapClient);
}

export async function createSsoClient(input: {
  clientId: string;
  name: string;
  description: string | null;
  launchUrl: string;
  secretHash: string | null;
  redirectUris: string[];
  postLogoutRedirectUris: string[];
  allowedRoles: string[];
}): Promise<SsoClient> {
  const row = await prisma.sso_clients.create({
    data: {
      client_id: input.clientId,
      name: input.name,
      description: input.description,
      launch_url: input.launchUrl,
      client_secret_hash: input.secretHash,
      redirect_uris: input.redirectUris,
      post_logout_redirect_uris: input.postLogoutRedirectUris,
      allowed_roles: input.allowedRoles,
    },
  });
  return mapClient(row);
}

export async function updateSsoClient(
  id: string,
  input: {
    name?: string;
    description?: string | null;
    launchUrl?: string;
    redirectUris?: string[];
    postLogoutRedirectUris?: string[];
    allowedRoles?: string[];
    isActive?: boolean;
  },
): Promise<SsoClient> {
  const row = await prisma.sso_clients.update({
    where: { id },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.launchUrl !== undefined ? { launch_url: input.launchUrl } : {}),
      ...(input.redirectUris !== undefined ? { redirect_uris: input.redirectUris } : {}),
      ...(input.postLogoutRedirectUris !== undefined
        ? { post_logout_redirect_uris: input.postLogoutRedirectUris }
        : {}),
      ...(input.allowedRoles !== undefined ? { allowed_roles: input.allowedRoles } : {}),
      ...(input.isActive !== undefined ? { is_active: input.isActive } : {}),
    },
  });
  return mapClient(row);
}

export async function updateSsoClientSecret(
  id: string,
  secretHash: string,
): Promise<SsoClient> {
  const row = await prisma.sso_clients.update({
    where: { id },
    data: { client_secret_hash: secretHash },
  });
  return mapClient(row);
}

export async function revokeAllRefreshTokensForClient(
  clientDbId: string,
  at: Date,
): Promise<void> {
  await prisma.sso_refresh_tokens.updateMany({
    where: { client_id: clientDbId, revoked_at: null },
    data: { revoked_at: at },
  });
}

export async function findSsoUserById(id: string): Promise<SsoUser | null> {
  const row = await prisma.users.findUnique({ where: { id } });
  return row
    ? {
        id: row.id,
        nip: row.nip,
        namaLengkap: row.nama_lengkap,
        email: row.email,
        role: row.role as UserRole,
      }
    : null;
}

export async function insertAuthCode(input: {
  codeHash: string;
  clientDbId: string;
  userId: string;
  redirectUri: string;
  codeChallenge: string | null;
  expiresAt: Date;
}): Promise<void> {
  await prisma.sso_auth_codes.create({
    data: {
      code_hash: input.codeHash,
      client_id: input.clientDbId,
      user_id: input.userId,
      redirect_uri: input.redirectUri,
      code_challenge: input.codeChallenge,
      expires_at: input.expiresAt,
    },
  });
}

export async function findAuthCodeByHash(
  codeHash: string,
): Promise<StoredAuthCode | null> {
  const row = await prisma.sso_auth_codes.findUnique({
    where: { code_hash: codeHash },
  });
  return row
    ? {
        id: row.id,
        clientDbId: row.client_id,
        userId: row.user_id,
        redirectUri: row.redirect_uri,
        codeChallenge: row.code_challenge,
        expiresAt: row.expires_at,
        usedAt: row.used_at,
      }
    : null;
}

/** Atomik: hanya satu penukar yang menang walau ada dua permintaan bersamaan. */
export async function markAuthCodeUsed(id: string, at: Date): Promise<boolean> {
  const result = await prisma.sso_auth_codes.updateMany({
    where: { id, used_at: null },
    data: { used_at: at },
  });
  return result.count === 1;
}

export async function insertRefreshToken(input: {
  tokenHash: string;
  clientDbId: string;
  userId: string;
  expiresAt: Date;
}): Promise<void> {
  await prisma.sso_refresh_tokens.create({
    data: {
      token_hash: input.tokenHash,
      client_id: input.clientDbId,
      user_id: input.userId,
      expires_at: input.expiresAt,
    },
  });
}

export async function findRefreshTokenByHash(
  tokenHash: string,
): Promise<StoredRefreshToken | null> {
  const row = await prisma.sso_refresh_tokens.findUnique({
    where: { token_hash: tokenHash },
  });
  return row
    ? {
        id: row.id,
        clientDbId: row.client_id,
        userId: row.user_id,
        expiresAt: row.expires_at,
        revokedAt: row.revoked_at,
      }
    : null;
}

/** Cabut token lama dan terbitkan yang baru dalam satu transaksi; false bila sudah dicabut. */
export async function rotateRefreshToken(
  oldId: string,
  next: {
    tokenHash: string;
    clientDbId: string;
    userId: string;
    expiresAt: Date;
  },
  at: Date,
): Promise<boolean> {
  return prisma.$transaction(async (tx) => {
    const revoked = await tx.sso_refresh_tokens.updateMany({
      where: { id: oldId, revoked_at: null },
      data: { revoked_at: at },
    });
    if (revoked.count !== 1) return false;

    await tx.sso_refresh_tokens.create({
      data: {
        token_hash: next.tokenHash,
        client_id: next.clientDbId,
        user_id: next.userId,
        expires_at: next.expiresAt,
      },
    });
    return true;
  });
}

export async function revokeRefreshTokensForUserClient(
  userId: string,
  clientDbId: string,
  at: Date,
): Promise<void> {
  await prisma.sso_refresh_tokens.updateMany({
    where: { user_id: userId, client_id: clientDbId, revoked_at: null },
    data: { revoked_at: at },
  });
}

export async function revokeAllRefreshTokensForUser(
  userId: string,
  at: Date,
): Promise<void> {
  await prisma.sso_refresh_tokens.updateMany({
    where: { user_id: userId, revoked_at: null },
    data: { revoked_at: at },
  });
}
