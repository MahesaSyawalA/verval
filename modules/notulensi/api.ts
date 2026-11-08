import { apiFetch } from "@/lib/http";
import type { SaveNotulensiInput } from "./schemas/notulensi.schema";
import type { NotulensiItem } from "./types";

export async function saveNotulensiRapatApi(
  rapatId: string,
  input: SaveNotulensiInput,
): Promise<{ data: NotulensiItem }> {
  return apiFetch<{ data: NotulensiItem }>(`/api/rapat/${rapatId}/notulensi`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}
