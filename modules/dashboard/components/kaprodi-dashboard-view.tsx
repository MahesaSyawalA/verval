"use client";

import Link from "next/link";
import {
  CheckCircle2,
  Clock,
  TrendingUp,
  Users,
} from "lucide-react";
import { DonutChart, GaugeChart, TrendChart } from "@/components/charts";
import {
  Card,
  DataTable,
  type DataTableColumn,
  StatCard,
  StatusChip,
} from "@/components/ui";
import { useKaprodiDashboard } from "../hooks/use-dashboard";
import type {
  DashboardTicketSummaryRow,
  KaprodiDashboardData,
} from "../types";

export interface KaprodiDashboardViewProps {
  initialData: KaprodiDashboardData;
}

export function KaprodiDashboardView({
  initialData,
}: KaprodiDashboardViewProps) {
  const { data = initialData } = useKaprodiDashboard(initialData);

  const columns: DataTableColumn<DashboardTicketSummaryRow>[] = [
    {
      key: "namaTarget",
      header: "Target",
      render: (row) => (
        <Link
          href={`/tiket/${row.id}`}
          className="font-semibold text-body-sm text-ink hover:text-primary transition-colors"
        >
          {row.namaTarget}
        </Link>
      ),
    },
    {
      key: "kuantitasLabel",
      header: "Kuantitas",
      render: (row) => (
        <span className="text-body-sm text-ink-muted">{row.kuantitasLabel}</span>
      ),
    },
    {
      key: "dosenNama",
      header: "Dosen",
      render: (row) => (
        <span className="text-body-sm text-ink">{row.dosenNama}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (row) => <StatusChip status={row.status} />,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Row 1: 4 StatCards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Target Tercapai"
          value={data.stats.targetTercapaiLabel}
          delta={data.stats.targetTercapaiDelta}
          icon={<CheckCircle2 className="h-5 w-5" />}
        />
        <StatCard
          title="Capaian vs Target"
          value={`${data.stats.capaianVsTargetPersen}%`}
          delta={data.stats.capaianDelta}
          icon={<TrendingUp className="h-5 w-5" />}
        />
        <StatCard
          title="Menunggu Verifikasi"
          value={data.stats.menungguVerifikasiCount}
          delta={data.stats.menungguVerifikasiDelta}
          icon={<Clock className="h-5 w-5" />}
        />
        <StatCard
          title="Dosen Aktif"
          value={data.stats.dosenAktifLabel}
          delta={data.stats.dosenAktifDelta}
          icon={<Users className="h-5 w-5" />}
          highlighted
        />
      </div>

      {/* Row 2: Tren Capaian + Status Target + Peringkat Dosen */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <Card className="p-6 lg:col-span-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-heading text-h5 font-bold text-ink">
                Tren Capaian
              </h2>
              <span className="rounded-full bg-surface px-3 py-1 text-caption font-semibold text-ink-muted">
                {data.trend.periodeLabel}
              </span>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-surface p-3.5">
                <p className="text-caption text-ink-muted">Capaian</p>
                <div className="mt-1 flex items-center gap-2">
                  <span className="font-heading text-h5 font-bold text-ink">
                    {data.trend.capaianPersen}%
                  </span>
                  <span className="rounded-full bg-success-soft px-2 py-0.5 text-[11px] font-semibold text-success-ink">
                    {data.trend.capaianDelta}
                  </span>
                </div>
              </div>

              <div className="rounded-2xl bg-surface p-3.5">
                <p className="text-caption text-ink-muted">Target</p>
                <div className="mt-1 flex items-center gap-2">
                  <span className="font-heading text-h5 font-bold text-ink">
                    {data.trend.targetPersen}%
                  </span>
                  <span className="text-caption font-medium text-ink-subtle">
                    {data.trend.tahunTarget}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4">
            <TrendChart data={data.trend.points} height={195} />
          </div>
        </Card>

        <Card className="p-6 lg:col-span-3 flex flex-col justify-between">
          <h2 className="font-heading text-h5 font-bold text-ink">
            Status Target
          </h2>

          <div className="my-3">
            <DonutChart
              data={data.statusDistribution.slices}
              centerValue={data.statusDistribution.totalTarget}
              centerLabel="Target"
              size={165}
            />
          </div>

          <div className="space-y-2">
            {data.statusDistribution.slices.map((slice) => (
              <div
                key={slice.label}
                className="flex items-center justify-between text-caption"
              >
                <div className="flex items-center gap-2 text-ink-muted">
                  <span
                    className="h-2.5 w-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: slice.color }}
                  />
                  <span>{slice.label}</span>
                </div>
                <span className="font-semibold text-ink">
                  {slice.percentage}%
                </span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6 lg:col-span-4 flex flex-col justify-between">
          <h2 className="font-heading text-h5 font-bold text-ink">
            Peringkat Dosen
          </h2>

          <div className="mt-3 space-y-4">
            <div>
              <span className="inline-block rounded-full bg-success-soft px-3 py-0.5 text-[11px] font-bold tracking-wide text-success-ink uppercase">
                Paling Produktif
              </span>
              <div className="mt-2.5 space-y-2.5">
                {data.peringkatDosen.palingProduktif.map((dosen) => (
                  <div
                    key={dosen.dosenId}
                    className="flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-50 font-heading text-caption font-bold text-primary">
                        {dosen.inisial}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-body-sm text-ink">
                          {dosen.namaLengkap}
                        </p>
                        <p className="text-[11px] text-ink-muted">
                          {dosen.keterangan}
                        </p>
                      </div>
                    </div>
                    <span className="font-heading text-body-sm font-bold text-success-ink shrink-0">
                      {dosen.persentase}%
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-border-soft pt-3">
              <span className="inline-block rounded-full bg-danger-soft px-3 py-0.5 text-[11px] font-bold tracking-wide text-danger-ink uppercase">
                Perlu Dipantau
              </span>
              <div className="mt-2.5 space-y-2.5">
                {data.peringkatDosen.perluDipantau.map((dosen) => (
                  <div
                    key={dosen.dosenId}
                    className="flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-danger-soft font-heading text-caption font-bold text-danger-ink">
                        {dosen.inisial}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-body-sm text-ink">
                          {dosen.namaLengkap}
                        </p>
                        <p className="text-[11px] text-ink-muted">
                          {dosen.keterangan}
                        </p>
                      </div>
                    </div>
                    <span className="font-heading text-body-sm font-bold text-danger-ink shrink-0">
                      {dosen.persentase}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Row 3: Target & Tiket Terbaru + Capaian Prodi */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <Card className="p-6 lg:col-span-8">
          <div className="mb-4 flex items-center justify-between gap-2">
            <h2 className="font-heading text-h5 font-bold text-ink">
              Target &amp; Tiket Terbaru
            </h2>
            <Link
              href="/tiket"
              className="text-body-sm font-semibold text-primary hover:underline"
            >
              Lihat semua
            </Link>
          </div>

          <DataTable
            columns={columns}
            data={data.tiketTerbaru}
            rowKey={(row) => row.id}
            emptyTitle="Belum ada tiket penugasan"
            emptyDescription="Kaprodi dapat membuat penugasan baru melalui menu Penugasan & Bukti."
          />
        </Card>

        <Card className="p-6 lg:col-span-4 flex flex-col justify-between">
          <div>
            <h2 className="font-heading text-h5 font-bold text-ink">
              Capaian Prodi
            </h2>
            <p className="mt-0.5 text-caption text-ink-muted">
              Target tahun {data.capaianProdi.tahunTarget}:{" "}
              {data.capaianProdi.targetPersen}%
            </p>
          </div>

          <div className="my-6">
            <GaugeChart
              percentage={data.capaianProdi.realisasiPersen}
              subtitle={data.capaianProdi.subtitle}
            />
          </div>

          <Link
            href="/tiket"
            className="inline-flex w-full items-center justify-center rounded-full bg-accent px-5 py-3 text-body-sm font-bold text-ink hover:bg-accent-500 transition-colors"
          >
            Lihat Detail Capaian
          </Link>
        </Card>
      </div>
    </div>
  );
}
