"use client";

import { useState, type FormEvent } from "react";
import { Button, Input, ModalForm, TextArea } from "@/components/ui";
import { AppError, formatZodError } from "@/lib/http";
import type { MasterTargetItem } from "@/modules/target";
import { useCreateTicket } from "../hooks/use-tickets";
import { createTiketSchema } from "../schemas/tiket.schema";
import {
  PRIORITAS_TIKET_VALUES,
  type DosenOption,
  type PrioritasTiketType,
} from "../types";

export interface CreateTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  targets: MasterTargetItem[];
  dosenOptions: DosenOption[];
  nextTicketNumber: number;
}

export function CreateTicketModal({
  isOpen,
  onClose,
  targets,
  dosenOptions,
  nextTicketNumber,
}: CreateTicketModalProps) {
  const createMutation = useCreateTicket();

  const defaultTarget = targets[0];
  const [targetId, setTargetId] = useState(() => defaultTarget?.id ?? "");
  const [dosenId, setDosenId] = useState(() => dosenOptions[0]?.id ?? "");
  const [kuantitasDitugaskan, setKuantitasDitugaskan] = useState("3");
  const [judulKegiatan, setJudulKegiatan] = useState(
    () => defaultTarget?.namaTarget ?? "",
  );
  const [tenggatWaktu, setTenggatWaktu] = useState("2026-11-30");
  const [prioritas, setPrioritas] = useState<PrioritasTiketType>("Normal");
  const [catatanKaprodi, setCatatanKaprodi] = useState("");
  const [isReminderActive, setIsReminderActive] = useState(true);

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);

  const selectedTarget =
    targets.find((t) => t.id === targetId) ?? defaultTarget;
  const satuanLabel = selectedTarget?.satuan.toLowerCase() ?? "item";
  const previewCode = `#TGT-2026-${String(nextTicketNumber).padStart(3, "0")}`;

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFieldErrors({});
    setFormError(null);

    const parsed = createTiketSchema.safeParse({
      targetId,
      dosenId,
      kuantitasDitugaskan: Number(kuantitasDitugaskan),
      tenggatWaktu,
      prioritas,
      isReminderActive,
      catatanKaprodi: catatanKaprodi.trim() || undefined,
    });

    if (!parsed.success) {
      setFieldErrors(formatZodError(parsed.error));
      return;
    }

    try {
      await createMutation.mutateAsync(parsed.data);
      onClose();
    } catch (err) {
      if (err instanceof AppError) {
        if (err.fields) setFieldErrors(err.fields);
        setFormError(err.message);
      } else {
        setFormError("Gagal membuat tiket penugasan.");
      }
    }
  }

  return (
    <ModalForm
      isOpen={isOpen}
      onClose={onClose}
      title="Buat Penugasan"
      subtitle="Tiket dibuat otomatis dan dosen mendapat notifikasi"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {formError && (
          <div
            role="alert"
            className="rounded-2xl border border-danger/30 bg-danger-bg px-4 py-3 text-body-sm font-medium text-danger-ink"
          >
            {formError}
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="penugasan-target"
            className="text-body-sm font-medium text-ink"
          >
            Target (master target 2026)
          </label>
          <select
            id="penugasan-target"
            value={targetId}
            onChange={(e) => {
              const nextId = e.target.value;
              setTargetId(nextId);
              const found = targets.find((t) => t.id === nextId);
              if (found) setJudulKegiatan(found.namaTarget);
            }}
            className="h-11 w-full rounded-2xl border border-border-soft bg-white px-4 text-body-md text-ink focus:border-primary focus:outline-none"
          >
            {targets.map((t) => (
              <option key={t.id} value={t.id}>
                {t.kodeTarget} · {t.namaTarget}
              </option>
            ))}
          </select>
          {fieldErrors.targetId && (
            <p className="text-body-sm text-danger">{fieldErrors.targetId}</p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="penugasan-dosen"
              className="text-body-sm font-medium text-ink"
            >
              Dosen
            </label>
            <select
              id="penugasan-dosen"
              value={dosenId}
              onChange={(e) => setDosenId(e.target.value)}
              className="h-11 w-full rounded-2xl border border-border-soft bg-white px-4 text-body-md text-ink focus:border-primary focus:outline-none"
            >
              {dosenOptions.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.namaLengkap}
                </option>
              ))}
            </select>
            {fieldErrors.dosenId && (
              <p className="text-body-sm text-danger">{fieldErrors.dosenId}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="penugasan-kuantitas"
              className="text-body-sm font-medium text-ink"
            >
              Kuantitas dibebankan
            </label>
            <select
              id="penugasan-kuantitas"
              value={kuantitasDitugaskan}
              onChange={(e) => setKuantitasDitugaskan(e.target.value)}
              className="h-11 w-full rounded-2xl border border-border-soft bg-white px-4 text-body-md text-ink focus:border-primary focus:outline-none"
            >
              {[1, 2, 3, 4, 5, 8, 10, 12, 20].map((num) => (
                <option key={num} value={String(num)}>
                  {num} {satuanLabel}
                </option>
              ))}
            </select>
            {fieldErrors.kuantitasDitugaskan && (
              <p className="text-body-sm text-danger">
                {fieldErrors.kuantitasDitugaskan}
              </p>
            )}
          </div>
        </div>

        <Input
          name="judulKegiatan"
          label="Judul kegiatan"
          placeholder="Artikel jurnal terakreditasi"
          value={judulKegiatan}
          onChange={(e) => setJudulKegiatan(e.target.value)}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            name="tenggatWaktu"
            type="date"
            label="Tenggat"
            value={tenggatWaktu}
            onChange={(e) => setTenggatWaktu(e.target.value)}
            error={fieldErrors.tenggatWaktu}
          />

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="penugasan-prioritas"
              className="text-body-sm font-medium text-ink"
            >
              Prioritas
            </label>
            <select
              id="penugasan-prioritas"
              value={prioritas}
              onChange={(e) =>
                setPrioritas(e.target.value as PrioritasTiketType)
              }
              className="h-11 w-full rounded-2xl border border-border-soft bg-white px-4 text-body-md text-ink focus:border-primary focus:outline-none"
            >
              {PRIORITAS_TIKET_VALUES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <TextArea
            id="penugasan-catatan"
            label="Catatan untuk dosen"
            rows={3}
            placeholder="Tuliskan catatan atau instruksi tambahan..."
            value={catatanKaprodi}
            onChange={(e) => setCatatanKaprodi(e.target.value)}
          />
        </div>

        <div className="flex items-center justify-between rounded-2xl bg-surface px-4 py-3">
          <div>
            <p className="text-body-md font-semibold text-ink">
              Kirim pengingat otomatis
            </p>
            <p className="text-body-sm text-ink-muted">
              7 hari dan 1 hari sebelum tenggat
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={isReminderActive}
            onClick={() => setIsReminderActive((prev) => !prev)}
            className={`relative inline-flex h-7 w-13 items-center rounded-full transition-colors cursor-pointer ${
              isReminderActive ? "bg-primary" : "bg-border-soft"
            }`}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                isReminderActive ? "translate-x-7" : "translate-x-1"
              }`}
            />
          </button>
        </div>

        <div className="rounded-2xl bg-warning-bg px-4 py-3 text-body-sm font-semibold text-warning-ink">
          Tiket otomatis: {previewCode} · Status awal: Ditugaskan
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            size="lg"
            fullWidth
            onClick={onClose}
            disabled={createMutation.isPending}
          >
            Batal
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            isLoading={createMutation.isPending}
          >
            Buat Tiket &amp; Kirim
          </Button>
        </div>
      </form>
    </ModalForm>
  );
}
