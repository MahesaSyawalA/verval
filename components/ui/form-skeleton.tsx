"use client";

import { Skeleton as HeroSkeleton } from "@heroui/react";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface FormSkeletonBaseProps extends ComponentProps<typeof HeroSkeleton> {
  label?: string | boolean;
  labelClassName?: string;
  className?: string;
}

/**
 * Base container skeleton untuk inputan form apapun.
 */
export function FormFieldSkeleton({
  label,
  labelClassName,
  className,
  children,
}: {
  label?: string | boolean;
  labelClassName?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      data-slot="form-field-skeleton"
      className={cn("flex w-full flex-col gap-1.5", className)}
      aria-hidden="true"
    >
      {label && (
        <div className="flex items-center">
          {typeof label === "string" ? (
            <span
              className={cn(
                "text-body-sm font-medium text-ink-muted",
                labelClassName,
              )}
            >
              {label}
            </span>
          ) : (
            <HeroSkeleton className="h-3.5 w-24 rounded-md bg-border-soft/70" />
          )}
        </div>
      )}
      {children}
    </div>
  );
}

export interface InputSkeletonProps extends FormSkeletonBaseProps {
  size?: "sm" | "md";
  hasHelper?: boolean;
}

/**
 * Skeleton modular dan reusable untuk komponen Input teks / angka berbasis HeroUI.
 */
export function InputSkeleton({
  label,
  labelClassName,
  size = "md",
  hasHelper = false,
  className,
  ...props
}: InputSkeletonProps) {
  return (
    <FormFieldSkeleton
      label={label}
      labelClassName={labelClassName}
      className={className}
    >
      <HeroSkeleton
        className={cn(
          "w-full rounded-2xl bg-border-soft/70 border border-border-soft/60",
          size === "sm" ? "h-9" : "h-11",
        )}
        {...props}
      />
      {hasHelper && (
        <HeroSkeleton className="h-3 w-32 rounded-md bg-border-soft/50 mt-0.5" />
      )}
    </FormFieldSkeleton>
  );
}

export interface SelectSkeletonProps extends FormSkeletonBaseProps {
  size?: "sm" | "md" | "filter";
  placeholder?: string;
}

/**
 * Skeleton modular dan reusable untuk komponen Select berbasis HeroUI.
 * Mendukung varian form standar dan varian filter tabel/topbar.
 */
export function SelectSkeleton({
  label,
  labelClassName,
  size = "md",
  className,
  ...props
}: SelectSkeletonProps) {
  if (size === "filter") {
    return (
      <div
        data-slot="select-skeleton-filter"
        className={cn(
          "flex flex-col justify-center rounded-2xl border border-border-soft/80 bg-card px-3.5 py-1.5 min-w-[190px]",
          className,
        )}
        aria-hidden="true"
      >
        {label && (
          <span
            className={cn(
              "text-[11px] font-normal text-ink-muted",
              labelClassName,
            )}
          >
            {label}
          </span>
        )}
        <div className="flex items-center justify-between gap-2 pt-0.5">
          <HeroSkeleton className="h-4 w-28 rounded-md bg-border-soft/70" />
          <HeroSkeleton className="size-4 shrink-0 rounded-full bg-border-soft/70" />
        </div>
      </div>
    );
  }

  return (
    <FormFieldSkeleton
      label={label}
      labelClassName={labelClassName}
      className={className}
    >
      <div className="relative flex items-center w-full">
        <HeroSkeleton
          className={cn(
            "w-full rounded-2xl bg-border-soft/70 border border-border-soft/60",
            size === "sm" ? "h-9" : "h-11",
          )}
          {...props}
        />
        <HeroSkeleton className="absolute right-3.5 size-4 rounded-full bg-border-soft" />
      </div>
    </FormFieldSkeleton>
  );
}

export interface TextAreaSkeletonProps extends FormSkeletonBaseProps {
  rows?: number;
  size?: "sm" | "md";
}

/**
 * Skeleton modular dan reusable untuk komponen TextArea berbasis HeroUI.
 */
export function TextAreaSkeleton({
  label,
  labelClassName,
  rows = 3,
  className,
  ...props
}: TextAreaSkeletonProps) {
  const heightClass =
    rows <= 2 ? "h-20" : rows === 3 ? "h-24" : rows === 4 ? "h-32" : "h-40";

  return (
    <FormFieldSkeleton
      label={label}
      labelClassName={labelClassName}
      className={className}
    >
      <HeroSkeleton
        className={cn(
          "w-full rounded-2xl bg-border-soft/70 border border-border-soft/60",
          heightClass,
        )}
        {...props}
      />
    </FormFieldSkeleton>
  );
}

export interface DatePickerSkeletonProps extends FormSkeletonBaseProps {
  size?: "sm" | "md";
}

/**
 * Skeleton modular dan reusable untuk komponen DatePicker berbasis HeroUI.
 */
export function DatePickerSkeleton({
  label,
  labelClassName,
  size = "md",
  className,
  ...props
}: DatePickerSkeletonProps) {
  return (
    <FormFieldSkeleton
      label={label}
      labelClassName={labelClassName}
      className={className}
    >
      <div className="relative flex items-center w-full">
        <HeroSkeleton
          className={cn(
            "w-full rounded-2xl bg-border-soft/70 border border-border-soft/60",
            size === "sm" ? "h-9" : "h-11",
          )}
          {...props}
        />
        <HeroSkeleton className="absolute right-3.5 size-4 rounded bg-border-soft" />
      </div>
    </FormFieldSkeleton>
  );
}

export interface FormGroupSkeletonProps {
  cols?: 1 | 2 | 3 | 4;
  className?: string;
  children: ReactNode;
}

/**
 * Wrapper layout form grid modular untuk menyusun skeleton input.
 */
export function FormGroupSkeleton({
  cols = 2,
  className,
  children,
}: FormGroupSkeletonProps) {
  const gridColsClass =
    cols === 1
      ? "grid-cols-1"
      : cols === 2
        ? "grid-cols-1 sm:grid-cols-2"
        : cols === 3
          ? "grid-cols-1 sm:grid-cols-3"
          : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4";

  return (
    <div
      data-slot="form-group-skeleton"
      className={cn("grid gap-4 w-full", gridColsClass, className)}
      aria-hidden="true"
    >
      {children}
    </div>
  );
}
