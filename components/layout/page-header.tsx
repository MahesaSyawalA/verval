import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  description,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-4 mb-5",
        className,
      )}
    >
      <div>
        <h2 className="font-heading text-h4 font-bold text-ink">{title}</h2>
        {description && (
          <p className="mt-1 text-body-sm text-ink-muted">{description}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-3">{actions}</div>}
    </div>
  );
}
