import type { MarkNotifikasiReadInput } from "./schemas/notifikasi.schema";
import type { NotifikasiListResponse } from "./types";

interface ApiEnvelope<T> {
  data: T;
  error: { code: string; message: string } | null;
}

export async function fetchNotifikasiApi(): Promise<NotifikasiListResponse> {
  const response = await fetch("/api/notifikasi", {
    method: "GET",
    cache: "no-store",
  });
  const payload = (await response.json()) as ApiEnvelope<NotifikasiListResponse>;

  if (!response.ok || payload.error) {
    throw new Error(payload.error?.message ?? "Gagal memuat daftar notifikasi.");
  }

  return payload.data;
}

export async function markNotifikasiReadApi(
  input?: MarkNotifikasiReadInput,
): Promise<{ updatedCount: number; unreadCount: number }> {
  const response = await fetch("/api/notifikasi", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input ?? { markAll: true }),
  });

  const payload = (await response.json()) as ApiEnvelope<{
    updatedCount: number;
    unreadCount: number;
  }>;

  if (!response.ok || payload.error) {
    throw new Error(
      payload.error?.message ?? "Gagal memperbarui status notifikasi.",
    );
  }

  return payload.data;
}
