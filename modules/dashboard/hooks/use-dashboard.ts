"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchDosenDashboardApi, fetchKaprodiDashboardApi } from "../api";
import type { DosenDashboardData, KaprodiDashboardData } from "../types";

export const KAPRODI_DASHBOARD_QUERY_KEY = ["dashboard", "kaprodi"] as const;
export const DOSEN_DASHBOARD_QUERY_KEY = ["dashboard", "dosen"] as const;

export function useKaprodiDashboard(initialData?: KaprodiDashboardData) {
  return useQuery({
    queryKey: KAPRODI_DASHBOARD_QUERY_KEY,
    queryFn: fetchKaprodiDashboardApi,
    initialData,
  });
}

export function useDosenDashboard(initialData?: DosenDashboardData) {
  return useQuery({
    queryKey: DOSEN_DASHBOARD_QUERY_KEY,
    queryFn: fetchDosenDashboardApi,
    initialData,
  });
}
