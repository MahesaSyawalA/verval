"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchNotifikasiApi, markNotifikasiReadApi } from "../api";
import type { MarkNotifikasiReadInput } from "../schemas/notifikasi.schema";

export const NOTIFIKASI_QUERY_KEY = ["notifikasi", "list"] as const;

export function useNotifikasi() {
  return useQuery({
    queryKey: NOTIFIKASI_QUERY_KEY,
    queryFn: fetchNotifikasiApi,
  });
}

export function useMarkNotifikasiRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input?: MarkNotifikasiReadInput) =>
      markNotifikasiReadApi(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: NOTIFIKASI_QUERY_KEY });
    },
  });
}
