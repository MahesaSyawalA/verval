"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { RAPAT_QUERY_KEY } from "@/modules/rapat";
import { submitPresensiRapatApi } from "../api";
import type { SubmitPresensiInput } from "../schemas/presensi.schema";

export function useSubmitPresensi(rapatId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: SubmitPresensiInput) =>
      submitPresensiRapatApi(rapatId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RAPAT_QUERY_KEY });
    },
  });
}
