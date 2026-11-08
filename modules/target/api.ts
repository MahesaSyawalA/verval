import { apiFetch } from "@/lib/http";
import type { MasterTargetInput } from "./schemas/target.schema";
import type { MasterTargetItem, TargetFilterParams } from "./types";

export async function fetchTargetsApi(
  params?: TargetFilterParams,
): Promise<{ data: MasterTargetItem[] }> {
  const qs = new URLSearchParams();
  if (params?.tahun) qs.set("tahun", String(params.tahun));
  if (params?.search) qs.set("search", params.search);
  const query = qs.toString() ? `?${qs.toString()}` : "";

  return apiFetch<{ data: MasterTargetItem[] }>(`/api/target${query}`);
}

export async function createTargetApi(
  input: MasterTargetInput,
): Promise<{ data: MasterTargetItem }> {
  return apiFetch<{ data: MasterTargetItem }>("/api/target", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function updateTargetApi(
  id: string,
  input: MasterTargetInput,
): Promise<{ data: MasterTargetItem }> {
  return apiFetch<{ data: MasterTargetItem }>(`/api/target/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export async function deleteTargetApi(
  id: string,
): Promise<{ success: boolean }> {
  return apiFetch<{ success: boolean }>(`/api/target/${id}`, {
    method: "DELETE",
  });
}
