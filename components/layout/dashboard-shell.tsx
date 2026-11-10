"use client";

import { useState, type ReactNode } from "react";
import type { UserRole } from "@/config/roles";
import { MobileSidebar } from "./mobile-sidebar";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";

export interface DashboardShellProps {
  user?: {
    id: string;
    namaLengkap: string;
    email: string;
    role: UserRole;
  };
  subtitle?: string;
  onLogout?: () => void;
  children: ReactNode;
}

export function DashboardShell({
  user,
  subtitle,
  onLogout,
  children,
}: DashboardShellProps) {
  const fullName = user?.namaLengkap || "Pengguna";
  const role = user?.role || ("Dosen" as UserRole);
  const userId = user?.id || "";
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-surface px-4 py-5 sm:px-7 sm:py-6">
      <div className="mx-auto max-w-[1440px]">
        <Topbar
          fullName={fullName}
          role={role}
          subtitle={subtitle}
          userId={userId}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
        />

        <MobileSidebar
          isOpen={mobileMenuOpen}
          onClose={() => setMobileMenuOpen(false)}
          role={role}
          fullName={fullName}
          onLogout={onLogout}
        />

        <div className="flex gap-6 items-start">
          <Sidebar
            role={role}
            fullName={fullName}
            onLogout={onLogout}
          />
          <main className="flex-1 min-w-0 space-y-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
