"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { RAPAT_QUERY_KEY } from "@/modules/rapat";
import { saveNotulensiRapatApi } from "../api";
import type { SaveNotulensiInput } from "../schemas/notulensi.schema";

export function useSaveNotulensi(rapatId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: SaveNotulensiInput) =>
      saveNotulensiRapatApi(rapatId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RAPAT_QUERY_KEY });
    },
  });
}
