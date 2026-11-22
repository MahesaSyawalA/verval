import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import type { UserRole } from "@/config/roles";
import { AppError } from "@/lib/http";
import type {
  CreateSsoClientInput,
  UpdateSsoClientInput,
} from "../schemas/sso-client.schema";
import type {
  SsoClient,
  SsoClientAdminItem,
  SsoClientSecretPayload,
} from "../types";
import {
  createSsoClient,
  findClientByClientId,
  findClientById,
  listAllClients,
  revokeAllRefreshTokensForClient,
  updateSsoClient,
  updateSsoClientSecret,
} from "./sso.repository";

export interface SsoAdminDeps {
  listAllClients: typeof listAllClients;
  findClientById: typeof findClientById;
  findClientByClientId: typeof findClientByClientId;
  createSsoClient: typeof createSsoClient;
  updateSsoClient: typeof updateSsoClient;
  updateSsoClientSecret: typeof updateSsoClientSecret;
  revokeAllRefreshTokensForClient: typeof revokeAllRefreshTokensForClient;
  generateSecret: () => Promise<{ plain: string; hash: string }>;
  now: () => Date;
}

async function defaultGenerateSecret(): Promise<{ plain: string; hash: string }> {
  const plain = randomBytes(32).toString("base64url");
  const hash = await bcrypt.hash(plain, 10);
  return { plain, hash };
}

const defaultDeps: SsoAdminDeps = {
  listAllClients,
  findClientById,
  findClientByClientId,
  createSsoClient,
  updateSsoClient,
  updateSsoClientSecret,
  revokeAllRefreshTokensForClient,
  generateSecret: defaultGenerateSecret,
  now: () => new Date(),
};

function toAdminItem(client: SsoClient): SsoClientAdminItem {
  return {
    id: client.id,
    clientId: client.clientId,
    name: client.name,
    description: client.description,
    launchUrl: client.launchUrl,
    isPublic: client.secretHash === null,
    redirectUris: client.redirectUris,
    postLogoutRedirectUris: client.postLogoutRedirectUris,
    allowedRoles: client.allowedRoles as UserRole[],
    isActive: client.isActive,
    createdAt: (client.createdAt ?? new Date()).toISOString(),
  };
}

export async function listSsoClientsAdmin(
  deps: SsoAdminDeps = defaultDeps,
): Promise<SsoClientAdminItem[]> {
  const clients = await deps.listAllClients();
  return clients.map(toAdminItem);
}

export async function createSsoClientAdmin(
  input: CreateSsoClientInput,
  deps: SsoAdminDeps = defaultDeps,
): Promise<SsoClientSecretPayload> {
  const existing = await deps.findClientByClientId(input.clientId);
  if (existing) {
    throw new AppError(
      "CONFLICT",
      `Client ID "${input.clientId}" sudah terdaftar.`,
      409,
      { clientId: "Client ID sudah digunakan modul lain." },
    );
  }

  const secret = input.isPublic ? null : await deps.generateSecret();

  const created = await deps.createSsoClient({
    clientId: input.clientId,
    name: input.name,
    description: input.description ?? null,
    launchUrl: input.launchUrl,
    secretHash: secret?.hash ?? null,
    redirectUris: input.redirectUris,
    postLogoutRedirectUris: input.postLogoutRedirectUris,
    allowedRoles: input.allowedRoles,
  });

  return {
    client: toAdminItem(created),
    clientSecret: secret?.plain ?? null,
  };
}

export async function updateSsoClientAdmin(
  id: string,
  input: UpdateSsoClientInput,
  deps: SsoAdminDeps = defaultDeps,
): Promise<SsoClientAdminItem> {
  const existing = await deps.findClientById(id);
  if (!existing) {
    throw new AppError("NOT_FOUND", "Modul SSO tidak ditemukan.", 404);
  }

  const updated = await deps.updateSsoClient(id, input);

  // Bila modul dinonaktifkan, cabut seluruh refresh token aktifnya.
  if (existing.isActive && input.isActive === false) {
    await deps.revokeAllRefreshTokensForClient(existing.id, deps.now());
  }

  return toAdminItem(updated);
}

export async function rotateSsoClientSecretAdmin(
  id: string,
  deps: SsoAdminDeps = defaultDeps,
): Promise<SsoClientSecretPayload> {
  const existing = await deps.findClientById(id);
  if (!existing) {
    throw new AppError("NOT_FOUND", "Modul SSO tidak ditemukan.", 404);
  }
  if (!existing.secretHash) {
    throw new AppError(
      "BAD_REQUEST",
      "Klien publik tidak memiliki client_secret (autentikasi menggunakan PKCE).",
      400,
    );
  }

  const secret = await deps.generateSecret();
  const updated = await deps.updateSsoClientSecret(id, secret.hash);

  return {
    client: toAdminItem(updated),
    clientSecret: secret.plain,
  };
}
