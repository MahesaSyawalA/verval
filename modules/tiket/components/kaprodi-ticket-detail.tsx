"use client";

import Link from "next/link";
import { useState } from "react";
import { Button, Card, ErrorState, Skeleton, StatusChip } from "@/components/ui";
import { cn, getInitials } from "@/lib/utils";
import { useTicketDetail, useVerifyTicket } from "../hooks/use-tickets";
import { verifyTiketSchema } from "../schemas/tiket.schema";

export interface KaprodiTicketDetailProps {
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

export function KaprodiTicketDetail({
  ticketId,
  userFullName,
}: KaprodiTicketDetailProps) {
  const { data: ticket, isLoading, isError, error, refetch } =
    useTicketDetail(ticketId);
  const verifyMutation = useVerifyTicket(ticketId);

  const [catatanKaprodi, setCatatanKaprodi] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

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

  const canVerify = ticket.status === "Menunggu_Verifikasi";
  const isComplete = ticket.status === "Tercapai";
  const isQuotaReached =
    ticket.progresSubmisiCount >= ticket.kuantitasDitugaskan;

  async function handleVerify(decision: "approve" | "reject") {
    setValidationError(null);
    setFeedbackMessage(null);

    const parsed = verifyTiketSchema.safeParse({
      decision,
      catatanKaprodi: catatanKaprodi.trim() || undefined,
    });

    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      setValidationError(
        firstIssue?.message ?? "Input verifikasi tidak valid.",
      );
      return;
    }

    try {
      await verifyMutation.mutateAsync(parsed.data);
      setFeedbackMessage(
        decision === "approve"
          ? "Tiket berhasil disetujui dan ditandai Tercapai."
          : "Tiket ditolak dan dikembalikan ke dosen untuk revisi.",
      );
    } catch (err) {
      setValidationError(
        err instanceof Error ? err.message : "Gagal memverifikasi tiket.",
      );
    }
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
            Penugasan &rsaquo;{" "}
            <Link href="/tiket" className="hover:text-primary hover:underline">
              Daftar Tiket
            </Link>{" "}
            &rsaquo; Detail &middot; Dosen: {ticket.dosenNama}
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
        {/* Left Column (7 cols): Informasi Penugasan + Bukti Kegiatan */}
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
                : {ticket.dosenNama} (Dosen)
              </dd>

              <dt className="sm:col-span-4 text-ink-muted">Dibuat oleh</dt>
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
                    {ticket.kodeTiket.replace(/[^0-9]/g, "") || "014"}.pdf
                  </p>
                  <p className="text-[12px] text-ink-muted">
                    214 KB &middot; diunggah 05 Apr 2026
                  </p>
                </div>
              </div>
              <StatusChip status="Surat_Tugas" tone="success" />
            </div>

            <div className="space-y-2.5 pt-1">
              <p className="text-body-sm font-semibold text-ink">
                Rincian bukti baru ({ticket.progresSubmisiCount} dari{" "}
                {ticket.kuantitasDitugaskan})
              </p>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-body-sm">
                  <thead>
                    <tr className="bg-surface text-ink-muted font-semibold uppercase text-[11px]">
                      <th className="px-3.5 py-2.5 rounded-l-xl">NO</th>
                      <th className="px-3.5 py-2.5">FIELD / JUDUL</th>
                      <th className="px-3.5 py-2.5">RINCIAN</th>
                      <th className="px-3.5 py-2.5">TAHUN</th>
                      <th className="px-3.5 py-2.5 rounded-r-xl text-right">
                        BUKTI
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-soft">
                    {ticket.isianBukti.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-4 py-6 text-center text-ink-muted"
                        >
                          Belum ada rincian bukti yang diunggah oleh dosen.
                        </td>
                      </tr>
                    ) : (
                      ticket.isianBukti.map((ib) => (
                        <tr key={ib.id}>
                          <td className="px-3.5 py-3 font-medium text-ink">
                            #{ib.urutanSubmisi}
                          </td>
                          <td className="px-3.5 py-3 font-medium text-ink">
                            {ib.namaField}
                          </td>
                          <td className="px-3.5 py-3 text-ink break-all">
                            {ib.nilaiIsian}
                          </td>
                          <td className="px-3.5 py-3 text-ink">
                            {ticket.tahunTarget}
                          </td>
                          <td className="px-3.5 py-3 text-right">
                            <StatusChip
                              status={`${ib.tipeData} · PDF`}
                              tone="primary"
                            />
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column (5 cols): Verifikasi Kaprodi + Riwayat Tiket */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="p-6 space-y-4">
            <h3 className="font-heading text-h6 font-bold text-ink">
              Verifikasi Kaprodi
            </h3>

            <div>
              <StatusChip status={ticket.status} />
            </div>

            {/* Capaian Progress */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-body-sm">
                <span className="text-ink-muted">Capaian</span>
                <span className="font-semibold text-ink">
                  {ticket.progresSubmisiCount}/{ticket.kuantitasDitugaskan}{" "}
                  &middot; {ticket.progresPersen}%
                </span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-border-soft overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all",
                    isComplete ? "bg-success" : "bg-primary",
                  )}
                  style={{ width: `${ticket.progresPersen}%` }}
                />
              </div>
            </div>

            {/* Checklist Items */}
            <ul className="space-y-2 text-body-sm text-ink pt-1">
              <li className="flex items-center gap-2.5">
                <span className="h-3 w-3 rounded-full bg-success shrink-0" />
                <span>Surat tugas terunggah</span>
              </li>
              <li className="flex items-center gap-2.5">
                <span
                  className={cn(
                    "h-3 w-3 rounded-full shrink-0",
                    isQuotaReached ? "bg-success" : "bg-accent",
                  )}
                />
                <span>
                  Rincian bukti baru {ticket.progresSubmisiCount} dari{" "}
                  {ticket.kuantitasDitugaskan}
                </span>
              </li>
              <li className="flex items-center gap-2.5">
                <span className="h-3 w-3 rounded-full bg-success shrink-0" />
                <span>Bukti tiap item terlampir</span>
              </li>
            </ul>

            {/* Catatan Textarea */}
            <div className="space-y-1.5 pt-1">
              <label
                htmlFor="catatan-verifikasi-kaprodi"
                className="sr-only"
              >
                Catatan untuk dosen
              </label>
              <textarea
                id="catatan-verifikasi-kaprodi"
                rows={3}
                placeholder="Catatan untuk dosen (wajib jika ditolak)..."
                value={catatanKaprodi}
                onChange={(e) => setCatatanKaprodi(e.target.value)}
                disabled={!canVerify || verifyMutation.isPending}
                className="w-full rounded-2xl border border-border-soft bg-surface px-4 py-3 text-body-sm text-ink placeholder:text-ink-subtle focus:border-primary focus:bg-white focus:outline-none disabled:opacity-60"
              />
              {validationError && (
                <p role="alert" className="text-body-sm font-medium text-danger">
                  {validationError}
                </p>
              )}
              {feedbackMessage && (
                <p className="text-body-sm font-medium text-success">
                  {feedbackMessage}
                </p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="space-y-2.5 pt-1">
              <Button
                variant="primary"
                size="md"
                fullWidth
                disabled={!canVerify}
                isLoading={verifyMutation.isPending}
                onClick={() => void handleVerify("approve")}
              >
                Setujui &middot; Tandai Tercapai
              </Button>
              <Button
                variant="danger"
                size="md"
                fullWidth
                disabled={!canVerify}
                isLoading={verifyMutation.isPending}
                onClick={() => void handleVerify("reject")}
              >
                Tolak &middot; Minta Revisi
              </Button>
            </div>
          </Card>

          <Card className="p-6 space-y-4">
            <h3 className="font-heading text-h6 font-bold text-ink">
              Riwayat Tiket
            </h3>

            <ol className="space-y-3">
              {ticket.riwayatTiket.map((rt, idx) => {
                const isLast = idx === ticket.riwayatTiket.length - 1;
                const isRejectHistory = rt.statusRiwayat
                  .toLowerCase()
                  .includes("ditolak");
                return (
                  <li key={rt.id} className="flex items-start gap-3">
                    <span
                      className={cn(
                        "mt-1.5 h-2.5 w-2.5 rounded-full shrink-0",
                        isRejectHistory
                          ? "bg-danger"
                          : isLast && rt.statusRiwayat.includes("Menunggu")
                            ? "bg-accent"
                            : "bg-primary",
                      )}
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
    </div>
  );
}
