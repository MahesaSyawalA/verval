import Link from "next/link";
import { BrandLogo } from "@/components/layout";
import { Card, StatusChip, UangBadge } from "@/components/ui";
import { APP_NAME, INSTITUTION_NAME } from "@/lib/constants";

export default function HomePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface p-6">
      <Card className="max-w-xl w-full p-8 space-y-6">
        <div className="flex items-center gap-4">
          <BrandLogo />
          <div>
            <h1 className="font-heading text-h5 font-bold text-ink">
              {APP_NAME}
            </h1>
            <p className="text-body-sm text-ink-muted">{INSTITUTION_NAME}</p>
          </div>
        </div>

        <p className="text-body-md text-ink-muted">
          Portal terintegrasi Modul 2 (Notulensi Rapat berbasis konsep UANG) dan
          Modul 8 (Dashboard Kinerja &amp; Penugasan Dosen).
        </p>

        <div className="flex flex-wrap items-center gap-3">
          <StatusChip status="Tercapai" />
          <StatusChip status="Menunggu Verifikasi" />
          <StatusChip status="Dikerjakan" />
          <StatusChip status="Ditolak" />
          <UangBadge status={{ U: true, A: true, N: true, G: true }} />
        </div>

        <div className="pt-2 flex items-center gap-3">
          <Link
            href="/login"
            className="inline-flex h-11 items-center justify-center rounded-full bg-primary px-6 text-body-md font-semibold text-white hover:bg-primary-700 transition-colors"
          >
            Masuk ke Sistem
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex h-11 items-center justify-center rounded-full border border-primary/30 bg-white px-6 text-body-md font-medium text-primary hover:bg-primary-50 transition-colors"
          >
            Buka Dashboard
          </Link>
        </div>
      </Card>
    </div>
  );
}
