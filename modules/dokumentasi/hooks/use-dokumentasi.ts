"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { RAPAT_QUERY_KEY } from "@/modules/rapat";
import { saveDokumentasiRapatApi } from "../api";
import type { SaveDokumentasiInput } from "../schemas/dokumentasi.schema";

export function useSaveDokumentasi(rapatId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: SaveDokumentasiInput) =>
      saveDokumentasiRapatApi(rapatId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RAPAT_QUERY_KEY });
    },
  });
}
