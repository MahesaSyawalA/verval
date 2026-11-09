import { apiFetch } from "@/lib/http";
import { uploadStoredFile } from "@/lib/upload-client";
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
  return uploadStoredFile(
    file,
    "dokumentasi",
    "Gagal mengunggah berkas foto dokumentasi.",
  );
}
