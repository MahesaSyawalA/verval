"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { alertToast } from "@/components/ui";
import {
  NOTIFIKASI_EVENT,
  notifikasiChannelName,
  type NotifikasiRealtimePayload,
} from "@/lib/pusher-channels";
import { getPusherClient } from "@/lib/pusher-client";
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

/**
 * Berlangganan channel private Pusher milik pengguna. Saat notifikasi baru
 * masuk, daftar notifikasi diambil ulang dan toast info ditampilkan. Tidak
 * melakukan apa pun bila Pusher belum dikonfigurasi atau `userId` kosong.
 */
export function useNotifikasiRealtime(userId?: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!userId) return;
    const pusher = getPusherClient();
    if (!pusher) return;

    const channelName = notifikasiChannelName(userId);
    const channel = pusher.subscribe(channelName);

    const handleNew = (payload: NotifikasiRealtimePayload) => {
      void queryClient.invalidateQueries({ queryKey: NOTIFIKASI_QUERY_KEY });
      alertToast.info(payload.judulNotifikasi, { description: payload.pesan });
    };

    channel.bind(NOTIFIKASI_EVENT, handleNew);

    return () => {
      channel.unbind(NOTIFIKASI_EVENT, handleNew);
      pusher.unsubscribe(channelName);
    };
  }, [userId, queryClient]);
}
