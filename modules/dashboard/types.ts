import type { DonutSlice, TrendDataPoint } from "@/components/charts";
import type { StatusTiketType } from "@/modules/tiket";

export interface DosenRankingItem {
  dosenId: string;
  namaLengkap: string;
  inisial: string;
  keterangan: string;
  persentase: number;
}

export interface DashboardTicketSummaryRow {
  id: string;
  kodeTiket: string;
  namaTarget: string;
  kuantitasLabel: string;
  dosenNama: string;
  tenggatWaktu: string;
  status: StatusTiketType;
}

export interface KaprodiDashboardData {
  stats: {
    targetTercapaiLabel: string;
    targetTercapaiDelta: string;
    capaianVsTargetPersen: number;
    capaianDelta: string;
    menungguVerifikasiCount: number;
    menungguVerifikasiDelta: string;
    dosenAktifLabel: string;
    dosenAktifDelta: string;
  };
  trend: {
    periodeLabel: string;
    capaianPersen: number;
    capaianDelta: string;
    targetPersen: number;
    tahunTarget: number;
    points: TrendDataPoint[];
  };
  statusDistribution: {
    totalTarget: number;
    slices: Array<DonutSlice & { percentage: number }>;
  };
  peringkatDosen: {
    palingProduktif: DosenRankingItem[];
    perluDipantau: DosenRankingItem[];
  };
  tiketTerbaru: DashboardTicketSummaryRow[];
  capaianProdi: {
    tahunTarget: number;
    targetPersen: number;
    realisasiPersen: number;
    subtitle: string;
  };
}

export interface DosenActionItem {
  id: string;
  judul: string;
  subjudul: string;
  badgeLabel: string;
  badgeTone: "danger" | "warning" | "primary";
  href: string;
}

export interface DosenDashboardData {
  stats: {
    tugasSayaCount: number;
    tugasSayaDelta: string;
    targetTercapaiLabel: string;
    targetTercapaiDelta: string;
    menungguVerifikasiCount: number;
    menungguVerifikasiDelta: string;
    rapatDihadiriPersen: number;
    rapatDihadiriDelta: string;
  };
  trend: {
    periodeLabel: string;
    capaianPersen: number;
    capaianDelta: string;
    targetPersen: number;
    tahunTarget: number;
    points: TrendDataPoint[];
  };
  statusDistribution: {
    totalTugas: number;
    slices: Array<DonutSlice & { percentage: number }>;
  };
  perluTindakan: DosenActionItem[];
  tugasSaya: DashboardTicketSummaryRow[];
  capaianSaya: {
    tahunTarget: number;
    targetProdiPersen: number;
    realisasiPersen: number;
    subtitle: string;
  };
}
