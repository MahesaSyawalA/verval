"use client";

import {
  Calendar,
  DateField,
  DatePicker as HeroDatePicker,
  DatePickerPopover,
  DatePickerRoot,
  DatePickerTrigger,
  DatePickerTriggerIndicator,
  Description,
  FieldError,
  Label,
} from "@heroui/react";
import { parseDate, type CalendarDate } from "@internationalized/date";
import type { ChangeEvent } from "react";
import { cn } from "@/lib/utils";

export interface DatePickerProps {
  id?: string;
  name?: string;
  label?: string;
  labelClassName?: string;
  /** Nilai tanggal dalam format ISO `"YYYY-MM-DD"`. */
  value?: string;
  defaultValue?: string;
  onValueChange?: (isoDate: string) => void;
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  helperText?: string;
  disabled?: boolean;
  required?: boolean;
  minValue?: string;
  maxValue?: string;
  className?: string;
  "aria-label"?: string;
}

function safeParseIsoDate(raw?: string): CalendarDate | undefined {
  if (!raw || !/^\d{4}-\d{2}-\d{2}$/.test(raw.trim())) {
    return undefined;
  }
  try {
    return parseDate(raw.trim());
  } catch {
    return undefined;
  }
}

/**
 * Pembungkus DatePicker berbasis HeroUI v3 (`DatePicker`, `Label`,
 * `DateField.Group`, `DateField.Input`, `DateField.Segment`, `DateField.Suffix`,
 * `DatePicker.Trigger`, `DatePicker.TriggerIndicator`, `DatePicker.Popover`,
 * `Calendar`, `Description`, `FieldError`).
 */
export function DatePicker({
  id,
  name,
  label,
  labelClassName,
  value,
  defaultValue,
  onValueChange,
  onChange,
  error,
  helperText,
  disabled,
  required,
  minValue,
  maxValue,
  className,
  "aria-label": ariaLabel,
}: DatePickerProps) {
  const parsedValue = value !== undefined ? (safeParseIsoDate(value) ?? null) : undefined;
  const parsedDefault = safeParseIsoDate(defaultValue);
  const parsedMin = safeParseIsoDate(minValue);
  const parsedMax = safeParseIsoDate(maxValue);

  function handleDateChange(nextDate: CalendarDate | null) {
    const iso = nextDate ? nextDate.toString() : "";
    onValueChange?.(iso);
    if (onChange) {
      onChange({
        target: { value: iso },
        currentTarget: { value: iso },
      } as ChangeEvent<HTMLInputElement>);
    }
  }

  return (
    <HeroDatePicker
      id={id}
      name={name}
      value={parsedValue}
      defaultValue={parsedDefault}
      onChange={handleDateChange}
      minValue={parsedMin}
      maxValue={parsedMax}
      isInvalid={Boolean(error)}
      isDisabled={disabled}
      isRequired={required}
      aria-label={ariaLabel ?? (!label ? "Pilih tanggal" : undefined)}
      className={cn("flex w-full flex-col gap-1.5", className)}
    >
      {label && (
        <Label
          className={cn("text-body-sm font-medium text-ink", labelClassName)}
        >
          {label}
        </Label>
      )}
      <DateField.Group
        fullWidth
        className={cn(
          "flex h-11 w-full items-center justify-between rounded-2xl border bg-white px-4 text-body-md text-ink transition-colors focus-within:ring-2",
          error
            ? "border-danger focus-within:border-danger focus-within:ring-danger/20"
            : "border-border-soft focus-within:border-primary focus-within:ring-primary/15",
        )}
      >
        <DateField.Input className="flex flex-1 items-center gap-0.5 outline-none">
          {(segment) => (
            <DateField.Segment
              segment={segment}
              className="rounded px-0.5 text-ink outline-none focus:bg-primary-50 focus:text-primary data-[placeholder=true]:text-ink-subtle"
            />
          )}
        </DateField.Input>
        <DateField.Suffix className="ml-2 flex shrink-0 items-center">
          <HeroDatePicker.Trigger className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-surface hover:text-primary focus:outline-none cursor-pointer">
            <HeroDatePicker.TriggerIndicator className="size-4" />
          </HeroDatePicker.Trigger>
        </DateField.Suffix>
      </DateField.Group>
      {error ? (
        <FieldError className="text-body-sm font-medium text-danger">
          <span role="alert">{error}</span>
        </FieldError>
      ) : helperText ? (
        <Description className="text-body-sm text-ink-muted">
          {helperText}
        </Description>
      ) : null}
      <HeroDatePicker.Popover className="z-50 rounded-2xl border border-border-soft bg-white p-3 shadow-lg outline-none">
        <Calendar
          aria-label={label ?? ariaLabel ?? "Kalender"}
          className="w-64"
        >
          <Calendar.Header className="flex items-center justify-between pb-3">
            <Calendar.Heading className="font-heading text-body-sm font-bold text-ink" />
            <div className="flex items-center gap-1">
              <Calendar.NavButton
                slot="previous"
                className="inline-flex h-7 w-7 items-center justify-center rounded-full text-ink hover:bg-surface cursor-pointer"
              />
              <Calendar.NavButton
                slot="next"
                className="inline-flex h-7 w-7 items-center justify-center rounded-full text-ink hover:bg-surface cursor-pointer"
              />
            </div>
          </Calendar.Header>
          <Calendar.Grid className="w-full border-collapse">
            <Calendar.GridHeader>
              {(day) => (
                <Calendar.HeaderCell className="pb-1.5 text-center text-[11px] font-semibold text-ink-muted">
                  {day}
                </Calendar.HeaderCell>
              )}
            </Calendar.GridHeader>
            <Calendar.GridBody>
              {(date) => (
                <Calendar.Cell
                  date={date}
                  className="mx-auto flex h-8 w-8 items-center justify-center rounded-full text-body-sm font-medium text-ink outline-none transition-colors hover:bg-primary-50 data-[selected=true]:bg-primary data-[selected=true]:text-white data-[outside-month=true]:text-ink-subtle data-[outside-month=true]:opacity-50 cursor-pointer"
                />
              )}
            </Calendar.GridBody>
          </Calendar.Grid>
        </Calendar>
      </HeroDatePicker.Popover>
    </HeroDatePicker>
  );
}

export {
  Calendar,
  DateField,
  DatePickerPopover,
  DatePickerRoot,
  DatePickerTrigger,
  DatePickerTriggerIndicator,
};
