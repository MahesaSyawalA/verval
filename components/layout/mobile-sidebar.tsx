"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpenCheck,
  Calendar,
  LayoutGrid,
  LogOut,
  Target,
  Ticket,
  X,
} from "lucide-react";
import { useEffect, useRef, type ReactNode } from "react";
import {
  getNavigationForRole,
  type NavIconName,
} from "@/config/navigation";
import { ROLE_METADATA, type UserRole } from "@/config/roles";
import { cn, getInitials } from "@/lib/utils";
import { BrandLogo } from "./logo";
import { ThemeToggle } from "./theme-toggle";

const ICON_MAP: Record<NavIconName, ReactNode> = {
  dashboard: <LayoutGrid className="h-5 w-5" />,
  target: <Target className="h-5 w-5" />,
  tiket: <Ticket className="h-5 w-5" />,
  arsip: <BookOpenCheck className="h-5 w-5" />,
  rapat: <Calendar className="h-5 w-5" />,
};

export interface MobileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  role: UserRole;
  fullName: string;
  onLogout?: () => void;
}

export function MobileSidebar({
  isOpen,
  onClose,
  role,
  fullName,
  onLogout,
}: MobileSidebarProps) {
  const pathname = usePathname();
  const prevPathnameRef = useRef(pathname);
  const navItems = getNavigationForRole(role);
  const initials = getInitials(fullName);
  const roleMeta = ROLE_METADATA[role];

  // Auto-close saat berpindah halaman (hanya jika pathname berubah)
  useEffect(() => {
    if (prevPathnameRef.current !== pathname) {
      prevPathnameRef.current = pathname;
      if (isOpen) {
        onClose();
      }
    }
  }, [pathname, isOpen, onClose]);

  // Handle escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll saat mobile drawer terbuka
  useEffect(() => {
    if (isOpen) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [isOpen]);

  return (
    <>
      {/* Backdrop overlay */}
      <div
        role="button"
        tabIndex={0}
        aria-label="Tutup navigasi"
        onClick={onClose}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") onClose();
        }}
        className={cn(
          "fixed inset-0 z-40 bg-black/50 backdrop-blur-xs transition-opacity duration-300 lg:hidden",
          isOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none",
        )}
      />

      {/* Drawer Container */}
      <aside
        aria-label="Navigasi Menu Mobile"
        aria-hidden={!isOpen}
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-76 max-w-[85vw] flex-col justify-between bg-card shadow-2xl transition-transform duration-300 ease-in-out lg:hidden",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {/* Drawer Header */}
        <div className="flex flex-col border-b border-border-soft p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BrandLogo className="h-10 w-10 rounded-xl" />
              <div>
                <span className="font-heading text-body-md font-bold text-ink block leading-tight">
                  SACIBIRU RPL
                </span>
                <span className="text-[12px] text-ink-muted block">
                  UPI Kampus Cibiru
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Tutup menu navigasi"
              className="flex h-9 w-9 items-center justify-center rounded-full text-ink-muted hover:bg-surface hover:text-ink transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* User Profile Card */}
          <div className="mt-4 flex items-center gap-3 rounded-2xl bg-surface p-3 border border-border-soft/60">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary font-heading text-body-sm font-bold text-on-secondary">
              {initials}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-body-sm font-bold text-ink">
                {fullName}
              </p>
              <span className="inline-flex items-center rounded-full bg-primary-50 px-2 py-0.5 text-[11px] font-semibold text-brand">
                {roleMeta?.label ?? role}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Items List */}
        <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-1.5">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.id}
                href={item.href}
                onClick={onClose}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3.5 px-4 py-3 rounded-2xl text-body-sm font-semibold transition-all",
                  isActive
                    ? "bg-primary text-white shadow-xs"
                    : "text-ink-muted hover:bg-primary-50 hover:text-brand",
                )}
              >
                <span
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-xl",
                    isActive ? "bg-white/15 text-white" : "text-inherit",
                  )}
                >
                  {ICON_MAP[item.icon]}
                </span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Drawer Footer */}
        <div className="border-t border-border-soft p-4 space-y-2">
          <ThemeToggle
            showLabel
            className="flex w-full items-center gap-3 px-4 py-2.5 rounded-2xl text-body-sm font-medium text-ink-muted hover:bg-primary-50 hover:text-brand transition-colors cursor-pointer"
          />

          {onLogout ? (
            <button
              type="button"
              onClick={() => {
                onClose();
                onLogout();
              }}
              className="flex w-full items-center gap-3 px-4 py-2.5 rounded-2xl text-body-sm font-semibold text-danger-ink hover:bg-danger-bg transition-colors cursor-pointer"
            >
              <LogOut className="h-5 w-5" />
              <span>Keluar dari Akun</span>
            </button>
          ) : (
            <Link
              href="/logout"
              onClick={onClose}
              className="flex w-full items-center gap-3 px-4 py-2.5 rounded-2xl text-body-sm font-semibold text-danger-ink hover:bg-danger-bg transition-colors"
            >
              <LogOut className="h-5 w-5" />
              <span>Keluar dari Akun</span>
            </Link>
          )}
        </div>
      </aside>
    </>
  );
}
