"use client";

import { Plus, X } from "lucide-react";
import { useState, type FormEvent } from "react";
import {
  Alert,
  alertToast,
  BareInput,
  Button,
  Input,
  ModalForm,
  Select,
} from "@/components/ui";
import { AppError, formatZodError } from "@/lib/http";
import { validateAndSanitizeForm } from "@/lib/security-client";
import {
  useCreateTarget,
  useDeleteTarget,
  useUpdateTarget,
} from "../hooks/use-targets";
import {
  masterTargetSchema,
  type FormatBuktiInput,
} from "../schemas/target.schema";
import {
  STATUS_ISIAN_BUKTI_VALUES,
  TIPE_DATA_BUKTI_VALUES,
  type MasterTargetItem,
} from "../types";

export interface TargetFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingTarget?: MasterTargetItem | null;
  suggestedCode?: string;
  isLoading?: boolean;
}

const DEFAULT_FORMAT_BUKTI: FormatBuktiInput[] = [
  { namaField: "Judul buku", tipeData: "Teks", statusIsian: "Wajib" },
  { namaField: "Penerbit dan ISBN", tipeData: "Teks", statusIsian: "Wajib" },
  { namaField: "Tanggal terbit", tipeData: "Tanggal", statusIsian: "Wajib" },
  { namaField: "File bukti", tipeData: "File", statusIsian: "Opsional" },
];

const SATUAN_OPTIONS = [
  "Artikel",
  "Buku",
  "Kegiatan",
  "Rapat",
  "Mahasiswa",
  "Sertifikat",
  "Dokumen",
];

