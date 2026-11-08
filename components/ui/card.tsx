import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  variant?: "default" | "primary" | "Subtle";
}

export function Card({
  children,
  variant = "default",
  className,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        "rounded-3xl p-6 transition-shadow",
        variant === "default" &&
          "bg-white text-ink border border-border-soft/80 shadow-xs",
        variant === "primary" && "bg-primary text-white shadow-sm",
        variant === "Subtle" && "bg-surface text-ink border border-border-soft",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
