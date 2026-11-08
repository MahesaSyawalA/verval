import { apiFetch } from "@/lib/http";
import type { LoginInput } from "./schemas/auth.schema";
import type { LoginResponse, SessionUser } from "./types";

export async function loginApi(input: LoginInput): Promise<LoginResponse> {
  return apiFetch<LoginResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function logoutApi(): Promise<{ success: boolean }> {
  return apiFetch<{ success: boolean }>("/api/auth/logout", {
    method: "POST",
  });
}

export async function fetchCurrentUserApi(): Promise<{ user: SessionUser }> {
  return apiFetch<{ user: SessionUser }>("/api/auth/me", {
    method: "GET",
  });
}
