"use client";

import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: ReactNode;
  rightElement?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      leftIcon,
      rightElement,
      className,
      id,
      ...props
    },
    ref,
  ) => {
    const inputId = id || props.name;

    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="text-body-sm font-medium text-ink"
          >
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <span className="pointer-events-none absolute left-3.5 text-ink-muted">
              {leftIcon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            aria-invalid={Boolean(error)}
            className={cn(
              "h-11 w-full rounded-2xl border bg-white px-4 text-body-md text-ink placeholder:text-ink-subtle transition-colors focus:outline-none focus:ring-2",
              leftIcon ? "pl-10" : "pl-4",
              rightElement ? "pr-10" : "pr-4",
              error
                ? "border-danger focus:border-danger focus:ring-danger/20"
                : "border-border-soft focus:border-primary focus:ring-primary/15",
              className,
            )}
            {...props}
          />
          {rightElement && (
            <div className="absolute right-3 flex items-center">
              {rightElement}
            </div>
          )}
        </div>
        {error ? (
          <p role="alert" className="text-body-sm text-danger font-medium">
            {error}
          </p>
        ) : helperText ? (
          <p className="text-body-sm text-ink-muted">{helperText}</p>
        ) : null}
      </div>
    );
  },
);

Input.displayName = "Input";
