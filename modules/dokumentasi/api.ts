import { apiFetch } from "@/lib/http";
import type { SaveDokumentasiInput } from "./schemas/dokumentasi.schema";
import type { DokumentasiPhotoItem } from "./types";

export async function saveDokumentasiRapatApi(
  rapatId: string,
  input: SaveDokumentasiInput,
): Promise<{ data: DokumentasiPhotoItem[] }> {
  return apiFetch<{ data: DokumentasiPhotoItem[] }>(
    `/api/rapat/${rapatId}/dokumentasi`,
    {
      method: "POST",
      body: JSON.stringify(input),
    },
  );
}

export async function uploadDokumentasiPhotoFileApi(
  file: File,
): Promise<{ path: string; fileName: string; size: number }> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("folder", "dokumentasi");

  const response = await fetch("/api/storage/upload", {
    method: "POST",
    body: formData,
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(
      payload?.error?.message ?? "Gagal mengunggah berkas foto dokumentasi.",
    );
  }

  return payload.data;
}
