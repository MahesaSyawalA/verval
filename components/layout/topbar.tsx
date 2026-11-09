"use client";

import { MessageSquare, Search } from "lucide-react";
import { ROLE_METADATA, type UserRole } from "@/config/roles";
import { getGreetingName } from "@/lib/utils";
import { NotificationDropdown } from "@/modules/notifikasi";
import { BareInput } from "@/components/ui";
import { BrandLogo } from "./logo";

export interface TopbarProps {
  fullName: string;
  role: UserRole;
  subtitle?: string;
}

export function Topbar({ fullName, role, subtitle }: TopbarProps) {
  const greetingName = getGreetingName(fullName);
  const resolvedSubtitle = subtitle ?? ROLE_METADATA[role]?.subtitle ?? "";

  return (
    <header className="flex flex-wrap items-center justify-between gap-4 pb-6">
      <div className="flex items-center gap-4">
        <BrandLogo />
        <div>
          <h1 className="font-heading text-h5 font-bold text-ink leading-tight">
            Halo, {greetingName}!
          </h1>
          <p className="text-body-sm text-ink-muted">{resolvedSubtitle}</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex items-center w-72 sm:w-96 rounded-full bg-white pl-5 pr-1.5 py-1.5 shadow-xs border border-border-soft/70">
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

        <button
          type="button"
          aria-label="Pesan"
          className="relative flex h-12 w-12 items-center justify-center rounded-full bg-white text-ink shadow-xs border border-border-soft/70 hover:bg-primary-50 transition-colors cursor-pointer"
        >
          <MessageSquare className="h-5 w-5" />
          <span className="absolute top-3 right-3 h-2 w-2 rounded-full bg-accent" />
        </button>

        <NotificationDropdown />
      </div>
    </header>
  );
}
