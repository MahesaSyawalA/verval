"use client";

import {
  Description,
  FieldError,
  Input as HeroInput,
  Label,
  TextField,
} from "@heroui/react";
import {
  forwardRef,
  type ComponentProps,
  type InputHTMLAttributes,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";
import { InputSkeleton } from "./form-skeleton";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  /** Kelas tambahan untuk label (mis. `sr-only` atau `font-semibold`). */
  labelClassName?: string;
  error?: string;
  helperText?: string;
  isLoading?: boolean;
  leftIcon?: ReactNode;
  rightElement?: ReactNode;
}

/**
 * Field teks berbasis HeroUI (TextField + Label + Input + FieldError).
 * Nilai dan event tetap bergaya native (`value`, `onChange(e)`) agar pemakaian
 * di modul tidak berubah; HeroUI memberi relasi label, error, dan aksesibilitas.
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      labelClassName,
      error,
      helperText,
      isLoading,
      leftIcon,
      rightElement,
      className,
      name,
      type,
      disabled,
      required,
      ...props
    },
    ref,
  ) => {
    if (isLoading) {
      return (
        <InputSkeleton
          label={label}
          labelClassName={labelClassName}
          hasHelper={Boolean(helperText)}
          className={className}
        />
      );
    }
    return (
      <TextField
        fullWidth
        name={name}
        type={type}
        isInvalid={Boolean(error)}
        isDisabled={disabled}
        isRequired={required}
        className="flex w-full flex-col gap-1.5"
      >
        {label && (
          <Label
            className={cn("text-body-sm font-medium text-ink", labelClassName)}
          >
            {label}
          </Label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <span className="pointer-events-none absolute left-3.5 text-ink-muted">
              {leftIcon}
            </span>
          )}
          <HeroInput
            ref={ref}
            className={cn(
              "h-11 w-full rounded-2xl border bg-white px-4 text-body-md text-ink placeholder:text-ink-subtle transition-colors focus:outline-none focus:ring-2",
              leftIcon ? "pl-10" : "pl-4",
              rightElement ? "pr-10" : "pr-4",
              error
                ? "border-danger focus:border-danger focus:ring-danger/20"
                : "border-border-soft focus:border-primary focus:ring-primary/15",
              className,
            )}
            {...(props as ComponentProps<typeof HeroInput>)}
          />
          {rightElement && (
            <div className="absolute right-3 flex items-center">
              {rightElement}
            </div>
          )}
        </div>
        {error ? (
          <FieldError className="text-body-sm font-medium text-danger">
            <span role="alert">{error}</span>
          </FieldError>
        ) : helperText ? (
          <Description className="text-body-sm text-ink-muted">
            {helperText}
          </Description>
        ) : null}
      </TextField>
    );
  },
);

Input.displayName = "Input";
