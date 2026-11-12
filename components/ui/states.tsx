import type { ComponentProps, ReactNode } from "react";
import { Skeleton as HeroSkeleton } from "@heroui/react";
import { AlertTriangle, Inbox } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";

export interface SkeletonProps extends ComponentProps<typeof HeroSkeleton> {
  className?: string;
}

/**
 * Komponen Skeleton reusable berbasis HeroUI v3.
 * Menerima properti animasi dan styling standar HeroUI.
 */
export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <HeroSkeleton
      className={cn(
        "rounded-2xl bg-border-soft/70",
        className,
      )}
      {...props}
    />
  );
}

export interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({
  title,
  description,
  icon,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-3xl border border-dashed border-border-soft bg-surface/50 px-6 py-12 text-center",
        className,
      )}
    >
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary-50 text-brand">
        {icon ?? <Inbox className="h-6 w-6" />}
      </div>
      <h3 className="font-heading text-h6 font-semibold text-ink">{title}</h3>
      {description && (
        <p className="mt-1 max-w-md text-body-sm text-ink-muted">
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = "Gagal memuat data",
  message,
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center justify-center rounded-3xl border border-danger/20 bg-danger-bg/40 px-6 py-10 text-center",
        className,
      )}
    >
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-danger-bg text-danger-ink">
        <AlertTriangle className="h-6 w-6" />
      </div>
      <h3 className="font-heading text-h6 font-semibold text-ink">{title}</h3>
      <p className="mt-1 max-w-md text-body-sm text-danger-ink">{message}</p>
      {onRetry && (
        <div className="mt-4">
          <Button variant="outline" size="sm" onClick={onRetry}>
            Coba Lagi
          </Button>
        </div>
      )}
    </div>
  );
}
