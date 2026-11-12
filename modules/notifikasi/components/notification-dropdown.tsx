"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useMarkNotifikasiRead,
  useNotifikasi,
  useNotifikasiRealtime,
} from "../hooks/use-notifikasi";
import type { NotifikasiItem, TipeNotifikasi } from "../types";

export function getNotifikasiBadgeProps(tipe: TipeNotifikasi): {
  label: string;
  className: string;
} {
  switch (tipe) {
    case "RAPAT_PENGINGAT_1J":
      return {
        label: "1j",
        className: "bg-accent-100 text-warning-ink",
      };
    case "RAPAT_PENGINGAT_H1":
      return {
        label: "H-1",
        className: "bg-accent-100 text-warning-ink",
      };
    case "UNDANGAN_BARU":
      return {
        label: "U",
        className: "bg-primary-50 text-brand",
      };
    case "NOTULENSI_FINAL":
      return {
        label: "N",
        className: "bg-primary-50 text-brand",
      };
    case "TIKET_DITOLAK":
      return {
        label: "T",
        className: "bg-danger-soft text-danger-ink",
      };
    case "TIKET_DISETUJUI":
      return {
        label: "T",
        className: "bg-success-soft text-success-ink",
      };
    default:
      return {
        label: "T",
        className: "bg-primary-50 text-brand",
      };
  }
}

function formatNotifikasiTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Hari ini";
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `Hari ini, ${hours}:${minutes}`;
}

export interface NotificationDropdownProps {
  initialItems?: NotifikasiItem[];
  initialUnreadCount?: number;
  /** ID pengguna untuk berlangganan notifikasi realtime (Pusher). */
  userId?: string;
}

export function NotificationDropdown({
  initialItems,
  userId,
  initialUnreadCount,
}: NotificationDropdownProps) {
  useNotifikasiRealtime(userId);
  const [isOpen, setIsOpen] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const query = useNotifikasi();
  const markReadMutation = useMarkNotifikasiRead();

  const items = query.data?.items ?? initialItems ?? [];
  const unreadCount =
    query.data?.unreadCount ??
    initialUnreadCount ??
    items.filter((item) => !item.isRead).length;

  const displayedItems = showAll ? items : items.slice(0, 4);

  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  async function handleMarkAllRead() {
    await markReadMutation.mutateAsync({ markAll: true });
  }

  async function handleItemClick(item: NotifikasiItem) {
    if (!item.isRead) {
      await markReadMutation.mutateAsync({ notifikasiId: item.id });
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-label="Notifikasi"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((prev) => !prev)}
        className="relative flex h-12 w-12 items-center justify-center rounded-full bg-card text-ink shadow-xs border border-border-soft/70 hover:bg-primary-50 transition-colors cursor-pointer"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 ? (
          <span
            data-testid="notifikasi-unread-dot"
            className="absolute top-3 right-3 h-2.5 w-2.5 rounded-full bg-accent ring-2 ring-card"
          />
        ) : null}
      </button>

      {isOpen ? (
        <div
          role="dialog"
          aria-label="Panel Notifikasi"
          className="absolute right-0 top-14 z-50 w-[350px] sm:w-[390px] rounded-[24px] border border-border-soft bg-card p-4 shadow-xl"
        >
          <div className="mb-3 flex items-center justify-between px-1">
            <h2 className="font-heading text-body font-bold text-ink">
              Notifikasi
            </h2>
            <button
              type="button"
              disabled={unreadCount === 0 || markReadMutation.isPending}
              onClick={handleMarkAllRead}
              className="text-caption font-semibold text-brand hover:underline disabled:opacity-50 cursor-pointer"
            >
              Tandai dibaca
            </button>
          </div>

          {items.length === 0 ? (
            <div className="rounded-2xl bg-surface p-6 text-center text-body-sm text-ink-muted">
              Belum ada notifikasi terbaru.
            </div>
          ) : (
            <div className="max-h-[420px] space-y-2.5 overflow-y-auto pr-0.5">
              {displayedItems.map((item) => {
                const badge = getNotifikasiBadgeProps(item.tipeNotifikasi);
                return (
                  <div
                    key={item.id}
                    onClick={() => void handleItemClick(item)}
                    className={cn(
                      "flex items-start gap-3 rounded-2xl border p-3.5 transition-colors cursor-pointer",
                      item.isRead
                        ? "border-border-soft bg-card hover:bg-surface/60"
                        : "border-primary/15 bg-surface hover:bg-primary-50/50",
                    )}
                  >
                    <div
                      className={cn(
                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-heading text-caption font-bold",
                        badge.className,
                      )}
                    >
                      {badge.label}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-body-sm text-ink leading-snug">
                        {item.judulNotifikasi}
                      </p>
                      <p className="mt-0.5 text-caption text-ink-muted leading-relaxed">
                        {item.pesan}
                      </p>
                      <div className="mt-2 flex items-center justify-between gap-2">
                        <span className="text-[11px] font-medium text-ink-subtle">
                          {formatNotifikasiTime(item.createdAt)}
                        </span>
                        {item.tipeNotifikasi === "RAPAT_PENGINGAT_1J" ? (
                          <Link
                            href="/rapat"
                            onClick={(e) => {
                              e.stopPropagation();
                              setIsOpen(false);
                            }}
                            className="inline-flex items-center justify-center rounded-full bg-accent px-3 py-1 text-[11px] font-semibold text-on-accent hover:bg-accent-500 transition-colors"
                          >
                            Isi Presensi
                          </Link>
                        ) : null}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="mt-3 pt-1">
            <button
              type="button"
              onClick={() => setShowAll((prev) => !prev)}
              className="w-full rounded-xl bg-surface py-2.5 text-center text-caption font-semibold text-ink hover:bg-primary-50 transition-colors cursor-pointer"
            >
              {showAll && items.length > 4
                ? "Tampilkan lebih sedikit"
                : "Lihat semua notifikasi"}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
