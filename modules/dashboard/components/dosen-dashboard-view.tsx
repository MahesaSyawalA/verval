"use client";

import Link from "next/link";
import {
  CalendarCheck,
  CheckCircle2,
  ClipboardList,
  Clock,
} from "lucide-react";
import {
  DonutChart,
  GaugeChart,
  TrendChart,
  chartColor,
} from "@/components/charts";
import {
  Card,
  DataTable,
  type DataTableColumn,
  StatCard,
  StatusChip,
} from "@/components/ui";
import { cn } from "@/lib/utils";
import { useDosenDashboard } from "../hooks/use-dashboard";
import type {
  DashboardTicketSummaryRow,
  DosenDashboardData,
} from "../types";

export interface DosenDashboardViewProps {
  initialData: DosenDashboardData;
}

export function DosenDashboardView({ initialData }: DosenDashboardViewProps) {
  const { data = initialData } = useDosenDashboard(initialData);

  const columns: DataTableColumn<DashboardTicketSummaryRow>[] = [
    {
      key: "namaTarget",
      header: "Target",
      render: (row) => (
        <Link
          href={`/tiket/${row.id}`}
          className="font-semibold text-body-sm text-ink hover:text-brand transition-colors"
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
      key: "tenggatWaktu",
      header: "Tenggat",
      render: (row) => (
        <span className="text-body-sm text-ink">{row.tenggatWaktu}</span>
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
          title="Tugas Saya"
          value={data.stats.tugasSayaCount}
          delta={data.stats.tugasSayaDelta}
          icon={<ClipboardList className="h-5 w-5" />}
        />
        <StatCard
          title="Target Tercapai"
          value={data.stats.targetTercapaiLabel}
          delta={data.stats.targetTercapaiDelta}
          icon={<CheckCircle2 className="h-5 w-5" />}
        />
        <StatCard
          title="Menunggu Verifikasi"
          value={data.stats.menungguVerifikasiCount}
          delta={data.stats.menungguVerifikasiDelta}
          icon={<Clock className="h-5 w-5" />}
        />
        <StatCard
          title="Rapat Dihadiri"
          value={`${data.stats.rapatDihadiriPersen}%`}
          delta={data.stats.rapatDihadiriDelta}
          icon={<CalendarCheck className="h-5 w-5" />}
          highlighted
        />
      </div>

      {/* Row 2: Tren Capaian Saya + Status Tugas Saya + Perlu Tindakan */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <Card className="p-6 lg:col-span-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-heading text-h5 font-bold text-ink">
                Tren Capaian Saya
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
            Status Tugas Saya
          </h2>

          <div className="my-3">
            <DonutChart
              data={data.statusDistribution.slices}
              centerValue={data.statusDistribution.totalTugas}
              centerLabel="Tugas"
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
                    style={{ backgroundColor: chartColor(slice.color) }}
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
            Perlu Tindakan
          </h2>

          <div className="mt-3 space-y-2.5">
            {data.perluTindakan.length === 0 ? (
              <div className="rounded-2xl bg-surface p-5 text-center text-body-sm text-ink-muted">
                Seluruh tugas dan presensi rapat sudah tertangani.
              </div>
            ) : (
              data.perluTindakan.map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  className="flex items-center justify-between gap-3 rounded-2xl bg-surface p-3.5 hover:bg-primary-50/70 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-body-sm text-ink">
                      {item.judul}
                    </p>
                    <p className="mt-0.5 text-caption text-ink-muted">
                      {item.subjudul}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-bold",
                      item.badgeTone === "danger"
                        ? "bg-danger-soft text-danger-ink"
                        : item.badgeTone === "warning"
                          ? "bg-warning-bg text-warning-ink"
                          : "bg-primary-50 text-brand",
                    )}
                  >
                    {item.badgeLabel}
                  </span>
                </Link>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* Row 3: Tugas Saya + Capaian Saya */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <Card className="p-6 lg:col-span-8">
          <div className="mb-4 flex items-center justify-between gap-2">
            <h2 className="font-heading text-h5 font-bold text-ink">
              Tugas Saya
            </h2>
            <Link
              href="/tiket"
              className="text-body-sm font-semibold text-brand hover:underline"
            >
              Lihat semua
            </Link>
          </div>

          <DataTable
            columns={columns}
            data={data.tugasSaya}
            rowKey={(row) => row.id}
            emptyTitle="Belum ada tugas ditugaskan"
            emptyDescription="Penugasan baru dari Kaprodi akan muncul pada tabel ini."
          />
        </Card>

        <Card className="p-6 lg:col-span-4 flex flex-col justify-between">
          <div>
            <h2 className="font-heading text-h5 font-bold text-ink">
              Capaian Saya
            </h2>
            <p className="mt-0.5 text-caption text-ink-muted">
              Target prodi {data.capaianSaya.tahunTarget}:{" "}
              {data.capaianSaya.targetProdiPersen}%
            </p>
          </div>

          <div className="my-6">
            <GaugeChart
              percentage={data.capaianSaya.realisasiPersen}
              subtitle={data.capaianSaya.subtitle}
            />
          </div>

          <Link
            href="/tiket"
            className="inline-flex w-full items-center justify-center rounded-full bg-accent px-5 py-3 text-body-sm font-bold text-on-accent hover:bg-accent-500 transition-colors"
          >
            Unggah Bukti
          </Link>
        </Card>
      </div>
    </div>
  );
}
