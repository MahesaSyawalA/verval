"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpenCheck,
  Calendar,
  LayoutGrid,
  LogOut,
  Sun,
  Target,
  Ticket,
} from "lucide-react";
import type { ReactNode } from "react";
import {
  getNavigationForRole,
  type NavIconName,
} from "@/config/navigation";
import type { UserRole } from "@/config/roles";
import { cn, getInitials } from "@/lib/utils";
import { SHELL_RAIL_WIDTH } from "./shell-grid";

const ICON_MAP: Record<NavIconName, ReactNode> = {
  dashboard: <LayoutGrid className="h-5 w-5" />,
  target: <Target className="h-5 w-5" />,
  tiket: <Ticket className="h-5 w-5" />,
  arsip: <BookOpenCheck className="h-5 w-5" />,
  rapat: <Calendar className="h-5 w-5" />,
};

export interface SidebarProps {
  role: UserRole;
  fullName: string;
  onLogout?: () => void;
}

export function Sidebar({ role, fullName, onLogout }: SidebarProps) {
  const pathname = usePathname();
  const navItems = getNavigationForRole(role);
  const initials = getInitials(fullName);

  return (
    <aside
      aria-label="Navigasi Utama"
      className={cn(
        "flex flex-col items-center justify-between rounded-[36px] bg-white py-4 px-2 shadow-xs border border-border-soft/70 shrink-0 min-h-[calc(100vh-7.5rem)]",
        SHELL_RAIL_WIDTH,
      )}
    >
      <nav className="flex flex-col items-center gap-3">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.id}
              href={item.href}
              title={item.label}
              aria-label={item.label}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex h-12 w-12 items-center justify-center rounded-full transition-all",
                isActive
                  ? "bg-primary text-white shadow-sm"
                  : "text-ink-muted hover:bg-primary-50 hover:text-primary",
              )}
            >
              {ICON_MAP[item.icon]}
            </Link>
          );
        })}
      </nav>

      <div className="flex flex-col items-center gap-3 pt-6">
        <button
          type="button"
          title="Pengaturan Tampilan"
          aria-label="Pengaturan Tampilan"
          className="flex h-11 w-11 items-center justify-center rounded-full text-ink-muted hover:bg-primary-50 hover:text-primary transition-colors cursor-pointer"
        >
          <Sun className="h-5 w-5" />
        </button>

        {onLogout ? (
          <button
            type="button"
            onClick={onLogout}
            title="Keluar"
            aria-label="Keluar"
            className="flex h-11 w-11 items-center justify-center rounded-full text-ink-muted hover:bg-danger-bg hover:text-danger transition-colors cursor-pointer"
          >
            <LogOut className="h-5 w-5" />
          </button>
        ) : (
          <Link
            href="/logout"
            title="Keluar"
            aria-label="Keluar"
            className="flex h-11 w-11 items-center justify-center rounded-full text-ink-muted hover:bg-danger-bg hover:text-danger transition-colors"
          >
            <LogOut className="h-5 w-5" />
          </Link>
        )}

        <div
          title={`${fullName} (${role})`}
          className="mt-1 flex h-12 w-12 items-center justify-center rounded-full bg-secondary font-heading text-body-md font-bold text-primary select-none"
        >
          {initials}
        </div>
      </div>
    </aside>
  );
}
