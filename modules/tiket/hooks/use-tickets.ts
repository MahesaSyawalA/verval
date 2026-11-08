"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createTicketApi,
  fetchTicketByIdApi,
  fetchTicketsApi,
  submitTicketBuktiApi,
  verifyTicketApi,
} from "../api";
import type {
  CreateTiketInput,
  SubmitBuktiInput,
  VerifyTiketInput,
} from "../schemas/tiket.schema";
import type { TicketFilterParams } from "../types";

export const TICKETS_QUERY_KEY = ["tiket-penugasan"] as const;

export function useTickets(filter?: TicketFilterParams) {
  return useQuery({
    queryKey: [...TICKETS_QUERY_KEY, filter ?? {}],
    queryFn: () => fetchTicketsApi(filter),
  });
}

export function useTicketDetail(id: string) {
  return useQuery({
    queryKey: [...TICKETS_QUERY_KEY, "detail", id],
    queryFn: async () => {
      const res = await fetchTicketByIdApi(id);
      return res.data;
    },
    enabled: Boolean(id),
  });
}

export function useCreateTicket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateTiketInput) => createTicketApi(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TICKETS_QUERY_KEY });
    },
  });
}

export function useSubmitBukti(ticketId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: SubmitBuktiInput) =>
      submitTicketBuktiApi(ticketId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TICKETS_QUERY_KEY });
    },
  });
}

export function useVerifyTicket(ticketId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: VerifyTiketInput) => verifyTicketApi(ticketId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TICKETS_QUERY_KEY });
    },
  });
}
