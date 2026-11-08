import { jwtVerify, SignJWT } from "jose";
import { cookies } from "next/headers";
import { ROLES, type UserRole } from "@/config/roles";
import { SESSION_COOKIE_NAME, SESSION_MAX_AGE_SECONDS } from "./constants";
import { AppError } from "./http";

export interface SessionPayload {
  id: string;
  nip: string;
  namaLengkap: string;
  email: string;
  role: UserRole;
}

const MIN_SECRET_LENGTH = 32;
const DEV_ONLY_SECRET = "dev-only-insecure-secret-never-use-in-production-0000";

/**
 * Di produksi SESSION_SECRET wajib diisi (minimal 32 karakter); bila tidak,
 * aplikasi menolak menandatangani/memverifikasi token. Fallback hanya untuk
 * development dan test agar token tidak dapat dipalsukan di server nyata.
 */
export function getSecretKey(): Uint8Array {
  const configured = process.env.SESSION_SECRET;

  if (configured && configured.length >= MIN_SECRET_LENGTH) {
    return Uint8Array.from(new TextEncoder().encode(configured));
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      `SESSION_SECRET wajib diisi dengan minimal ${MIN_SECRET_LENGTH} karakter di lingkungan production.`,
    );
  }

  return Uint8Array.from(new TextEncoder().encode(DEV_ONLY_SECRET));
}

export async function signSessionToken(
  payload: SessionPayload,
): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .sign(getSecretKey());
}

export async function verifySessionToken(
  token: string | undefined | null,
): Promise<SessionPayload | null> {
  if (!token) return null;
  // Dipanggil di luar try agar konfigurasi secret yang salah tidak diam-diam
  // dianggap "token tidak valid".
  const secretKey = getSecretKey();
  try {
    const { payload } = await jwtVerify(token, secretKey, {
      algorithms: ["HS256"],
    });

    const id = typeof payload.id === "string" ? payload.id : "";
    const nip = typeof payload.nip === "string" ? payload.nip : "";
    const namaLengkap =
      typeof payload.namaLengkap === "string" ? payload.namaLengkap : "";
    const email = typeof payload.email === "string" ? payload.email : "";
    const role = payload.role as UserRole;

    if (!id || !email || !ROLES.includes(role)) {
      return null;
    }

    return {
      id,
      nip,
      namaLengkap,
      email,
      role,
    };
  } catch {
    return null;
  }
}

export function getSessionCookieOptions(maxAge = SESSION_MAX_AGE_SECONDS) {
  return {
    name: SESSION_COOKIE_NAME,
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  };
}

export async function getServerSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  return verifySessionToken(token);
}

export async function requireServerSession(
  allowedRoles?: readonly UserRole[],
): Promise<SessionPayload> {
  const session = await getServerSession();
  if (!session) {
    throw new AppError(
      "UNAUTHORIZED",
      "Sesi tidak ditemukan atau telah berakhir. Silakan login kembali.",
      401,
    );
  }

  if (allowedRoles && !allowedRoles.includes(session.role)) {
    throw new AppError(
      "FORBIDDEN",
      "Anda tidak memiliki hak akses untuk melakukan aksi ini.",
      403,
    );
  }

  return session;
}
