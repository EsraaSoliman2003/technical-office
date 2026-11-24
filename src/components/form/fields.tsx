"use client";

import { useId } from "react";
import { Controller, type Control, type FieldPath, type FieldValues } from "react-hook-form";
import { X } from "lucide-react";
import type { OptionList } from "@/components/options/useOptionList";
import { Button, Combobox, Input } from "@/components/ui";
import { cn } from "@/lib/cn";
import { checkDecimal, formatAmount, formatQuantity, parseDecimal } from "@/lib/numbers";

/** `TOut`: the validated values (a schema with transforms makes them differ from the field values). */
type FieldProps<TValues extends FieldValues, TOut extends FieldValues> = {
  control: Control<TValues, unknown, TOut>;
  name: FieldPath<TValues>;
  label: string;
  disabled?: boolean;
  error?: string;
};

/**
 * A dropdown chosen from existing records (`/api/{…}/options`), never typed free.
 * Optional ones can be cleared (empty = none).
 */
export function ComboboxField<TValues extends FieldValues, TOut extends FieldValues = TValues>({
  control,
  name,
  label,
  list,
  required = false,
  disabled,
  error,
}: FieldProps<TValues, TOut> & { list: OptionList; required?: boolean }) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <Combobox
          label={label}
          required={required}
          clearable={!required}
          options={list.options}
          value={field.value ?? ""}
          onChange={field.onChange}
          onBlur={field.onBlur}
          inputRef={field.ref}
          loading={list.loading}
          error={error ?? (list.loadError ? "تعذر تحميل القائمة" : undefined)}
          disabled={disabled}
          placeholder="اكتب للبحث أو اختر من القائمة"
        />
      )}
    />
  );
}

/** A date input ("yyyy-MM-dd", "" = none) with a clear button. */
export function DateField<TValues extends FieldValues, TOut extends FieldValues = TValues>({
  control,
  name,
  label,
  disabled,
  error,
}: FieldProps<TValues, TOut>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <div className="flex items-end gap-2">
          <Input
            label={label}
            type="date"
            dir="ltr"
            readOnly={disabled}
            error={error}
            containerClassName="min-w-0 flex-1"
            name={field.name}
            ref={field.ref}
            value={field.value ?? ""}
            onChange={field.onChange}
            onBlur={field.onBlur}
          />
          {field.value && (
            <Button
              variant="ghost"
              onClick={() => field.onChange("")}
              disabled={disabled}
              aria-label={`مسح ${label}`}
              title="مسح التاريخ"
              className={cn("h-11 px-3", error && "mb-6")}
            >
              <X size={16} aria-hidden="true" />
            </Button>
          )}
        </div>
      )}
    />
  );
}

/**
 * A decimal typed as text (Arabic-Indic digits accepted, ltr), formatted when leaving the field:
 * 2 decimals → "220,000,000.00", 3 decimals → "92.300" (only when the value is valid).
 */
export function DecimalField<TValues extends FieldValues, TOut extends FieldValues = TValues>({
  control,
  name,
  label,
  decimals,
  required = false,
  disabled,
  error,
}: FieldProps<TValues, TOut> & { decimals: 2 | 3; required?: boolean }) {
  const format = decimals === 3 ? formatQuantity : formatAmount;
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <Input
          label={label}
          required={required}
          dir="ltr"
          inputMode="decimal"
          autoComplete="off"
          readOnly={disabled}
          error={error}
          name={field.name}
          ref={field.ref}
          value={field.value ?? ""}
          onChange={field.onChange}
          onBlur={() => {
            field.onBlur();
            const value = String(field.value ?? "");
            if (checkDecimal(value, decimals) === "ok") field.onChange(format(parseDecimal(value) ?? 0));
          }}
        />
      )}
    />
  );
}

/** الكمية: required, 3 decimals ("92.3" → "92.300" after leaving the field). */
export function QuantityField<TValues extends FieldValues, TOut extends FieldValues = TValues>(
  props: FieldProps<TValues, TOut>
) {
  return <DecimalField {...props} decimals={3} required />;
}

/** A native select from a short fixed list (e.g. مرحلة العقد); the empty choice = none. */
export function SelectField<TValues extends FieldValues, TOut extends FieldValues = TValues>({
  control,
  name,
  label,
  list,
  emptyLabel = "—",
  disabled,
  error,
}: FieldProps<TValues, TOut> & { list: OptionList; emptyLabel?: string }) {
  const id = useId();
  const messageId = `${id}-message`;
  const message = error ?? (list.loadError ? "تعذر تحميل القائمة" : undefined);
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <div className="flex flex-col gap-1.5">
          <label htmlFor={id} className="text-sm font-semibold text-foreground">
            {label}
          </label>
          <select
            id={id}
            name={field.name}
            ref={field.ref}
            value={field.value ?? ""}
            onChange={field.onChange}
            onBlur={field.onBlur}
            disabled={disabled || list.loading}
            aria-invalid={error ? true : undefined}
            aria-describedby={message ? messageId : undefined}
            className={cn(
              "h-11 w-full rounded-lg border bg-surface px-3 text-sm text-foreground shadow-sm",
              "focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-60",
              error ? "border-danger" : "border-border"
            )}
          >
            <option value="">{list.loading ? "جاري التحميل…" : emptyLabel}</option>
            {list.options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {message && (
            <p id={messageId} className="text-xs text-danger">
              {message}
            </p>
          )}
        </div>
      )}
    />
  );
}
