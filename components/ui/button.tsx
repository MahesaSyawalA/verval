"use client";

import { Button as HeroButton, Spinner } from "@heroui/react";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

export type ButtonVariant =
  | "primary"
  | "accent"
  | "secondary"
  | "outline"
  | "ghost"
  | "danger";

export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  fullWidth?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-primary text-white hover:bg-primary-700 active:bg-primary-800 shadow-xs",
  accent:
    "bg-accent text-ink hover:bg-accent-500 active:bg-accent-600 font-semibold",
  secondary:
    "bg-secondary-100 text-primary hover:bg-secondary-200 font-medium",
  outline:
    "border border-primary/30 bg-white text-primary hover:bg-primary-50 font-medium",
  ghost:
    "bg-transparent text-ink-muted hover:bg-primary-50 hover:text-primary",
  danger:
    "bg-danger text-white hover:opacity-90 font-medium",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-9 px-4 text-body-sm rounded-full",
  md: "h-11 px-5 text-body-md rounded-full",
  lg: "h-12 px-6 text-body-md rounded-full",
};

export function Button({
  variant = "primary",
  size = "md",
  isLoading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  className,
  children,
  disabled,
  type = "button",
  onClick,
  ...rest
}: ButtonProps) {
  return (
    <HeroButton
      type={type}
      isDisabled={disabled || isLoading}
      fullWidth={fullWidth}
      onPress={
        onClick
          ? () => {
              onClick({} as React.MouseEvent<HTMLButtonElement>);
            }
          : undefined
      }
      className={cn(
        "inline-flex items-center justify-center gap-2 font-medium transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed",
        variantClasses[variant],
        sizeClasses[size],
        fullWidth && "w-full",
        className,
      )}
      {...(rest as Record<string, unknown>)}
    >
      {isLoading ? <Spinner size="sm" /> : leftIcon}
      <span>{children}</span>
      {!isLoading && rightIcon}
    </HeroButton>
  );
}
