import { apiFetch } from "@/lib/http";
import { uploadStoredFile } from "@/lib/upload-client";
import type { CreateAgendaRapatInput } from "./schemas/rapat.schema";
import type {
  RapatFilterParams,
  RapatItem,
  RapatUserOption,
  StatusRapatType,
} from "./types";

export interface RapatListResponse {
  data: RapatItem[];
  userOptions: RapatUserOption[];
}

export async function fetchRapatListApi(
  filter?: RapatFilterParams,
): Promise<RapatListResponse> {
  const qs = new URLSearchParams();
  if (filter?.status) qs.set("status", filter.status);
  if (filter?.search) qs.set("search", filter.search);
  if (filter?.completeness && filter.completeness !== "ALL") {
    qs.set("completeness", filter.completeness);
  }
  const query = qs.toString() ? `?${qs.toString()}` : "";

  return apiFetch<RapatListResponse>(`/api/rapat${query}`);
}

export async function fetchRapatDetailApi(
  id: string,
): Promise<{ data: RapatItem }> {
  return apiFetch<{ data: RapatItem }>(`/api/rapat/${id}`);
}

export async function createAgendaRapatApi(
  input: CreateAgendaRapatInput,
): Promise<{ data: RapatItem }> {
  return apiFetch<{ data: RapatItem }>("/api/rapat", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function updateRapatStatusApi(
  id: string,
  statusRapat: StatusRapatType,
): Promise<{ data: RapatItem }> {
  return apiFetch<{ data: RapatItem }>(`/api/rapat/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ statusRapat }),
  });
}

export async function uploadUndanganFileApi(
  file: File,
): Promise<{ path: string; fileName: string; size: number }> {
  return uploadStoredFile(
    file,
    "undangan",
    "Gagal mengunggah berkas surat undangan.",
  );
}
