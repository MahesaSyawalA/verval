import { UANG_ELEMENTS, UANG_LABELS, type UangElement } from "@/lib/constants";
import { cn } from "@/lib/utils";

export interface UangBadgeProps {
  status: Record<UangElement, boolean>;
  size?: "sm" | "md";
  className?: string;
}

export function UangBadge({
  status,
  size = "md",
  className,
}: UangBadgeProps) {
  return (
    <div
      className={cn("inline-flex items-center gap-1.5", className)}
      aria-label="Status Kelengkapan UANG"
    >
      {UANG_ELEMENTS.map((item) => {
        const active = status[item];
        return (
          <span
            key={item}
            title={`${UANG_LABELS[item]}: ${active ? "Lengkap" : "Belum lengkap"}`}
            className={cn(
              "inline-flex items-center justify-center rounded-full font-heading font-bold transition-colors",
              size === "sm" ? "h-6 w-6 text-[11px]" : "h-7 w-7 text-body-sm",
              active
                ? "bg-primary text-white"
                : "bg-track text-ink-muted",
            )}
          >
            {item}
          </span>
        );
      })}
    </div>
  );
}
