import type { UserRole } from "@/config/roles";

export interface SessionUser {
  id: string;
  nip: string;
  namaLengkap: string;
  email: string;
  role: UserRole;
}

export interface LoginResponse {
  user: SessionUser;
  redirectTo: string;
}

export interface DemoAccountInfo {
  role: UserRole;
  name: string;
  email: string;
  nip: string;
  description: string;
}
