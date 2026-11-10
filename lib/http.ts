import { NextResponse } from "next/server";
import type { ZodError } from "zod";

export type ApiErrorCode =
  | "BAD_REQUEST"
  | "VALIDATION_ERROR"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "INTERNAL_ERROR";

export interface ApiErrorShape {
  error: {
    code: ApiErrorCode;
    message: string;
    fields?: Record<string, string>;
  };
}

export class AppError extends Error {
  public readonly code: ApiErrorCode;
  public readonly status: number;
  public readonly fields?: Record<string, string>;

  constructor(
    code: ApiErrorCode,
    message: string,
    status: number = 400,
    fields?: Record<string, string>,
  ) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.status = status;
    this.fields = fields;
  }
}

export function formatZodError(error: ZodError): Record<string, string> {
  const fields: Record<string, string> = {};
  for (const issue of error.issues) {
    const path = issue.path.join(".") || "root";
    if (!fields[path]) {
      fields[path] = issue.message;
    }
  }
  return fields;
}

export function apiError(
  code: ApiErrorCode,
  message: string,
  status: number,
  fields?: Record<string, string>,
): NextResponse<ApiErrorShape> {
  return NextResponse.json(
    {
      error: {
        code,
        message,
        ...(fields ? { fields } : {}),
      },
    },
    { status },
  );
}

export function handleRouteError(error: unknown): NextResponse<ApiErrorShape> {
  if (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    typeof (error as { digest?: unknown }).digest === "string"
  ) {
    throw error;
  }
  if (error instanceof AppError) {
    return apiError(error.code, error.message, error.status, error.fields);
  }
  // Tangani error Prisma Client yang umum (P2003 = foreign key, P2002 = unique constraint, P2025 = record not found)
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof (error as { code: unknown }).code === "string"
  ) {
    const prismaCode = (error as { code: string }).code;
    if (prismaCode === "P2003") {
      return apiError(
        "BAD_REQUEST",
        "Referensi data tidak valid atau sesi telah diperbarui di database. Silakan muat ulang halaman atau login ulang.",
        400,
      );
    }
    if (prismaCode === "P2002") {
      return apiError(
        "CONFLICT",
        "Data dengan kode atau identitas yang sama sudah terdaftar di sistem.",
        409,
      );
    }
    if (prismaCode === "P2025") {
      return apiError(
        "NOT_FOUND",
        "Data yang diminta tidak ditemukan di database.",
        404,
      );
    }
  }
  console.error("[API Error]", error);
  return apiError(
    "INTERNAL_ERROR",
    "Terjadi kesalahan pada server.",
    500,
  );
}

export async function apiFetch<T>(
  input: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(input, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const errObj = payload?.error;
    throw new AppError(
      errObj?.code ?? "BAD_REQUEST",
      errObj?.message ?? "Permintaan gagal diproses.",
      response.status,
      errObj?.fields,
    );
  }

  return payload as T;
}
