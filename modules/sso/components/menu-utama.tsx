import { ArrowUpRight, LayoutGrid, LogOut } from "lucide-react";
import Link from "next/link";
import { BrandLogo } from "@/components/layout";
import { Card } from "@/components/ui";
import { ROLE_METADATA, type UserRole } from "@/config/roles";
import { getGreetingName } from "@/lib/utils";
import type { LaunchableModule } from "../types";

/** Modul yang ada di aplikasi ini; modul lain datang dari tabel `sso_clients`. */
export const INTERNAL_MODULES: readonly LaunchableModule[] = [
  {
    id: "notulensi-dashboard",
    name: "Notulensi Rapat & Dashboard Kinerja",
    description:
      "Agenda, presensi, dan notulensi rapat, serta penugasan dan KPI dosen dan prodi.",
    url: "/dashboard",
    external: false,
  },
];

export interface MenuUtamaProps {
  namaLengkap: string;
  role: UserRole;
  modules: readonly LaunchableModule[];
}

function ModuleCard({ module }: { module: LaunchableModule }) {
  const content = (
    <Card className="group flex h-full flex-col justify-between gap-6 p-6 transition-shadow hover:shadow-md">
      <div className="space-y-3">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-50 text-primary">
          <LayoutGrid className="h-6 w-6" />
        </span>
        <h2 className="font-heading text-h6 font-bold text-ink">
          {module.name}
        </h2>
        {module.description && (
          <p className="text-body-sm text-ink-muted">{module.description}</p>
        )}
      </div>
      <span className="inline-flex items-center gap-1.5 text-body-sm font-semibold text-primary">
        Buka modul
        <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
      </span>
    </Card>
  );

  // Modul eksternal memulai alur login SSO sendiri, jadi cukup tautan biasa.
  return module.external ? (
    <a href={module.url} className="block h-full">
      {content}
    </a>
  ) : (
    <Link href={module.url} className="block h-full">
      {content}
    </Link>
  );
}

export function MenuUtama({ namaLengkap, role, modules }: MenuUtamaProps) {
  const all = [...INTERNAL_MODULES, ...modules];

  return (
    <div className="min-h-screen bg-surface px-4 py-5 sm:px-7 sm:py-6">
      <div className="mx-auto max-w-[1100px] space-y-8">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <BrandLogo />
            <div>
              <p className="font-heading text-h5 font-bold leading-tight text-ink">
                Halo, {getGreetingName(namaLengkap)}!
              </p>
              <p className="text-body-sm text-ink-muted">
                {ROLE_METADATA[role].label}
              </p>
            </div>
          </div>
          <Link
            href="/logout"
            className="inline-flex h-11 items-center gap-2 rounded-full border border-border-soft bg-white px-5 text-body-sm font-medium text-ink hover:bg-primary-50"
          >
            <LogOut className="h-4 w-4" />
            Keluar
          </Link>
        </header>

        <section className="space-y-2">
          <h1 className="font-heading text-h4 font-bold text-ink">Menu Utama</h1>
          <p className="text-body-md text-ink-muted">
            Pilih modul yang ingin Anda buka. Satu akun SACIBIRU berlaku untuk
            semua modul.
          </p>
        </section>

        <section
          aria-label="Daftar modul"
          className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
        >
          {all.map((module) => (
            <ModuleCard key={module.id} module={module} />
          ))}
        </section>
      </div>
    </div>
  );
}
