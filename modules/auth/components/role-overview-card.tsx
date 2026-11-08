import Link from "next/link";
import { CheckCircle2, Shield } from "lucide-react";
import { PageHeader } from "@/components/layout";
import { Card, StatCard, StatusChip, UangBadge } from "@/components/ui";
import { getNavigationForRole } from "@/config/navigation";
import { ROLE_METADATA } from "@/config/roles";
import type { SessionUser } from "../types";

export interface RoleOverviewCardProps {
  user: SessionUser;
  pageTitle: string;
  pageDescription: string;
}

export function RoleOverviewCard({
  user,
  pageTitle,
  pageDescription,
}: RoleOverviewCardProps) {
  const navItems = getNavigationForRole(user.role);
  const roleMeta = ROLE_METADATA[user.role];

  return (
    <div className="space-y-6">
      <PageHeader
        title={pageTitle}
        description={pageDescription}
        actions={
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-white px-4 py-1.5 text-body-sm font-semibold text-primary shadow-xs border border-border-soft">
              Tahun 2026
            </span>
            <StatusChip status={user.role} tone="primary" />
          </div>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {user.role === "Kaprodi" ? (
          <>
            <StatCard title="Target Tercapai" value="14/22" delta="+3" />
            <StatCard title="Capaian vs Target" value="84%" delta="+6%" />
            <StatCard title="Menunggu Verifikasi" value="3" delta="+1" />
            <StatCard
              title="Dosen Aktif"
              value="18/24"
              delta="-2"
              highlighted
            />
          </>
        ) : (
          <>
            <StatCard title="Tugas Saya" value="11" delta="+2" />
            <StatCard title="Target Tercapai" value="5/11" delta="+1" />
            <StatCard title="Menunggu Verifikasi" value="2" delta="+1" />
            <StatCard
              title="Rapat Dihadiri"
              value="92%"
              delta="-2%"
              highlighted
            />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <Card className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-heading text-h5 font-bold text-ink">
                Profil Sesi &amp; Otorisasi Role
              </h3>
              <p className="text-body-sm text-ink-muted">
                {roleMeta.label} · {user.email}
              </p>
            </div>
            <UangBadge status={{ U: true, A: true, N: true, G: true }} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div className="rounded-2xl bg-surface p-4">
              <span className="text-body-sm text-ink-muted">Nama Lengkap</span>
              <p className="font-heading text-body-md font-bold text-ink mt-0.5">
                {user.namaLengkap}
              </p>
            </div>
            <div className="rounded-2xl bg-surface p-4">
              <span className="text-body-sm text-ink-muted">NIP</span>
              <p className="font-heading text-body-md font-bold text-ink mt-0.5">
                {user.nip}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-2">
            <StatusChip status="Ditugaskan" />
            <StatusChip status="Dikerjakan" />
            <StatusChip status="Menunggu Verifikasi" />
            <StatusChip status="Tercapai" />
            <StatusChip status="Ditolak" />
          </div>
        </Card>

        <Card className="lg:col-span-5 space-y-4">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <h3 className="font-heading text-h6 font-bold text-ink">
              Menu Aktif untuk Role {user.role}
            </h3>
          </div>
          <p className="text-body-sm text-ink-muted">
            Sidebar di sebelah kiri otomatis menyesuaikan hak akses{" "}
            <strong>{user.role}</strong>:
          </p>
          <ul className="space-y-2.5">
            {navItems.map((item) => (
              <li key={item.id}>
                <Link
                  href={item.href}
                  className="flex items-center justify-between rounded-2xl bg-surface px-4 py-3 text-body-sm font-semibold text-ink hover:bg-primary-50 hover:text-primary transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-success" />
                    {item.label}
                  </span>
                  <span className="font-mono text-ink-muted">{item.href}</span>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
