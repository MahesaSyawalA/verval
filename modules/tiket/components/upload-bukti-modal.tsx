"use client";

import { Plus, UploadCloud } from "lucide-react";
import { useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { Alert, alertToast, Button, Input, ModalForm, StatusChip } from "@/components/ui";
import { AppError } from "@/lib/http";
import { uploadBuktiFileApi } from "../api";
import { useSubmitBukti } from "../hooks/use-tickets";
import type { TicketItem } from "../types";

export interface UploadBuktiModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticket: TicketItem;
}

export function UploadBuktiModal({
  isOpen,
  onClose,
  ticket,
}: UploadBuktiModalProps) {
  const submitMutation = useSubmitBukti(ticket.id);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [activeUrutan, setActiveUrutan] = useState<number>(1);
  const [totalItems, setTotalItems] = useState<number>(() => {
    const maxExisting = ticket.isianBukti.reduce(
      (max, b) => Math.max(max, b.urutanSubmisi),
      1,
    );
    return Math.max(1, maxExisting);
  });

  // Keyed by `${urutanSubmisi}:${formatBuktiId}`
  const [valuesMap, setValuesMap] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const ib of ticket.isianBukti) {
      initial[`${ib.urutanSubmisi}:${ib.formatBuktiId}`] = ib.nilaiIsian;
    }
    return initial;
  });

  const [uploadedFileName, setUploadedFileName] = useState<string>(
    () => `Surat_Tugas_${ticket.kodeTiket.replace(/[^0-9]/g, "") || "014"}.pdf · 212 KB`,
  );
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  function getValue(urutan: number, formatBuktiId: string): string {
    return valuesMap[`${urutan}:${formatBuktiId}`] ?? "";
  }

  function setValue(urutan: number, formatBuktiId: string, val: string) {
    setValuesMap((prev) => ({
      ...prev,
      [`${urutan}:${formatBuktiId}`]: val,
    }));
  }

  async function handleFileSelect(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingFile(true);
    setFormError(null);
    try {
      const uploaded = await uploadBuktiFileApi(file);
      const sizeKb = Math.max(1, Math.round(uploaded.size / 1024));
      setUploadedFileName(`${uploaded.fileName} · ${sizeKb} KB`);

      // Also populate any File-type formatBukti on the active urutan
      const fileFormat = ticket.formatBukti.find((f) => f.tipeData === "File");
      if (fileFormat) {
        setValue(activeUrutan, fileFormat.id, uploaded.path);
      }
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Gagal mengunggah berkas PDF.",
      );
    } finally {
      setIsUploadingFile(false);
    }
  }

  async function handleAction(action: "draft" | "submit") {
    setFormError(null);

    const submissions: Array<{
      formatBuktiId: string;
      urutanSubmisi: number;
      nilaiIsian: string;
    }> = [];

    for (let u = 1; u <= totalItems; u++) {
      for (const fb of ticket.formatBukti) {
        const raw = getValue(u, fb.id).trim();
        if (raw) {
          submissions.push({
            formatBuktiId: fb.id,
            urutanSubmisi: u,
            nilaiIsian: raw,
          });
        } else if (action === "submit" && u === activeUrutan && fb.statusIsian === "Wajib") {
          setFormError(
            `Isian wajib "${fb.namaField}" pada item #${u} belum diisi.`,
          );
          return;
        }
      }
    }

    if (submissions.length === 0) {
      // Provide fallback entry if user only uploaded Surat Tugas
      const firstFormat = ticket.formatBukti[0];
      if (!firstFormat) {
        setFormError("Format bukti belum tersedia pada target ini.");
        return;
      }
      submissions.push({
        formatBuktiId: firstFormat.id,
        urutanSubmisi: 1,
        nilaiIsian: uploadedFileName,
      });
    }

    try {
      await submitMutation.mutateAsync({
        action,
        submissions,
      });
      alertToast.success(
        action === "submit"
          ? "Bukti kegiatan berhasil dikirim untuk verifikasi Kaprodi."
          : "Draf bukti kegiatan berhasil disimpan.",
      );
      onClose();
    } catch (err) {
      if (err instanceof AppError) {
        setFormError(err.message);
      } else {
        setFormError("Gagal menyimpan bukti kegiatan.");
      }
    }
  }

  function handleFormSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    void handleAction("submit");
  }

  return (
    <ModalForm
      isOpen={isOpen}
      onClose={onClose}
      title={`Unggah Bukti · ${ticket.kodeTiket}`}
      subtitle={`Target ${ticket.kodeTarget} ${ticket.namaTarget} · terisi ${ticket.progresSubmisiCount} dari ${ticket.kuantitasDitugaskan}`}
      size="lg"
    >
      <form onSubmit={handleFormSubmit} className="space-y-4" noValidate>
        {formError && <Alert status="error">{formError}</Alert>}

        <div className="space-y-2.5">
          <span className="block text-body-sm font-semibold text-ink">
            Surat Tugas
          </span>

          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
            onChange={handleFileSelect}
            className="hidden"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full rounded-2xl border-2 border-dashed border-primary/50 bg-surface/40 px-6 py-6 text-center hover:bg-primary-50/50 transition-colors cursor-pointer"
          >
            <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-primary-50 text-primary">
              <UploadCloud className="h-5 w-5" />
            </div>
            <p className="font-heading text-body-md font-semibold text-primary">
              {isUploadingFile
                ? "Mengunggah berkas..."
                : "Tarik file ke sini atau klik untuk memilih"}
            </p>
            <p className="mt-0.5 text-body-sm text-ink-muted">
              PDF maksimal 5 MB
            </p>
          </button>

          <div className="flex items-center justify-between rounded-2xl bg-surface px-4 py-3">
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center rounded-full bg-danger-bg px-3 py-1 text-body-sm font-bold text-danger-ink">
                PDF
              </span>
              <span className="text-body-sm font-semibold text-ink">
                {uploadedFileName}
              </span>
            </div>
            <StatusChip status="Terunggah" tone="success" />
          </div>
        </div>

        {/* Dynamic Fields from format_bukti */}
        <div className="space-y-3 pt-1">
          {ticket.formatBukti.map((fb) => (
            <Input
              key={`${activeUrutan}-${fb.id}`}
              name={`bukti-${fb.id}`}
              type={
                fb.tipeData === "Angka"
                  ? "number"
                  : fb.tipeData === "Tanggal"
                    ? "date"
                    : "text"
              }
              label={`${fb.namaField}${fb.statusIsian === "Wajib" ? " *" : ""}`}
              placeholder={
                fb.tipeData === "Tautan"
                  ? "https://doi.org/..."
                  : `Tuliskan ${fb.namaField.toLowerCase()}...`
              }
              value={getValue(activeUrutan, fb.id)}
              onChange={(e) => setValue(activeUrutan, fb.id, e.target.value)}
            />
          ))}
        </div>

        {/* Multi-submission item pills */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          {Array.from({ length: totalItems }, (_, i) => i + 1).map((u) => {
            const firstField = ticket.formatBukti[0];
            const labelPreview = firstField
              ? getValue(u, firstField.id) || `Submisi #${u}`
              : `Submisi #${u}`;

            return (
              <button
                key={u}
                type="button"
                onClick={() => setActiveUrutan(u)}
                className={`rounded-full px-3.5 py-1.5 text-body-sm font-semibold transition-colors cursor-pointer ${
                  activeUrutan === u
                    ? "bg-primary text-white"
                    : "bg-primary-50 text-primary hover:bg-primary-100"
                }`}
              >
                {labelPreview.slice(0, 24)}
              </button>
            );
          })}

          {totalItems < ticket.kuantitasDitugaskan && (
            <button
              type="button"
              onClick={() => {
                const next = totalItems + 1;
                setTotalItems(next);
                setActiveUrutan(next);
              }}
              className="inline-flex items-center gap-1 rounded-full bg-warning-bg px-3.5 py-1.5 text-body-sm font-semibold text-ink hover:bg-accent-200 transition-colors cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              Tambah
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            size="lg"
            fullWidth
            isLoading={submitMutation.isPending}
            onClick={() => void handleAction("draft")}
          >
            Simpan Draf
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            isLoading={submitMutation.isPending}
          >
            Kirim untuk Verifikasi
          </Button>
        </div>
      </form>
    </ModalForm>
  );
}
