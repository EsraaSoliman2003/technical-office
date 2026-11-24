"use client";

import { Controller, type Control, type FieldPath, type FieldValues } from "react-hook-form";
import { X } from "lucide-react";
import type { OptionList } from "@/components/options/useOptionList";
import { Button, Combobox, Input } from "@/components/ui";
import { cn } from "@/lib/cn";
import { checkDecimal, formatQuantity, parseDecimal } from "@/lib/numbers";

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

/** الكمية: decimal text (Arabic-Indic digits accepted), shown as "92.300" after leaving the field. */
export function QuantityField<TValues extends FieldValues, TOut extends FieldValues = TValues>({
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
        <Input
          label={label}
          required
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
            // "92.3" → "92.300" (only when the value is valid).
            const value = String(field.value ?? "");
            if (checkDecimal(value, 3) === "ok") field.onChange(formatQuantity(parseDecimal(value) ?? 0));
          }}
        />
      )}
    />
  );
}
