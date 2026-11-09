"use client";

import { Check, Image as ImageIcon, Upload, X } from "lucide-react";
import { useRef, useState } from "react";
import { BareInput, Button, ModalForm } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { RapatItem } from "@/modules/rapat";
import { uploadDokumentasiPhotoFileApi } from "../api";
import { useSaveDokumentasi } from "../hooks/use-dokumentasi";
import { saveDokumentasiSchema } from "../schemas/dokumentasi.schema";

export interface UploadDokumentasiModalProps {
  isOpen: boolean;
  onClose: () => void;
  rapat: RapatItem | null;
}

interface StagedPhotoItem {
  id: string;
  fileName: string;
  fileGambar: string;
  sizeLabel: string;
  caption: string;
}

function formatShortDate(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return isoDate;
  return date.toLocaleDateString("id-ID", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function UploadDokumentasiModal({
  isOpen,
  onClose,
  rapat,
}: UploadDokumentasiModalProps) {
  const saveMutation = useSaveDokumentasi(rapat?.id ?? "");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [photos, setPhotos] = useState<StagedPhotoItem[]>(() => [
    {
      id: "stg-1",
      fileName: "IMG_2041.jpg",
      fileGambar: "dokumentasi/IMG_2041.jpg",
      sizeLabel: "2,4 MB",
      caption: "Suasana rapat di Ruang Sidang B",
    },
    {
      id: "stg-2",
      fileName: "IMG_2043.jpg",
      fileGambar: "dokumentasi/IMG_2043.jpg",
      sizeLabel: "1,9 MB",
      caption: "Pemaparan capaian kinerja dosen",
    },
  ]);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen || !rapat) return null;

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;

    setErrorMessage(null);
    setIsUploading(true);
    try {
      for (const file of files) {
        const uploaded = await uploadDokumentasiPhotoFileApi(file);
        const sizeMb = (uploaded.size / (1024 * 1024)).toFixed(1).replace(".", ",");
        setPhotos((prev) => [
          ...prev,
          {
            id: `stg-${Date.now()}-${Math.random()}`,
            fileName: uploaded.fileName,
            fileGambar: uploaded.path,
            sizeLabel: `${sizeMb} MB`,
            caption: "",
          },
        ]);
      }
    } catch (err) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : "Gagal mengunggah foto dokumentasi.",
      );
    } finally {
      setIsUploading(false);
    }
  }

  function handleUpdateCaption(id: string, caption: string) {
    setPhotos((prev) =>
      prev.map((item) => (item.id === id ? { ...item, caption } : item)),
    );
  }

  function handleRemovePhoto(id: string) {
    setPhotos((prev) => prev.filter((item) => item.id !== id));
  }

  async function handleSave() {
    setErrorMessage(null);
    const parsed = saveDokumentasiSchema.safeParse({
      photos: photos.map((p) => ({
        fileGambar: p.fileGambar,
        caption: p.caption.trim() || undefined,
      })),
    });

    if (!parsed.success) {
      setErrorMessage(
        parsed.error.issues[0]?.message ??
          "Minimal 1 foto dokumentasi harus dipilih.",
      );
      return;
    }

    try {
      await saveMutation.mutateAsync(parsed.data);
      onClose();
    } catch (err) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : "Gagal menyimpan foto dokumentasi ke arsip.",
      );
    }
  }

  return (
    <ModalForm
      isOpen={isOpen}
      onClose={onClose}
      title="Unggah Foto Dokumentasi"
      subtitle="Foto rapat jadi bagian G di arsip"
      size="lg"
      footer={
        <>
          <Button
            variant="outline"
            size="md"
            fullWidth
            onClick={onClose}
            disabled={saveMutation.isPending}
          >
            Batal
          </Button>
          <Button
            variant="primary"
            size="md"
            fullWidth
            isLoading={saveMutation.isPending}
            onClick={() => void handleSave()}
          >
            Simpan {photos.length} Foto ke Arsip
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {/* Rapat Banner */}
        <div className="flex items-center gap-3.5 rounded-2xl bg-primary-50 p-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary font-heading text-body-md font-bold text-white">
            G
          </span>
          <div>
            <p className="font-heading text-body-md font-bold text-ink">
              {rapat.judulRapat}
            </p>
            <p className="text-body-sm text-ink-muted">
              {formatShortDate(rapat.tanggal)} &middot; {rapat.waktuMulai}{" "}
              &middot; {rapat.lokasi}
            </p>
          </div>
        </div>

        {/* Dropzone */}
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-primary/30 bg-surface px-4 py-6 text-center space-y-2.5">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary-50 text-primary">
            <Upload className="h-5 w-5" />
          </div>
          <p className="font-heading text-body-sm font-bold text-ink">
            Tarik foto ke sini atau pilih dari perangkat
          </p>
          <p className="text-[12px] text-ink-muted">
            JPG atau PNG &middot; maks 10 MB per foto
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            onChange={(e) => void handleFileSelect(e)}
            className="hidden"
          />
          <Button
            variant="accent"
            size="sm"
            isLoading={isUploading}
            onClick={() => fileInputRef.current?.click()}
          >
            Pilih Foto
          </Button>
        </div>

        {/* Selected Photos List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-body-sm">
            <span className="font-semibold text-ink">
              Foto dipilih ({photos.length})
            </span>
            <span className="text-[12px] text-ink-muted">
              {photos.length} siap disimpan
            </span>
          </div>

          <div className="space-y-3">
            {photos.map((photo, idx) => (
              <div
                key={photo.id}
                className="flex items-start gap-3.5 rounded-2xl bg-surface p-3.5"
              >
                <div
                  className={cn(
                    "flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-ink-muted",
                    idx % 2 === 0 ? "bg-secondary/40" : "bg-accent/50",
                  )}
                >
                  <ImageIcon className="h-6 w-6" />
                </div>

                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-heading text-body-sm font-bold text-ink">
                        {photo.fileName}
                      </p>
                      <p className="inline-flex items-center gap-1 text-[12px] font-medium text-success">
                        <Check className="h-3.5 w-3.5" />
                        <span>Siap disimpan &middot; {photo.sizeLabel}</span>
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemovePhoto(photo.id)}
                      aria-label={`Hapus ${photo.fileName}`}
                      className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-ink-muted hover:text-danger cursor-pointer"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <BareInput
                    type="text"
                    aria-label="Keterangan foto"
                    value={photo.caption}
                    onChange={(e) =>
                      handleUpdateCaption(photo.id, e.target.value)
                    }
                    placeholder="Tambah keterangan (opsional)..."
                    className="w-full rounded-xl border border-border-default bg-white px-3.5 py-2 text-body-sm text-ink placeholder:text-ink-subtle focus:border-primary focus:outline-none"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {errorMessage && (
          <p role="alert" className="text-body-sm font-medium text-danger">
            {errorMessage}
          </p>
        )}
      </div>
    </ModalForm>
  );
}
