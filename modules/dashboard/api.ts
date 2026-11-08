import type { DosenDashboardData, KaprodiDashboardData } from "./types";

interface ApiEnvelope<T> {
  data: T;
  error?: { code: string; message: string } | null;
}

export async function fetchKaprodiDashboardApi(): Promise<KaprodiDashboardData> {
  const response = await fetch("/api/dashboard/kaprodi", {
    method: "GET",
    cache: "no-store",
  });
  const payload = (await response.json()) as ApiEnvelope<KaprodiDashboardData>;

  if (!response.ok || payload.error) {
    throw new Error(
      payload.error?.message ?? "Gagal memuat data Dashboard Kinerja Kaprodi.",
    );
  }

  return payload.data;
}

export async function fetchDosenDashboardApi(): Promise<DosenDashboardData> {
  const response = await fetch("/api/dashboard/dosen", {
    method: "GET",
    cache: "no-store",
  });
  const payload = (await response.json()) as ApiEnvelope<DosenDashboardData>;

  if (!response.ok || payload.error) {
    throw new Error(
      payload.error?.message ?? "Gagal memuat data Dashboard Personal Dosen.",
    );
  }

  return payload.data;
}
