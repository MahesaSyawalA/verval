import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Card } from "./card";

export interface StatCardProps {
  title: string;
  value: string | number;
  delta?: string;
  icon?: ReactNode;
  highlighted?: boolean;
  className?: string;
}

export function StatCard({
  title,
  value,
  delta,
  icon,
  highlighted = false,
  className,
}: StatCardProps) {
  return (
    <Card
      variant={highlighted ? "primary" : "default"}
      className={cn("flex flex-col justify-between gap-4 p-5", className)}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          {icon && (
            <div
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-full",
                highlighted
                  ? "bg-white text-primary"
                  : "bg-primary-50 text-primary",
              )}
            >
              {icon}
            </div>
          )}
          <span
            className={cn(
              "text-body-sm font-medium",
              highlighted ? "text-white/90" : "text-ink-muted",
            )}
          >
            {title}
          </span>
        </div>

        {delta && (
          <span
            className={cn(
              "inline-flex items-center rounded-full px-2.5 py-0.5 text-body-sm font-semibold",
              highlighted
                ? "bg-accent text-ink"
                : "bg-warning-bg text-warning-ink",
            )}
          >
            {delta}
          </span>
        )}
      </div>

      <div className="flex items-end justify-between gap-4 pt-1">
        <span
          className={cn(
            "font-heading text-h4 font-bold tracking-tight",
            highlighted ? "text-white" : "text-ink",
          )}
        >
          {value}
        </span>

        <svg
          width="96"
          height="28"
          viewBox="0 0 96 28"
          fill="none"
          aria-hidden="true"
          className="shrink-0"
        >
          <path
            d={
              highlighted
                ? "M2 18C18 14 26 22 42 16C58 10 74 22 94 18"
                : "M2 24C18 22 28 16 44 19C60 22 72 10 94 6"
            }
            stroke={highlighted ? "#FFD166" : "#0101B7"}
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </svg>
      </div>
    </Card>
  );
}
