"use client";

import Link from "next/link";
import { useState } from "react";
import { Button, Card, ErrorState, Skeleton, StatusChip } from "@/components/ui";
import { getInitials } from "@/lib/utils";
import { useSubmitBukti, useTicketDetail } from "../hooks/use-tickets";
import { UploadBuktiModal } from "./upload-bukti-modal";

export interface DosenTicketDetailProps {
  ticketId: string;
  userFullName: string;
}

function formatLongDate(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return isoDate;
  return date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export function DosenTicketDetail({
  ticketId,
  userFullName,
}: DosenTicketDetailProps) {
  const { data: ticket, isLoading, isError, error, refetch } =
    useTicketDetail(ticketId);
  const submitMutation = useSubmitBukti(ticketId);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-16 w-full rounded-3xl" />
        <Skeleton className="h-96 w-full rounded-3xl" />
      </div>
    );
  }

  if (isError || !ticket) {
    return (
      <ErrorState
        message={
          error instanceof Error
            ? error.message
            : "Detail tiket penugasan tidak ditemukan."
        }
        onRetry={() => refetch()}
      />
    );
  }

  const isRejected = ticket.status === "Ditolak";
  const canEdit = ticket.status !== "Tercapai";

  async function handleQuickResubmit(action: "draft" | "submit") {
    if (!ticket) return;
    if (ticket.isianBukti.length === 0) {
      setUploadModalOpen(true);
      return;
    }
    await submitMutation.mutateAsync({
      action,
      submissions: ticket.isianBukti.map((ib) => ({
        formatBuktiId: ib.formatBuktiId,
        urutanSubmisi: ib.urutanSubmisi,
        nilaiIsian: ib.nilaiIsian,
      })),
    });
  }

  return (
    <div className="space-y-5">
      {/* Header with Breadcrumb */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-heading text-h4 font-bold text-ink">
            Tiket {ticket.kodeTiket}
          </h2>
          <p className="mt-1 text-body-sm text-ink-muted">
            <Link href="/tiket" className="hover:text-primary hover:underline">
              Tiket Saya
            </Link>{" "}
            &rsaquo; Detail &middot; {ticket.namaTarget}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <span className="rounded-full bg-white px-4 py-1.5 text-body-sm font-semibold text-primary shadow-xs border border-border-soft">
            Tahun {ticket.tahunTarget}
          </span>
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary font-heading text-body-sm font-bold text-primary">
            {getInitials(userFullName)}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Informasi Penugasan + Bukti Kegiatan */}
        <div className="lg:col-span-7 space-y-6">
          <Card className="p-6 space-y-4">
            <h3 className="font-heading text-h6 font-bold text-ink">
              Informasi Penugasan
            </h3>

            <dl className="grid grid-cols-1 sm:grid-cols-12 gap-y-2.5 text-body-sm">
              <dt className="sm:col-span-4 text-ink-muted">Target</dt>
              <dd className="sm:col-span-8 font-medium text-ink">
                : {ticket.kodeTarget} {ticket.namaTarget}
              </dd>

              <dt className="sm:col-span-4 text-ink-muted">Dosen</dt>
              <dd className="sm:col-span-8 font-medium text-ink">
                : {ticket.dosenNama}
              </dd>

              <dt className="sm:col-span-4 text-ink-muted">Ditugaskan oleh</dt>
              <dd className="sm:col-span-8 font-medium text-ink">
                : Dr. Iqbal Al-Farisi, M.Kom. (Kaprodi)
              </dd>

              <dt className="sm:col-span-4 text-ink-muted">Tenggat</dt>
              <dd className="sm:col-span-8 font-medium text-ink">
                : {formatLongDate(ticket.tenggatWaktu)}
              </dd>

              <dt className="sm:col-span-4 text-ink-muted">Kuantitas</dt>
              <dd className="sm:col-span-8 font-medium text-ink">
                : Target {ticket.kuantitasDitugaskan}{" "}
                {ticket.satuan.toLowerCase()} &middot; terisi{" "}
                {ticket.progresSubmisiCount}
              </dd>
            </dl>
          </Card>

          <Card className="p-6 space-y-4">
            <h3 className="font-heading text-h6 font-bold text-ink">
              Bukti Kegiatan
            </h3>

            <div className="flex items-center justify-between rounded-2xl bg-surface px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center rounded-full bg-danger-bg px-3 py-1 text-body-sm font-bold text-danger-ink">
                  PDF
                </span>
                <div>
                  <p className="text-body-sm font-semibold text-ink">
                    Surat_Tugas_
                    {ticket.kodeTiket.replace(/[^0-9]/g, "") || "017"}.pdf
                  </p>
                  <p className="text-[12px] text-ink-muted">
                    198 KB &middot; diunggah 15 Okt 2026
                  </p>
                </div>
              </div>
              <StatusChip status="Surat tugas" tone="success" />
            </div>

            <div className="space-y-2.5 pt-1">
              <p className="text-body-sm font-semibold text-ink">
                Rincian isian bukti ({ticket.progresSubmisiCount} dari{" "}
                {ticket.kuantitasDitugaskan})
              </p>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-body-sm">
                  <thead>
                    <tr className="bg-surface text-ink-muted font-semibold uppercase text-[11px]">
                      <th className="px-3.5 py-2.5 rounded-l-xl">NO</th>
                      <th className="px-3.5 py-2.5">FIELD BUKTI</th>
                      <th className="px-3.5 py-2.5">NILAI / BERKAS</th>
                      <th className="px-3.5 py-2.5 rounded-r-xl text-right">
                        STATUS
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-soft">
                    {ticket.isianBukti.length === 0 ? (
                      <tr>
                        <td
                          colSpan={4}
                          className="px-4 py-6 text-center text-ink-muted"
                        >
                          Belum ada rincian bukti yang diunggah.
                        </td>
                      </tr>
                    ) : (
                      ticket.isianBukti.map((ib, idx) => (
                        <tr
                          key={ib.id}
                          className={
                            isRejected && idx === 0 ? "bg-danger-bg/25" : ""
                          }
                        >
                          <td className="px-3.5 py-3 font-medium text-ink">
                            #{ib.urutanSubmisi}
                          </td>
                          <td className="px-3.5 py-3 font-medium text-ink">
                            {ib.namaField}
                          </td>
                          <td className="px-3.5 py-3 text-ink break-all">
                            {ib.nilaiIsian}
                          </td>
                          <td className="px-3.5 py-3 text-right">
                            <StatusChip
                              status={
                                isRejected && idx === 0
                                  ? "Perlu Revisi"
                                  : ib.tipeData
                              }
                              tone={
                                isRejected && idx === 0 ? "danger" : "primary"
                              }
                            />
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {canEdit && (
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Button
                  variant="accent"
                  size="sm"
                  onClick={() => setUploadModalOpen(true)}
                >
                  + Tambah Rincian
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setUploadModalOpen(true)}
                >
                  Ganti Surat Tugas
                </Button>
              </div>
            )}
          </Card>
        </div>

        {/* Right Column: Catatan Kaprodi + Riwayat Verifikasi */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="p-6 space-y-4">
            <h3 className="font-heading text-h6 font-bold text-ink">
              Catatan Kaprodi
            </h3>

            <div>
              <StatusChip
                status={
                  isRejected
                    ? "Ditolak · Perlu Revisi"
                    : ticket.status.replace(/_/g, " ")
                }
                tone={isRejected ? "danger" : undefined}
              />
            </div>

            <div
              className={`rounded-2xl p-4 space-y-2 ${
                isRejected ? "bg-danger-bg/50" : "bg-surface"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary font-heading text-body-sm font-bold text-primary">
                  IA
                </span>
                <div>
                  <p className="text-body-sm font-bold text-ink">
                    Dr. Iqbal Al-Farisi, M.Kom.
                  </p>
                  <p className="text-[11px] text-ink-muted">
                    Kaprodi RPL &middot; {formatLongDate(ticket.tanggalDibuat)}
                  </p>
                </div>
              </div>
              <p className="text-body-sm text-ink leading-relaxed">
                {ticket.catatanKaprodi ??
                  "Silakan lengkapi seluruh format isian bukti sesuai ketentuan master target dan unggah surat tugas pendukung."}
              </p>
            </div>

            {isRejected && (
              <div className="space-y-2">
                <p className="text-body-sm font-semibold text-ink">
                  Yang perlu diperbaiki
                </p>
                <ul className="space-y-1.5 text-body-sm text-ink">
                  <li className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-danger shrink-0" />
                    Periksa kembali kelengkapan berkas bukti yang ditolak
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-accent shrink-0" />
                    Rincian baru {ticket.progresSubmisiCount} dari{" "}
                    {ticket.kuantitasDitugaskan} {ticket.satuan.toLowerCase()}
                  </li>
                </ul>
              </div>
            )}

            {canEdit && (
              <div className="space-y-2.5 pt-2">
                <Button
                  variant="primary"
                  size="md"
                  fullWidth
                  isLoading={submitMutation.isPending}
                  onClick={() => setUploadModalOpen(true)}
                >
                  {isRejected
                    ? "Perbaiki & Kirim Ulang"
                    : "Unggah / Perbarui Bukti"}
                </Button>
                <Button
                  variant="outline"
                  size="md"
                  fullWidth
                  isLoading={submitMutation.isPending}
                  onClick={() => void handleQuickResubmit("draft")}
                >
                  Simpan Draf
                </Button>
              </div>
            )}
          </Card>

          <Card className="p-6 space-y-4">
            <h3 className="font-heading text-h6 font-bold text-ink">
              Riwayat Verifikasi
            </h3>

            <ol className="space-y-3">
              {ticket.riwayatTiket.map((rt) => {
                const isRejectHistory = rt.statusRiwayat
                  .toLowerCase()
                  .includes("ditolak");
                return (
                  <li key={rt.id} className="flex items-start gap-3">
                    <span
                      className={`mt-1.5 h-2.5 w-2.5 rounded-full shrink-0 ${
                        isRejectHistory ? "bg-danger" : "bg-primary"
                      }`}
                    />
                    <div>
                      <p className="text-body-sm font-semibold text-ink">
                        {rt.statusRiwayat}
                      </p>
                      <p className="text-[12px] text-ink-muted">
                        {rt.aktorNama} &middot; {formatLongDate(rt.createdAt)}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ol>
          </Card>
        </div>
      </div>

      <UploadBuktiModal
        key={uploadModalOpen ? `upload-${ticket.id}` : "upload-closed"}
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        ticket={ticket}
      />
    </div>
  );
}
