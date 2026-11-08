"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createAgendaRapatApi,
  fetchRapatDetailApi,
  fetchRapatListApi,
  updateRapatStatusApi,
} from "../api";
import type { CreateAgendaRapatInput } from "../schemas/rapat.schema";
import type { RapatFilterParams, StatusRapatType } from "../types";

export const RAPAT_QUERY_KEY = ["rapat-agenda"] as const;

export function useRapatList(filter?: RapatFilterParams) {
  return useQuery({
    queryKey: [...RAPAT_QUERY_KEY, filter ?? {}],
    queryFn: () => fetchRapatListApi(filter),
  });
}

export function useRapatDetail(id: string) {
  return useQuery({
    queryKey: [...RAPAT_QUERY_KEY, "detail", id],
    queryFn: async () => {
      const res = await fetchRapatDetailApi(id);
      return res.data;
    },
    enabled: Boolean(id),
  });
}

export function useCreateAgendaRapat() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateAgendaRapatInput) => createAgendaRapatApi(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RAPAT_QUERY_KEY });
    },
  });
}

export function useUpdateRapatStatus(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (statusRapat: StatusRapatType) =>
      updateRapatStatusApi(id, statusRapat),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RAPAT_QUERY_KEY });
    },
  });
}
