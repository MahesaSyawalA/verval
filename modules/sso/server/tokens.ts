import { jwtVerify, SignJWT } from "jose";
import { ROLES, type UserRole } from "@/config/roles";
import type { SsoUser, UserInfo } from "../types";
import { getSigningKey } from "./keys";

export const ACCESS_TOKEN_TTL_SECONDS = 15 * 60;
export const AUTH_CODE_TTL_SECONDS = 60;
export const REFRESH_TOKEN_TTL_SECONDS = 30 * 24 * 60 * 60;

/** Penerbit token: SSO_ISSUER bila diatur, kalau tidak origin dari request. */
export function getIssuer(request: Request): string {
  const configured = process.env.SSO_ISSUER?.trim().replace(/\/$/, "");
  return configured || new URL(request.url).origin;
}

export async function signAccessToken(
  user: SsoUser,
  clientId: string,
  issuer: string,
): Promise<string> {
  const { privateKey, kid } = await getSigningKey();

  return new SignJWT({
    name: user.namaLengkap,
    email: user.email,
    nip: user.nip,
    role: user.role,
  })
    .setProtectedHeader({ alg: "RS256", kid, typ: "JWT" })
    .setSubject(user.id)
    .setAudience(clientId)
    .setIssuer(issuer)
    .setIssuedAt()
    .setExpirationTime(`${ACCESS_TOKEN_TTL_SECONDS}s`)
    .sign(privateKey);
}

/** Verifikasi tanda tangan, penerbit, dan kedaluwarsa; null bila tidak valid. */
export async function verifyAccessToken(
  token: string,
  issuer: string,
): Promise<UserInfo | null> {
  const { publicKey } = await getSigningKey();

  try {
    const { payload } = await jwtVerify(token, publicKey, {
      issuer,
      algorithms: ["RS256"],
    });

    const role = payload.role as UserRole;
    if (
      typeof payload.sub !== "string" ||
      typeof payload.email !== "string" ||
      !ROLES.includes(role)
    ) {
      return null;
    }

    return {
      sub: payload.sub,
      name: typeof payload.name === "string" ? payload.name : "",
      email: payload.email,
      nip: typeof payload.nip === "string" ? payload.nip : "",
      role,
    };
  } catch {
    return null;
  }
}
