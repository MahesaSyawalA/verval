"use client";

import { Upload, X } from "lucide-react";
import { useRef, useState } from "react";
import {
  Alert,
  alertToast,
  Button,
  DatePicker,
  Input,
  ModalForm,
  Select,
  TextArea,
} from "@/components/ui";
import { cn, getInitials } from "@/lib/utils";
import { uploadUndanganFileApi } from "../api";
import { useCreateAgendaRapat } from "../hooks/use-rapat";
import { createAgendaRapatSchema } from "../schemas/rapat.schema";
import {
  FORMAT_RAPAT_VALUES,
  type FormatRapatType,
  type MetodeUndanganType,
  type RapatUserOption,
} from "../types";
import { PreviewUndanganModal } from "./preview-undangan-modal";

export interface CreateAgendaModalProps {
  isOpen: boolean;
  onClose: () => void;
  userOptions: RapatUserOption[];
}

export function CreateAgendaModal({
  isOpen,
  onClose,
  userOptions,
}: CreateAgendaModalProps) {
  const createMutation = useCreateAgendaRapat();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [judulRapat, setJudulRapat] = useState(
    "Evaluasi Kinerja Dosen Semester Ganjil",
  );
  const [tanggal, setTanggal] = useState("2026-10-21");
  const [waktuMulai, setWaktuMulai] = useState("13:00");
  const [waktuSelesai, setWaktuSelesai] = useState("14:30");
  const [format, setFormat] = useState<FormatRapatType>("Luring");
  const [lokasi, setLokasi] = useState("Ruang Sidang B");
  const [pesertaIds, setPesertaIds] = useState<string[]>([]);
  const [pesertaSelectValue, setPesertaSelectValue] = useState<string>("");
  const [notulisId, setNotulisId] = useState<string>(
    () => userOptions[1]?.id ?? userOptions[0]?.id ?? "",
  );
  const [deskripsiAgenda, setDeskripsiAgenda] = useState(
    "Evaluasi capaian publikasi, pengabdian, dan bimbingan tugas akhir semester ganjil.",
  );
  const [metodeUndangan, setMetodeUndangan] =
    useState<MetodeUndanganType>("Generate_Otomatis");
  const [fileUndangan, setFileUndangan] = useState<string>("");
  const [uploadedFileName, setUploadedFileName] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const [isReminderActive, setIsReminderActive] = useState(true);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const selectedPeserta = userOptions.filter((u) => pesertaIds.includes(u.id));

  function handleAddPeserta(id: string) {
    if (!id) return;
    if (id === "ALL") {
      setPesertaIds(userOptions.map((u) => u.id));
    } else {
      setPesertaIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
    }
    setPesertaSelectValue("");
  }

  function handleRemovePeserta(id: string) {
    setPesertaIds((prev) => prev.filter((item) => item !== id));
  }

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setErrorMessage(null);
    setIsUploading(true);
    try {
      const uploaded = await uploadUndanganFileApi(file);
      setFileUndangan(uploaded.path);
      setUploadedFileName(uploaded.fileName);
    } catch (err) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : "Gagal mengunggah berkas surat undangan.",
      );
    } finally {
      setIsUploading(false);
    }
  }

  async function handleSubmit() {
    setErrorMessage(null);
    const effectiveNotulisId = notulisId || userOptions[0]?.id || "";

    const parsed = createAgendaRapatSchema.safeParse({
      judulRapat,
      tanggal,
      waktuMulai,
      waktuSelesai,
      format,
      lokasi,
      pesertaIds,
      notulisId: effectiveNotulisId,
      deskripsiAgenda,
      metodeUndangan,
      fileUndangan: fileUndangan || undefined,
      isReminderActive,
    });

    if (!parsed.success) {
      setErrorMessage(
        parsed.error.issues[0]?.message ?? "Data agenda rapat belum lengkap.",
      );
      return;
    }

    try {
      await createMutation.mutateAsync(parsed.data);
      alertToast.success(
        "Agenda rapat berhasil dijadwalkan dan undangan dikirim.",
      );
      setPreviewOpen(false);
      onClose();
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Gagal menyimpan agenda rapat.",
      );
    }
  }

  return (
    <>
      <ModalForm
        isOpen={isOpen && !previewOpen}
        onClose={onClose}
        title="Buat Agenda Rapat"
        subtitle="Jadwalkan rapat dan undang peserta"
        size="lg"
        footer={
          <>
            <Button
              variant="outline"
              size="md"
              fullWidth
              onClick={onClose}
              disabled={createMutation.isPending}
            >
              Batal
            </Button>
            <Button
              variant="primary"
              size="md"
              fullWidth
              isLoading={createMutation.isPending}
              onClick={() => void handleSubmit()}
            >
              Simpan & Kirim Undangan
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Judul Rapat"
            value={judulRapat}
            onChange={(e) => setJudulRapat(e.target.value)}
            placeholder="Evaluasi Kinerja Dosen Semester Ganjil"
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <DatePicker
              label="Tanggal"
              value={tanggal}
              onChange={(e) => setTanggal(e.target.value)}
            />
            <Input
              label="Mulai"
              type="time"
              value={waktuMulai}
              onChange={(e) => setWaktuMulai(e.target.value)}
            />
            <Input
              label="Selesai"
              type="time"
              value={waktuSelesai}
              onChange={(e) => setWaktuSelesai(e.target.value)}
            />
          </div>

          {/* Format Rapat Segmented */}
          <div className="space-y-1.5">
            <span className="block text-body-sm font-semibold text-ink">
              Format Rapat
            </span>
            <div className="grid grid-cols-3 rounded-2xl bg-surface p-1">
              {FORMAT_RAPAT_VALUES.map((item) => {
                const active = format === item;
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setFormat(item)}
                    className={cn(
                      "rounded-xl py-2.5 text-body-sm font-semibold transition-colors cursor-pointer",
                      active
                        ? "bg-primary text-white shadow-xs"
                        : "text-ink-muted hover:text-ink",
                    )}
                  >
                    {item}
                  </button>
                );
              })}
            </div>
          </div>

          <Input
            label="Lokasi"
            value={lokasi}
            onChange={(e) => setLokasi(e.target.value)}
            placeholder="Ruang Sidang B"
          />

          {/* Peserta */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label
                htmlFor="select-target-peserta"
                className="text-body-sm font-semibold text-ink"
              >
                Peserta Rapat ({selectedPeserta.length} dipilih)
              </label>
              <div className="flex items-center gap-2">
                {selectedPeserta.length < userOptions.length && (
                  <button
                    type="button"
                    onClick={() => setPesertaIds(userOptions.map((u) => u.id))}
                    className="text-body-sm font-medium text-primary hover:underline cursor-pointer"
                  >
                    Pilih Semua ({userOptions.length})
                  </button>
                )}
                {selectedPeserta.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setPesertaIds([])}
                    className="text-body-sm font-medium text-danger hover:underline cursor-pointer"
                  >
                    Kosongkan
                  </button>
                )}
              </div>
            </div>

            <Select
              id="select-target-peserta"
              placeholder="Pilih dosen / target peserta untuk ditambahkan..."
              value={pesertaSelectValue}
              onChange={(e) => handleAddPeserta(e.target.value)}
              options={[
                {
                  value: "ALL",
                  label: `👥 Semua Dosen (${userOptions.length} orang)`,
                  disabled: selectedPeserta.length === userOptions.length,
                },
                ...userOptions.map((u) => ({
                  value: u.id,
                  label: pesertaIds.includes(u.id)
                    ? `✓ ${u.namaLengkap} (Sudah dipilih)`
                    : u.namaLengkap,
                })),
              ]}
              aria-label="Pilih peserta rapat"
            />

            {/* Chips Peserta */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {selectedPeserta.map((p, idx) => (
                <span
                  key={p.id}
                  className="inline-flex items-center gap-2 rounded-full border border-border-soft bg-surface px-3 py-1.5 text-body-sm font-medium text-ink shadow-xs"
                >
                  <span
                    className={cn(
                      "flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold text-ink",
                      idx % 2 === 0 ? "bg-secondary" : "bg-accent",
                    )}
                  >
                    {getInitials(p.namaLengkap).slice(0, 1)}
                  </span>
                  <span>{p.namaLengkap.split(",")[0]}</span>
                  <button
                    type="button"
                    onClick={() => handleRemovePeserta(p.id)}
                    className="text-ink-muted hover:text-danger cursor-pointer transition-colors"
                    aria-label={`Hapus ${p.namaLengkap}`}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </span>
              ))}

              {selectedPeserta.length === 0 && (
                <p className="text-body-sm text-ink-muted italic py-1">
                  Belum ada peserta yang dipilih. Silakan pilih peserta melalui pilihan di atas.
                </p>
              )}
            </div>
          </div>

          {/* Notulis */}
          <div className="space-y-1.5">
            <Select
              id="select-notulis-rapat"
              label="Notulis"
              labelClassName="font-semibold"
              value={notulisId}
              onChange={(e) => setNotulisId(e.target.value)}
              helperText="Dosen yang ditunjuk akan mengisi notulensi rapat ini."
              options={userOptions.map((u) => ({
                value: u.id,
                label: u.namaLengkap,
              }))}
            />
          </div>

          {/* Agenda / Deskripsi */}
          <div className="space-y-1.5">
            <TextArea
              id="textarea-agenda-deskripsi"
              label="Agenda / Deskripsi"
              labelClassName="font-semibold"
              size="sm"
              rows={3}
              value={deskripsiAgenda}
              onChange={(e) => setDeskripsiAgenda(e.target.value)}
              placeholder="Tuliskan pokok bahasan rapat..."
            />
          </div>

          {/* Surat Undangan Segmented */}
          <div className="space-y-2.5">
            <span className="block text-body-sm font-semibold text-ink">
              Surat Undangan
            </span>
            <div className="grid grid-cols-2 rounded-2xl bg-surface p-1">
              <button
                type="button"
                onClick={() => setMetodeUndangan("Generate_Otomatis")}
                className={cn(
                  "rounded-xl py-2.5 text-body-sm font-semibold transition-colors cursor-pointer",
                  metodeUndangan === "Generate_Otomatis"
                    ? "bg-primary text-white shadow-xs"
                    : "text-ink-muted hover:text-ink",
                )}
              >
                Generate otomatis
              </button>
              <button
                type="button"
                onClick={() => setMetodeUndangan("Upload_Manual")}
                className={cn(
                  "rounded-xl py-2.5 text-body-sm font-semibold transition-colors cursor-pointer",
                  metodeUndangan === "Upload_Manual"
                    ? "bg-primary text-white shadow-xs"
                    : "text-ink-muted hover:text-ink",
                )}
              >
                Upload manual
              </button>
            </div>

            {metodeUndangan === "Generate_Otomatis" ? (
              <div className="flex items-center justify-between gap-3 rounded-2xl bg-primary-50 px-4 py-3.5">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary font-heading text-body-sm font-bold text-white">
                    U
                  </span>
                  <div>
                    <p className="text-body-sm font-bold text-ink">
                      Undangan dibuat otomatis
                    </p>
                    <p className="text-[12px] text-ink-muted">
                      Memakai kop surat prodi, judul, jadwal, dan lokasi di atas
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setPreviewOpen(true)}
                  className="text-body-sm font-bold text-primary hover:underline shrink-0 cursor-pointer"
                >
                  Lihat preview
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-primary/30 bg-surface px-4 py-6 text-center space-y-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-50 text-primary">
                  <Upload className="h-5 w-5" />
                </div>
                <p className="text-body-sm font-bold text-ink">
                  {uploadedFileName || "Tarik surat undangan ke sini"}
                </p>
                <p className="text-[12px] text-ink-muted">
                  PDF &middot; maks 5 MB &middot; tersimpan sebagai bagian U di
                  arsip rapat
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => void handleFileSelect(e)}
                  className="hidden"
                />
                <Button
                  variant="accent"
                  size="sm"
                  isLoading={isUploading}
                  onClick={() => fileInputRef.current?.click()}
                >
                  Pilih File
                </Button>
              </div>
            )}
          </div>

          {/* Pengingat Otomatis */}
          <div className="flex items-center justify-between rounded-2xl bg-surface px-4 py-3">
            <div>
              <p className="text-body-sm font-semibold text-ink">
                Kirim pengingat otomatis
              </p>
              <p className="text-[12px] text-ink-muted">
                H-1 dan 1 jam sebelum rapat dimulai
              </p>
            </div>
            <input
              type="checkbox"
              aria-label="Kirim pengingat otomatis"
              checked={isReminderActive}
              onChange={(e) => setIsReminderActive(e.target.checked)}
              className="h-5 w-5 accent-primary cursor-pointer"
            />
          </div>

          {errorMessage && <Alert status="error">{errorMessage}</Alert>}
        </div>
      </ModalForm>

      <PreviewUndanganModal
        isOpen={previewOpen}
        onClose={() => setPreviewOpen(false)}
        onConfirmSave={() => void handleSubmit()}
        isSubmitting={createMutation.isPending}
        data={{
          judulRapat,
          tanggal,
          waktuMulai,
          waktuSelesai,
          lokasi,
          format,
        }}
      />
    </>
  );
}
