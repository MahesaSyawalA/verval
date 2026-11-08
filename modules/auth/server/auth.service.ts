import bcrypt from "bcryptjs";
import { ROLE_METADATA, type UserRole } from "@/config/roles";
import { AppError } from "@/lib/http";
import type { LoginInput } from "../schemas/auth.schema";
import type { LoginResponse, SessionUser } from "../types";
import {
  findUserByEmailOrNip,
  findUserById,
} from "./auth.repository";

export interface AuthRepositoryDeps {
  findByEmailOrNip: typeof findUserByEmailOrNip;
  findById: typeof findUserById;
}

const defaultDeps: AuthRepositoryDeps = {
  findByEmailOrNip: findUserByEmailOrNip,
  findById: findUserById,
};

export async function authenticateUser(
  input: LoginInput,
  deps: AuthRepositoryDeps = defaultDeps,
): Promise<LoginResponse> {
  const userRecord = await deps.findByEmailOrNip(input.identifier);

  if (!userRecord) {
    throw new AppError(
      "UNAUTHORIZED",
      "Email/NIP atau kata sandi tidak sesuai.",
      401,
    );
  }

  const passwordValid = await bcrypt.compare(
    input.password,
    userRecord.password,
  );

  if (!passwordValid) {
    throw new AppError(
      "UNAUTHORIZED",
      "Email/NIP atau kata sandi tidak sesuai.",
      401,
    );
  }

  const role = userRecord.role as UserRole;
  const user: SessionUser = {
    id: userRecord.id,
    nip: userRecord.nip,
    namaLengkap: userRecord.nama_lengkap,
    email: userRecord.email,
    role,
  };

  return {
    user,
    redirectTo: ROLE_METADATA[role]?.defaultRedirect ?? "/dashboard",
  };
}

export async function getAuthenticatedProfile(
  userId: string,
  deps: AuthRepositoryDeps = defaultDeps,
): Promise<SessionUser> {
  const userRecord = await deps.findById(userId);
  if (!userRecord) {
    throw new AppError("UNAUTHORIZED", "Pengguna tidak ditemukan.", 401);
  }

  return {
    id: userRecord.id,
    nip: userRecord.nip,
    namaLengkap: userRecord.nama_lengkap,
    email: userRecord.email,
    role: userRecord.role as UserRole,
  };
}
