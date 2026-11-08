"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createTargetApi,
  deleteTargetApi,
  fetchTargetsApi,
  updateTargetApi,
} from "../api";
import type { MasterTargetInput } from "../schemas/target.schema";
import type { TargetFilterParams } from "../types";

export const TARGETS_QUERY_KEY = ["master-targets"] as const;

export function useTargets(filter?: TargetFilterParams) {
  return useQuery({
    queryKey: [...TARGETS_QUERY_KEY, filter ?? {}],
    queryFn: async () => {
      const res = await fetchTargetsApi(filter);
      return res.data;
    },
  });
}

export function useCreateTarget() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: MasterTargetInput) => createTargetApi(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TARGETS_QUERY_KEY });
    },
  });
}

export function useUpdateTarget() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: MasterTargetInput }) =>
      updateTargetApi(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TARGETS_QUERY_KEY });
    },
  });
}

export function useDeleteTarget() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteTargetApi(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TARGETS_QUERY_KEY });
    },
  });
}
