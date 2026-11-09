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
  /** Deret nilai nyata untuk grafik mini; tanpa ini grafik tidak ditampilkan. */
  sparkline?: readonly number[];
}

/** Ubah deret nilai menjadi path SVG 96x28 (skala min–max; datar jadi garis tengah). */
function toSparklinePath(values: readonly number[]): string | null {
  if (values.length < 2) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const step = 92 / (values.length - 1);

  return values
    .map((v, i) => {
      const y = max === min ? 14 : 25 - ((v - min) / (max - min)) * 22;
      return `${i === 0 ? "M" : "L"}${(2 + i * step).toFixed(1)} ${y.toFixed(1)}`;
    })
    .join("");
}

export function StatCard({
  title,
  value,
  delta,
  icon,
  highlighted = false,
  className,
  sparkline,
}: StatCardProps) {
  const sparklinePath = sparkline ? toSparklinePath(sparkline) : null;

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

        {sparklinePath && (
          <svg
            width="96"
            height="28"
            viewBox="0 0 96 28"
            fill="none"
            aria-hidden="true"
            className="shrink-0"
          >
            <path
              d={sparklinePath}
              stroke={highlighted ? "#FFD166" : "#0101B7"}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </div>
    </Card>
  );
}
