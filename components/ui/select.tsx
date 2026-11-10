"use client";

import {
  Description,
  FieldError,
  Label,
  ListBox,
  Select as HeroSelect,
  SelectClearButton,
  SelectIndicator,
  SelectPopover,
  SelectRoot,
  SelectTrigger,
  SelectValue,
} from "@heroui/react";
import type { ChangeEvent, Key, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { SelectSkeleton } from "./form-skeleton";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps {
  id?: string;
  name?: string;
  label?: string;
  labelClassName?: string;
  placeholder?: string;
  value?: string;
  defaultValue?: string;
  options: SelectOption[];
  onValueChange?: (value: string) => void;
  onChange?: (e: ChangeEvent<HTMLSelectElement>) => void;
  error?: string;
  helperText?: string;
  disabled?: boolean;
  required?: boolean;
  isLoading?: boolean;
  size?: "sm" | "md" | "filter";
  leftIcon?: ReactNode;
  className?: string;
  triggerClassName?: string;
  "aria-label"?: string;
}

/**
 * Pembungkus Select berbasis HeroUI v3 (`Select`, `Label`, `Select.Trigger`,
 * `Select.Value`, `Select.Indicator`, `Select.Popover`, `ListBox`,
 * `ListBox.Item`, `ListBox.ItemIndicator`, `Description`, `FieldError`).
 */
export function Select({
  id,
  name,
  label,
  labelClassName,
  placeholder = "Pilih opsi",
  value,
  defaultValue,
  options,
  onValueChange,
  onChange,
  error,
  helperText,
  disabled,
  required,
  isLoading,
  size = "md",
  leftIcon,
  className,
  triggerClassName,
  "aria-label": ariaLabel,
}: SelectProps) {
  if (isLoading) {
    return (
      <SelectSkeleton
        label={label}
        labelClassName={labelClassName}
        size={size}
        className={className}
      />
    );
  }
  function handleSelectionChange(nextKey: Key | null) {
    if (nextKey === null || nextKey === undefined) return;
    const nextValue = String(nextKey);
    onValueChange?.(nextValue);
    if (onChange) {
      onChange({
        target: { value: nextValue },
        currentTarget: { value: nextValue },
      } as ChangeEvent<HTMLSelectElement>);
    }
  }

  const disabledKeys = options
    .filter((opt) => opt.disabled)
    .map((opt) => opt.value);

  if (size === "filter") {
    return (
      <HeroSelect
        id={id}
        name={name}
        placeholder={placeholder}
        value={value}
        defaultValue={defaultValue}
        onChange={handleSelectionChange}
        isInvalid={Boolean(error)}
        isDisabled={disabled}
        isRequired={required}
        disabledKeys={disabledKeys}
        aria-label={ariaLabel ?? label}
        className={cn(
          "flex flex-col rounded-2xl border border-border-soft bg-white px-3.5 py-1.5",
          className,
        )}
      >
        {label && (
          <Label
            className={cn(
              "text-[11px] font-normal text-ink-muted",
              labelClassName,
            )}
          >
            {label}
          </Label>
        )}
        <HeroSelect.Trigger
          className={cn(
            "relative flex w-full items-center justify-between gap-2 bg-transparent text-left text-body-sm font-semibold text-ink outline-none cursor-pointer",
            triggerClassName,
          )}
        >
          <HeroSelect.Value className="flex-1 truncate [&_[data-slot=list-box-item-indicator]]:hidden" />
          <HeroSelect.Indicator className="size-4 shrink-0 text-ink-muted transition-transform data-[open=true]:rotate-180" />
        </HeroSelect.Trigger>
        <HeroSelect.Popover className="z-50 min-w-(--trigger-width) overflow-y-auto rounded-2xl border border-border-soft bg-white p-1.5 shadow-lg outline-none">
          <ListBox className="flex flex-col gap-0.5 outline-none">
            {options.map((opt) => (
              <ListBox.Item
                key={opt.value}
                id={opt.value}
                textValue={opt.label}
                className="relative flex min-h-9 w-full items-center justify-between gap-2 rounded-xl px-3 py-1.5 text-body-sm font-medium text-ink outline-none transition-colors hover:bg-surface data-[selected=true]:bg-primary-50 data-[selected=true]:font-semibold data-[selected=true]:text-primary cursor-pointer"
              >
                <span className="truncate">{opt.label}</span>
                <ListBox.ItemIndicator className="inline-flex size-4 shrink-0 items-center justify-center text-primary opacity-0 data-[visible=true]:opacity-100 [&>svg]:size-3.5" />
              </ListBox.Item>
            ))}
          </ListBox>
        </HeroSelect.Popover>
      </HeroSelect>
    );
  }

  const isCustomWidth = Boolean(className && /\bw-\S+/.test(className));

  return (
    <HeroSelect
      id={id}
      name={name}
      fullWidth={!isCustomWidth}
      placeholder={placeholder}
      value={value}
      defaultValue={defaultValue}
      onChange={handleSelectionChange}
      isInvalid={Boolean(error)}
      isDisabled={disabled}
      isRequired={required}
      disabledKeys={disabledKeys}
      aria-label={ariaLabel ?? (!label ? placeholder : undefined)}
      className={cn("flex flex-col gap-1.5", !isCustomWidth && "w-full", className)}
    >
      {label && (
        <Label
          className={cn("text-body-sm font-medium text-ink", labelClassName)}
        >
          {label}
        </Label>
      )}
      <HeroSelect.Trigger
        className={cn(
          "relative flex h-11 w-full items-center justify-between gap-2 rounded-2xl border bg-white px-4 text-left text-ink transition-colors focus:outline-none focus:ring-2 cursor-pointer disabled:bg-surface disabled:opacity-70",
          size === "sm" ? "text-body-sm font-medium px-3.5" : "text-body-md",
          error
            ? "border-danger focus:border-danger focus:ring-danger/20"
            : "border-border-soft focus:border-primary focus:ring-primary/15",
          triggerClassName,
        )}
      >
        <span className="flex min-w-0 flex-1 items-center gap-2 truncate">
          {leftIcon && (
            <span className="shrink-0 text-ink-muted">{leftIcon}</span>
          )}
          <HeroSelect.Value className="flex-1 truncate data-[placeholder=true]:text-ink-subtle [&_[data-slot=list-box-item-indicator]]:hidden" />
        </span>
        <HeroSelect.Indicator className="size-4 shrink-0 text-ink-muted transition-transform data-[open=true]:rotate-180" />
      </HeroSelect.Trigger>
      {error ? (
        <FieldError className="text-body-sm font-medium text-danger">
          <span role="alert">{error}</span>
        </FieldError>
      ) : helperText ? (
        <Description className="text-body-sm text-ink-muted">
          {helperText}
        </Description>
      ) : null}
      <HeroSelect.Popover className="z-50 max-h-64 min-w-(--trigger-width) overflow-y-auto rounded-2xl border border-border-soft bg-white p-1.5 shadow-lg outline-none">
        <ListBox className="flex flex-col gap-0.5 outline-none">
          {options.map((opt) => (
            <ListBox.Item
              key={opt.value}
              id={opt.value}
              textValue={opt.label}
              className="relative flex min-h-9 w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-body-sm font-medium text-ink outline-none transition-colors hover:bg-surface data-[selected=true]:bg-primary-50 data-[selected=true]:font-semibold data-[selected=true]:text-primary cursor-pointer"
            >
              <span className="truncate">{opt.label}</span>
              <ListBox.ItemIndicator className="inline-flex size-4 shrink-0 items-center justify-center text-primary opacity-0 data-[visible=true]:opacity-100 [&>svg]:size-3.5" />
            </ListBox.Item>
          ))}
        </ListBox>
      </HeroSelect.Popover>
    </HeroSelect>
  );
}

export {
  ListBox,
  SelectClearButton,
  SelectIndicator,
  SelectPopover,
  SelectRoot,
  SelectTrigger,
  SelectValue,
};
