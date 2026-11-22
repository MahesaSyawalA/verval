import type { UserRole } from "@/config/roles";

export interface SsoClient {
  /** Kunci primer baris di database (dipakai sebagai relasi). */
  id: string;
  /** Pengenal publik yang dikirim modul (`client_id`). */
  clientId: string;
  name: string;
  description: string | null;
  /** URL tujuan kartu di menu utama; modul sendiri yang memulai alur login. */
  launchUrl: string;
  /** Hash bcrypt `client_secret`; null berarti klien publik (wajib PKCE). */
  secretHash: string | null;
  redirectUris: string[];
  postLogoutRedirectUris: string[];
  allowedRoles: string[];
  isActive: boolean;
  createdAt?: Date;
}

/** Bentuk data klien SSO yang aman dikirim ke UI manajemen (tanpa secretHash). */
export interface SsoClientAdminItem {
  id: string;
  clientId: string;
  name: string;
  description: string | null;
  launchUrl: string;
  isPublic: boolean;
  redirectUris: string[];
  postLogoutRedirectUris: string[];
  allowedRoles: UserRole[];
  isActive: boolean;
  createdAt: string;
}

export interface SsoClientSecretPayload {
  client: SsoClientAdminItem;
  /** Hanya tampil satu kali saat pembuatan klien rahasia atau rotasi secret. */
  clientSecret: string | null;
}

export interface SsoUser {
  id: string;
  nip: string;
  namaLengkap: string;
  email: string;
  role: UserRole;
}

export interface StoredAuthCode {
  id: string;
  clientDbId: string;
  userId: string;
  redirectUri: string;
  codeChallenge: string | null;
  expiresAt: Date;
  usedAt: Date | null;
}

export interface StoredRefreshToken {
  id: string;
  clientDbId: string;
  userId: string;
  expiresAt: Date;
  revokedAt: Date | null;
}

export interface UserInfo {
  sub: string;
  name: string;
  email: string;
  nip: string;
  role: UserRole;
}

export interface TokenResponse {
  access_token: string;
  token_type: "Bearer";
  expires_in: number;
  refresh_token: string;
  user: UserInfo;
}

/** Kartu modul di menu utama. */
export interface LaunchableModule {
  id: string;
  name: string;
  description: string | null;
  url: string;
  external: boolean;
}
