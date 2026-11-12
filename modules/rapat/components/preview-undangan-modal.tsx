"use client";

import { Button, ModalForm } from "@/components/ui";
import type { FormatRapatType } from "../types";

export interface PreviewUndanganData {
  judulRapat: string;
  tanggal: string;
  waktuMulai: string;
  waktuSelesai: string;
  lokasi: string;
  format: FormatRapatType;
  nomorSurat?: string;
}

export interface PreviewUndanganModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmSave?: () => void;
  isSubmitting?: boolean;
  data: PreviewUndanganData;
}

function formatLongIndonesianDate(dateStr: string): string {
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export function PreviewUndanganModal({
  isOpen,
  onClose,
  onConfirmSave,
  isSubmitting = false,
  data,
}: PreviewUndanganModalProps) {
  const nomorSurat = data.nomorSurat ?? "012/UN40.CB/PRODI/X/2026";

  return (
    <ModalForm
      isOpen={isOpen}
      onClose={onClose}
      title="Preview Surat Undangan"
      subtitle="Dibuat otomatis dari data agenda rapat"
      size="lg"
      footer={
        <>
          <Button
            variant="outline"
            size="md"
            fullWidth
            onClick={onClose}
            disabled={isSubmitting}
          >
            Kembali Edit
          </Button>
          {onConfirmSave && (
            <Button
              variant="primary"
              size="md"
              fullWidth
              isLoading={isSubmitting}
              onClick={onConfirmSave}
            >
              Simpan & Kirim Undangan
            </Button>
          )}
        </>
      }
    >
      <div className="space-y-3">
        <div className="rounded-3xl bg-surface p-5">
          <div className="rounded-2xl border border-border-soft bg-card p-6 space-y-5 shadow-xs">
            {/* Kop Surat UPI */}
            <div className="flex items-center gap-4 border-b-2 border-primary pb-4">
              <div className="flex h-13 w-13 shrink-0 items-center justify-center rounded-full bg-primary font-heading text-h5 font-bold text-white">
                R
              </div>
              <div>
                <p className="font-heading text-body-md font-bold text-ink">
                  UNIVERSITAS PENDIDIKAN INDONESIA
                </p>
                <p className="text-body-sm font-medium text-ink">
                  Kampus UPI di Cibiru
                </p>
                <p className="text-body-sm text-ink-muted">
                  Rekayasa Perangkat Lunak
                </p>
              </div>
            </div>

            {/* Nomor / Lampiran / Perihal */}
            <dl className="grid grid-cols-12 gap-y-1 text-body-sm text-ink">
              <dt className="col-span-3 text-ink-muted">Nomor</dt>
              <dd className="col-span-9 font-medium">: {nomorSurat}</dd>
              <dt className="col-span-3 text-ink-muted">Lampiran</dt>
              <dd className="col-span-9 font-medium">: -</dd>
              <dt className="col-span-3 text-ink-muted">Perihal</dt>
              <dd className="col-span-9 font-medium">: Undangan Rapat</dd>
            </dl>

            <div className="space-y-2 text-body-sm text-ink leading-relaxed">
              <p>
                Yth. Bapak/Ibu Dosen Program Studi
                <br />
                di Tempat
              </p>
              <p>
                Dengan hormat, sehubungan dengan pelaksanaan kegiatan program
                studi, kami mengundang Bapak/Ibu untuk hadir pada rapat yang
                akan dilaksanakan pada:
              </p>
            </div>

            {/* Kotak Detail Jadwal */}
            <dl className="grid grid-cols-12 gap-y-1.5 rounded-2xl bg-surface p-4 text-body-sm text-ink">
              <dt className="col-span-4 font-medium text-ink">Hari/Tanggal</dt>
              <dd className="col-span-8">
                : {formatLongIndonesianDate(data.tanggal)}
              </dd>

              <dt className="col-span-4 font-medium text-ink">Waktu</dt>
              <dd className="col-span-8">
                : {data.waktuMulai.replace(":", ".")} –{" "}
                {data.waktuSelesai.replace(":", ".")} WIB
              </dd>

              <dt className="col-span-4 font-medium text-ink">Tempat</dt>
              <dd className="col-span-8">
                : {data.lokasi || "Ruang Sidang B"} ({data.format})
              </dd>

              <dt className="col-span-4 font-medium text-ink">Agenda</dt>
              <dd className="col-span-8 font-medium">
                : {data.judulRapat || "Evaluasi Kinerja Dosen Semester Ganjil"}
              </dd>
            </dl>

            <p className="text-body-sm text-ink leading-relaxed">
              Demikian undangan ini disampaikan. Atas kehadiran Bapak/Ibu, kami
              ucapkan terima kasih.
            </p>

            {/* Tanda Tangan */}
            <div className="flex justify-end pt-2">
              <div className="w-52 space-y-2 text-body-sm text-ink">
                <div>
                  <p>Cibiru, 20 Oktober 2026</p>
                  <p>Ketua Program Studi,</p>
                </div>
                <div className="flex h-12 items-center justify-center rounded-xl border border-dashed border-border-default text-[12px] text-ink-muted">
                  TTD digital
                </div>
                <p className="font-heading font-bold text-ink">
                  Iqbal Ardimansyah
                </p>
              </div>
            </div>
          </div>
        </div>

        <p className="text-[12px] text-ink-muted">
          Nomor surat dan tanda tangan terisi otomatis. Undangan juga tersimpan
          sebagai bagian U di arsip rapat.
        </p>
      </div>
    </ModalForm>
  );
}
