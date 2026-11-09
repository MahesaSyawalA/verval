import { apiFetch } from "@/lib/http";
import { uploadStoredFile } from "@/lib/upload-client";
import type {
  CreateTiketInput,
  SubmitBuktiInput,
  VerifyTiketInput,
} from "./schemas/tiket.schema";
import type {
  DosenOption,
  TicketFilterParams,
  TicketItem,
} from "./types";

export interface TicketsListResponse {
  data: TicketItem[];
  dosenOptions: DosenOption[];
}

export async function fetchTicketsApi(
  filter?: TicketFilterParams,
): Promise<TicketsListResponse> {
  const qs = new URLSearchParams();
  if (filter?.status) qs.set("status", filter.status);
  if (filter?.dosenId) qs.set("dosenId", filter.dosenId);
  if (filter?.search) qs.set("search", filter.search);
  const query = qs.toString() ? `?${qs.toString()}` : "";

  return apiFetch<TicketsListResponse>(`/api/tiket${query}`);
}

export async function fetchTicketByIdApi(
  id: string,
): Promise<{ data: TicketItem }> {
  return apiFetch<{ data: TicketItem }>(`/api/tiket/${id}`);
}

export async function createTicketApi(
  input: CreateTiketInput,
): Promise<{ data: TicketItem }> {
  return apiFetch<{ data: TicketItem }>("/api/tiket", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function submitTicketBuktiApi(
  id: string,
  input: SubmitBuktiInput,
): Promise<{ data: TicketItem }> {
  return apiFetch<{ data: TicketItem }>(`/api/tiket/${id}/bukti`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function verifyTicketApi(
  id: string,
  input: VerifyTiketInput,
): Promise<{ data: TicketItem }> {
  return apiFetch<{ data: TicketItem }>(`/api/tiket/${id}/verifikasi`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function uploadBuktiFileApi(
  file: File,
): Promise<{ path: string; fileName: string; size: number }> {
  return uploadStoredFile(file, "bukti", "Gagal mengunggah berkas bukti.");
}
