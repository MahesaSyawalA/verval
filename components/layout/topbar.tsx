"use client";

import { useState } from "react";
import { Menu, MessageSquare, Search, X } from "lucide-react";
import { ROLE_METADATA, type UserRole } from "@/config/roles";
import { getGreetingName } from "@/lib/utils";
import { NotificationDropdown } from "@/modules/notifikasi";
import { BareInput } from "@/components/ui";
import { BrandLogo } from "./logo";

export interface TopbarProps {
  fullName: string;
  role: UserRole;
  subtitle?: string;
  userId?: string;
  onOpenMobileMenu?: () => void;
}

export function Topbar({
  fullName,
  role,
  subtitle,
  userId,
  onOpenMobileMenu,
}: TopbarProps) {
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const greetingName = getGreetingName(fullName);
  const resolvedSubtitle = subtitle ?? ROLE_METADATA[role]?.subtitle ?? "";

  return (
    <header className="sticky top-0 z-30 -mx-4 -mt-5 mb-5 px-4 py-3 sm:-mx-7 sm:-mt-6 sm:mb-6 sm:px-7 bg-surface/90 backdrop-blur-md border-b border-border-soft/60 transition-all lg:static lg:bg-transparent lg:border-none lg:p-0 lg:m-0 lg:pb-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Left Side: Hamburger Trigger (mobile/tablet) + Logo + Greeting */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onOpenMobileMenu}
            aria-label="Buka menu navigasi"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-ink shadow-xs border border-border-soft/70 hover:bg-primary-50 hover:text-primary transition-colors cursor-pointer lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>

          <BrandLogo />

          <div>
            <h1 className="font-heading text-body-md sm:text-h5 font-bold text-ink leading-tight">
              Halo, {greetingName}!
            </h1>
            <p className="hidden sm:block text-body-sm text-ink-muted">
              {resolvedSubtitle}
            </p>
          </div>
        </div>

        {/* Right Side: Search + Messages + Notifications */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Desktop & Tablet Search Bar */}
          <div className="relative hidden md:flex items-center w-72 lg:w-96 rounded-full bg-white pl-5 pr-1.5 py-1.5 shadow-xs border border-border-soft/70">
            <BareInput
              type="search"
              placeholder="Cari tugas, rapat, dokumen..."
              aria-label="Cari tugas, rapat, dokumen"
              className="w-full bg-transparent text-body-sm text-ink placeholder:text-ink-subtle focus:outline-none"
            />
            <button
              type="button"
              aria-label="Cari"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-white hover:bg-primary-700 transition-colors cursor-pointer"
            >
              <Search className="h-4 w-4" />
            </button>
          </div>

          {/* Mobile Search Toggle Button */}
          <button
            type="button"
            onClick={() => setShowMobileSearch((prev) => !prev)}
            aria-label={showMobileSearch ? "Tutup pencarian" : "Buka pencarian"}
            className="flex md:hidden h-11 w-11 items-center justify-center rounded-full bg-white text-ink shadow-xs border border-border-soft/70 hover:bg-primary-50 transition-colors cursor-pointer"
          >
            {showMobileSearch ? (
              <X className="h-5 w-5" />
            ) : (
              <Search className="h-5 w-5" />
            )}
          </button>

          <button
            type="button"
            aria-label="Pesan"
            className="relative flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-white text-ink shadow-xs border border-border-soft/70 hover:bg-primary-50 transition-colors cursor-pointer"
          >
            <MessageSquare className="h-5 w-5" />
            <span className="absolute top-2.5 right-2.5 sm:top-3 sm:right-3 h-2 w-2 rounded-full bg-accent" />
          </button>

          <NotificationDropdown userId={userId} />
        </div>
      </div>

      {/* Expandable Mobile Search Input (Visible on mobile when toggled) */}
      {showMobileSearch && (
        <div className="mt-3 md:hidden">
          <div className="relative flex items-center w-full rounded-full bg-white pl-4 pr-1.5 py-1.5 shadow-xs border border-border-soft/70">
            <BareInput
              type="search"
              autoFocus
              placeholder="Cari tugas, rapat, dokumen..."
              aria-label="Cari tugas, rapat, dokumen"
              className="w-full bg-transparent text-body-sm text-ink placeholder:text-ink-subtle focus:outline-none"
            />
            <button
              type="button"
              aria-label="Cari"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-white hover:bg-primary-700 transition-colors cursor-pointer"
            >
              <Search className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
