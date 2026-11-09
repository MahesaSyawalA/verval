"use client";

import type { ReactNode } from "react";
import type { UserRole } from "@/config/roles";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";

export interface DashboardShellProps {
  user: {
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
  return (
    <div className="min-h-screen bg-surface px-4 py-5 sm:px-7 sm:py-6">
      <div className="mx-auto max-w-[1440px]">
        <Topbar
          fullName={user.namaLengkap}
          role={user.role}
          subtitle={subtitle}
          userId={user.id}
        />

        <div className="flex gap-6 items-start">
          <Sidebar
            role={user.role}
            fullName={user.namaLengkap}
            onLogout={onLogout}
          />
          <main className="flex-1 min-w-0 space-y-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
