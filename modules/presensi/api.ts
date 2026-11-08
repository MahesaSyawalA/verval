import { apiFetch } from "@/lib/http";
import type { SubmitPresensiInput } from "./schemas/presensi.schema";
import type { PresensiSubmissionResult } from "./types";

export async function submitPresensiRapatApi(
  rapatId: string,
  input: SubmitPresensiInput,
): Promise<{ data: PresensiSubmissionResult }> {
  return apiFetch<{ data: PresensiSubmissionResult }>(
    `/api/rapat/${rapatId}/presensi`,
    {
      method: "POST",
      body: JSON.stringify(input),
    },
  );
}
