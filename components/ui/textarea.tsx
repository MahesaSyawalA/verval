"use client";

import {
  Description,
  FieldError,
  Label,
  TextArea as HeroTextArea,
  TextField,
} from "@heroui/react";
import {
  forwardRef,
  type ComponentProps,
  type TextareaHTMLAttributes,
} from "react";
import { cn } from "@/lib/utils";

export interface TextAreaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  /** Kelas tambahan untuk label (mis. `sr-only` atau `font-semibold`). */
  labelClassName?: string;
  error?: string;
  helperText?: string;
  size?: "sm" | "md";
}

/**
 * Area teks berbasis HeroUI. Seperti `Input`, `value` dan `onChange(e)`
 * tetap bergaya native.
 */
export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  (
    {
      label,
      labelClassName,
      error,
      helperText,
      size = "md",
      className,
      name,
      disabled,
      required,
      ...props
    },
    ref,
  ) => {
    return (
      <TextField
        fullWidth
        name={name}
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
        <HeroTextArea
          ref={ref}
          className={cn(
            "w-full resize-none rounded-2xl border bg-white px-4 py-3 text-ink placeholder:text-ink-subtle transition-colors focus:outline-none focus:ring-2 disabled:bg-surface disabled:opacity-70",
            size === "sm" ? "text-body-sm" : "text-body-md",
            error
              ? "border-danger focus:border-danger focus:ring-danger/20"
              : "border-border-soft focus:border-primary focus:ring-primary/15",
            className,
          )}
          {...(props as ComponentProps<typeof HeroTextArea>)}
        />
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

TextArea.displayName = "TextArea";