export function TargetFormModal({
  isOpen,
  onClose,
  editingTarget,
  suggestedCode = "T-06",
  isLoading = false,
}: TargetFormModalProps) {
  const isEditing = Boolean(editingTarget);
  const createMutation = useCreateTarget();
  const updateMutation = useUpdateTarget();
  const deleteMutation = useDeleteTarget();

  const [kodeTarget, setKodeTarget] = useState(
    () => editingTarget?.kodeTarget ?? suggestedCode,
  );
  const [level, setLevel] = useState("Prodi");
  const [namaTarget, setNamaTarget] = useState(
    () => editingTarget?.namaTarget ?? "",
  );
  const [kuantitasTotal, setKuantitasTotal] = useState(() =>
    editingTarget ? String(editingTarget.kuantitasTotal) : "2",
  );
  const [satuan, setSatuan] = useState(() => editingTarget?.satuan ?? "Buku");
  const [tahun, setTahun] = useState(() =>
    editingTarget ? String(editingTarget.tahun) : "2026",
  );
  const [formatBukti, setFormatBukti] = useState<FormatBuktiInput[]>(() =>
    editingTarget
      ? editingTarget.formatBukti.map((fb) => ({
          id: fb.id,
          namaField: fb.namaField,
          tipeData: fb.tipeData,
          statusIsian: fb.statusIsian,
        }))
      : DEFAULT_FORMAT_BUKTI.map((item) => ({ ...item })),
  );
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);

  function handleAddFormatField() {
    setFormatBukti((prev) => [
      ...prev,
      { namaField: "", tipeData: "Teks", statusIsian: "Wajib" },
    ]);
  }

  function handleRemoveFormatField(index: number) {
    setFormatBukti((prev) =>
      prev.length > 1 ? prev.filter((_, idx) => idx !== index) : prev,
    );
  }

  function handleChangeFormatField(
    index: number,
    patch: Partial<FormatBuktiInput>,
  ) {
    setFormatBukti((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, ...patch } : item)),
    );
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFieldErrors({});
    setFormError(null);

    const sanitized = validateAndSanitizeForm({
      kodeTarget,
      namaTarget,
      kuantitasTotal: Number(kuantitasTotal),
      satuan,
      tahun: Number(tahun),
      formatBukti,
    });

    if (!sanitized) {
      return;
    }

    const parsed = masterTargetSchema.safeParse(sanitized);

    if (!parsed.success) {
      setFieldErrors(formatZodError(parsed.error));
      return;
    }

    try {
      if (isEditing && editingTarget) {
        await updateMutation.mutateAsync({
          id: editingTarget.id,
          input: parsed.data,
        });
        alertToast.success("Master target berhasil diperbarui.");
      } else {
        await createMutation.mutateAsync(parsed.data);
        alertToast.success("Master target berhasil ditambahkan.");
      }
      onClose();
    } catch (err) {
      if (err instanceof AppError) {
        if (err.fields) setFieldErrors(err.fields);
        setFormError(err.message);
      } else {
        setFormError("Gagal menyimpan master target.");
      }
    }
  }

  async function handleDelete() {
    if (!editingTarget) return;
    setFormError(null);
    try {
      await deleteMutation.mutateAsync(editingTarget.id);
      alertToast.info("Master target telah dihapus.");
      onClose();
    } catch (err) {
      if (err instanceof AppError) {
        setFormError(err.message);
      } else {
        setFormError("Gagal menghapus target.");
      }
    }
  }

  const isPending =
    createMutation.isPending ||
    updateMutation.isPending ||
    deleteMutation.isPending;

  return (
    <ModalForm
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? "Ubah Target" : "Tambah Target"}
      subtitle="Atur isian bukti sendiri karena bisa berubah tiap tahun"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {formError && <Alert status="error">{formError}</Alert>}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            name="kodeTarget"
            label="Kode"
            isLoading={isLoading}
            placeholder="T-06"
            value={kodeTarget}
            onChange={(e) => setKodeTarget(e.target.value)}
            error={fieldErrors.kodeTarget}
          />

          <Select
            id="target-level"
            label="Level"
            isLoading={isLoading}
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            options={[
              { value: "Prodi", label: "Prodi" },
              { value: "Dosen", label: "Dosen" },
            ]}
          />
        </div>

        <Input
          name="namaTarget"
          label="Nama target"
          isLoading={isLoading}
          placeholder="Publikasi buku ajar atau monograf"
          value={namaTarget}
          onChange={(e) => setNamaTarget(e.target.value)}
          error={fieldErrors.namaTarget}
        />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input
            name="kuantitasTotal"
            type="number"
            min={1}
            label="Kuantitas target"
            isLoading={isLoading}
            value={kuantitasTotal}
            onChange={(e) => setKuantitasTotal(e.target.value)}
            error={fieldErrors.kuantitasTotal}
          />

          <Select
            id="target-satuan"
            label="Satuan"
            isLoading={isLoading}
            value={satuan}
            onChange={(e) => setSatuan(e.target.value)}
            error={fieldErrors.satuan}
            options={SATUAN_OPTIONS.map((opt) => ({
              value: opt,
              label: opt,
            }))}
          />

          <Select
            id="target-tahun"
            label="Tahun"
            isLoading={isLoading}
            value={tahun}
            onChange={(e) => setTahun(e.target.value)}
            options={[
              { value: "2025", label: "2025" },
              { value: "2026", label: "2026" },
              { value: "2027", label: "2027" },
            ]}
          />
        </div>

        <div className="space-y-3 pt-1">
          <span className="block text-body-sm font-medium text-ink">
            Isian Bukti (dinamis)
          </span>

          <div className="space-y-2.5">
            {formatBukti.map((field, idx) => (
              <div
                key={field.id ?? `field-${idx}`}
                className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center"
              >
                <div className="sm:col-span-6">
                  <BareInput
                    type="text"
                    aria-label={`Nama isian bukti ${idx + 1}`}
                    placeholder="Nama isian (contoh: Judul buku)"
                    value={field.namaField}
                    onChange={(e) =>
                      handleChangeFormatField(idx, {
                        namaField: e.target.value,
                      })
                    }
                    className="h-11 w-full rounded-2xl border border-border-soft bg-white px-4 text-body-md text-ink placeholder:text-ink-subtle focus:border-primary focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-3">
                  <Select
                    aria-label={`Tipe data isian ${idx + 1}`}
                    value={field.tipeData}
                    onChange={(e) =>
                      handleChangeFormatField(idx, {
                        tipeData: e.target
                          .value as FormatBuktiInput["tipeData"],
                      })
                    }
                    triggerClassName="px-3"
                    options={TIPE_DATA_BUKTI_VALUES.map((t) => ({
                      value: t,
                      label: t,
                    }))}
                  />
                </div>

                <div className="sm:col-span-2">
                  <Select
                    aria-label={`Status wajib isian ${idx + 1}`}
                    value={field.statusIsian}
                    onChange={(e) =>
                      handleChangeFormatField(idx, {
                        statusIsian: e.target
                          .value as FormatBuktiInput["statusIsian"],
                      })
                    }
                    triggerClassName="px-3"
                    options={STATUS_ISIAN_BUKTI_VALUES.map((s) => ({
                      value: s,
                      label: s,
                    }))}
                  />
                </div>

                <div className="sm:col-span-1 flex justify-end">
                  <button
                    type="button"
                    onClick={() => handleRemoveFormatField(idx)}
                    aria-label={`Hapus isian ${idx + 1}`}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-danger-bg text-danger hover:opacity-80 transition-opacity cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={handleAddFormatField}
            className="inline-flex items-center gap-1.5 rounded-full bg-warning-bg px-4 py-1.5 text-body-sm font-semibold text-ink hover:bg-accent-200 transition-colors cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Tambah Isian
          </button>

          <div className="rounded-2xl bg-info-bg px-4 py-3 text-body-sm font-medium text-info-ink">
            Tipe: Teks, Angka, Tanggal, Tautan, File. Form upload bukti dosen
            dibuat otomatis dari daftar ini.
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="lg"
              fullWidth
              onClick={onClose}
              disabled={isPending}
            >
              Batal
            </Button>
            {isEditing &&
              editingTarget &&
              editingTarget.kuantitasDitugaskan === 0 && (
                <Button
                  type="button"
                  variant="danger"
                  size="lg"
                  onClick={handleDelete}
                  isLoading={deleteMutation.isPending}
                >
                  Hapus
                </Button>
              )}
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            isLoading={createMutation.isPending || updateMutation.isPending}
          >
            Simpan Target
          </Button>
        </div>
      </form>
    </ModalForm>
  );
}
