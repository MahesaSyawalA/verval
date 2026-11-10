"use client";

import { Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/layout";
import {
  BareInput,
  Button,
  Card,
  DataTable,
  ErrorState,
  Select,
  type DataTableColumn,
} from "@/components/ui";
import { getInitials } from "@/lib/utils";
import { useTargets } from "../hooks/use-targets";
import type { MasterTargetItem } from "../types";
import { TargetFormModal } from "./target-form-modal";

export interface MasterTargetViewProps {
  userFullName: string;
}

export function MasterTargetView({ userFullName }: MasterTargetViewProps) {
  const [tahunFilter, setTahunFilter] = useState<string>("2026");
  const [levelFilter, setLevelFilter] = useState<string>("Semua");
  const [search, setSearch] = useState<string>("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTarget, setEditingTarget] = useState<MasterTargetItem | null>(
    null,
  );

  const {
    data: targets = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useTargets({
    tahun: tahunFilter === "Semua" ? undefined : Number(tahunFilter),
    search: search.trim() || undefined,
  });

  const nextSuggestedCode = useMemo(() => {
    const nextNumber = targets.length + 1;
    return `T-${String(nextNumber).padStart(2, "0")}`;
  }, [targets.length]);

  const columns: DataTableColumn<MasterTargetItem>[] = [
    {
      key: "no",
      header: "NO",
      className: "w-14 font-semibold text-ink",
      render: (_, index) => index + 1,
    },
    {
      key: "kode",
      header: "KODE",
      className: "w-24 font-medium text-ink",
      render: (row) => row.kodeTarget,
    },
    {
      key: "nama",
      header: "NAMA TARGET",
      className: "font-medium text-ink min-w-[240px]",
      render: (row) => row.namaTarget,
    },
    {
      key: "kuantitas",
      header: "KUANTITAS",
      className: "w-28 text-ink",
      render: (row) => row.kuantitasTotal,
    },
    {
      key: "satuan",
      header: "SATUAN",
      className: "w-32 text-ink",
      render: (row) => row.satuan,
    },
    {
      key: "formatBukti",
      header: "ISIAN BUKTI (DINAMIS)",
      className: "min-w-[240px]",
      render: (row) => (
        <div className="flex flex-wrap items-center gap-1.5">
          {row.formatBukti.map((fb) => (
            <span
              key={fb.id}
              title={`${fb.namaField} (${fb.tipeData} · ${fb.statusIsian})`}
              className="inline-flex items-center rounded-full bg-surface px-3 py-1 text-body-sm font-medium text-ink"
            >
              {fb.namaField}
            </span>
          ))}
        </div>
      ),
    },
    {
      key: "ditugaskan",
      header: "DITUGASKAN",
      className: "w-32 text-ink",
      render: (row) => `${row.kuantitasDitugaskan} dari ${row.kuantitasTotal}`,
    },
    {
      key: "aksi",
      header: "AKSI",
      className: "w-28 text-right",
      render: (row) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setEditingTarget(row);
            setModalOpen(true);
          }}
        >
          Ubah
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title={`Master Target ${tahunFilter === "Semua" ? "Prodi" : tahunFilter}`}
        description={`Target tahunan dari Direktur Cibiru yang diturunkan ke prodi · ${targets.length} target`}
        actions={
          <div className="flex items-center gap-2.5">
            <span className="rounded-full bg-white px-4 py-1.5 text-body-sm font-semibold text-primary shadow-xs border border-border-soft">
              Tahun {tahunFilter === "Semua" ? "2026" : tahunFilter}
            </span>
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary font-heading text-body-sm font-bold text-primary">
              {getInitials(userFullName)}
            </span>
          </div>
        }
      />

      <Card className="p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3 flex-1">
            <Select
              id="filter-tahun"
              label="Tahun"
              size="filter"
              value={tahunFilter}
              onChange={(e) => setTahunFilter(e.target.value)}
              className="min-w-[130px]"
              options={[
                { value: "2026", label: "2026" },
                { value: "2025", label: "2025" },
                { value: "2027", label: "2027" },
                { value: "Semua", label: "Semua" },
              ]}
            />

            <Select
              id="filter-level"
              label="Level"
              size="filter"
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
              className="min-w-[130px]"
              options={[
                { value: "Semua", label: "Semua" },
                { value: "Prodi", label: "Prodi" },
                { value: "Dosen", label: "Dosen" },
              ]}
            />

            <div className="flex flex-col rounded-2xl border border-border-soft bg-white px-4 py-1.5 min-w-[240px] flex-1 max-w-sm">
              <label
                htmlFor="filter-search-target"
                className="text-[11px] text-ink-muted"
              >
                Pencarian
              </label>
              <BareInput
                id="filter-search-target"
                type="search"
                placeholder="Nama atau kode target..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-transparent text-body-sm text-ink placeholder:text-ink-subtle focus:outline-none"
              />
            </div>
          </div>

          <Button
            variant="primary"
            size="md"
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() => {
              setEditingTarget(null);
              setModalOpen(true);
            }}
          >
            Tambah Target
          </Button>
        </div>

        {isError ? (
          <ErrorState
            message={
              error instanceof Error
                ? error.message
                : "Gagal memuat daftar master target."
            }
            onRetry={() => refetch()}
          />
        ) : (
          <DataTable
            columns={columns}
            data={targets}
            rowKey={(row) => row.id}
            isLoading={isLoading}
            emptyTitle="Belum ada master target"
            emptyDescription="Tambahkan master target tahunan beserta format isian buktinya."
          />
        )}

        <div className="pt-2 text-body-sm text-ink-muted">
          Menampilkan {targets.length} dari {targets.length} target · Isian
          bukti bisa diubah admin setiap tahun
        </div>
      </Card>

      <TargetFormModal
        key={editingTarget?.id ?? (modalOpen ? nextSuggestedCode : "target-closed")}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        editingTarget={editingTarget}
        suggestedCode={nextSuggestedCode}
        isLoading={isLoading}
      />
    </div>
  );
}
