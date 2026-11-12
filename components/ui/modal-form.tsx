"use client";

import type { ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ModalFormProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: "md" | "lg" | "xl";
}

const SIZE_CLASSES: Record<NonNullable<ModalFormProps["size"]>, string> = {
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
};

export function ModalForm({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  size = "lg",
}: ModalFormProps) {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-form-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 backdrop-blur-xs p-4"
    >
      <div
        className={cn(
          "relative w-full rounded-3xl bg-card p-6 shadow-xl border border-border-soft max-h-[90vh] flex flex-col",
          SIZE_CLASSES[size],
        )}
      >
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-border-soft">
          <div>
            <h2
              id="modal-form-title"
              className="font-heading text-h5 font-bold text-ink"
            >
              {title}
            </h2>
            {subtitle && (
              <p className="mt-1 text-body-sm text-ink-muted">{subtitle}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup modal"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-surface text-ink-muted hover:bg-primary-50 hover:text-brand transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="py-5 overflow-y-auto flex-1">{children}</div>

        {footer && (
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border-soft">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
