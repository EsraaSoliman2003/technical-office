"use client";

import { useId, useMemo } from "react";
import { Controller, useFieldArray, useWatch, type UseFormReturn } from "react-hook-form";
import { Plus, X } from "lucide-react";
import { Button, Combobox, Input, type ComboboxOption } from "@/components/ui";
import type { MaterialOption } from "@/types/project";
import { MAX_PROJECT_MATERIALS, type ProjectSchemaType } from "@/validation/projectSchema";

type ProjectMaterialsFieldProps = {
  form: UseFormReturn<ProjectSchemaType>;
  options: MaterialOption[];
  loading: boolean;
  /** Message when the options could not be loaded. */
  loadError?: string;
  disabled: boolean;
};

/**
 * الخامات: rows of (material combobox + القيمة + remove). A material chosen in one row is
 * disabled in the others. Max 50 rows.
 */
export function ProjectMaterialsField({ form, options, loading, loadError, disabled }: ProjectMaterialsFieldProps) {
  const labelId = useId();
  const { control, register, formState } = form;
  const { fields, append, remove } = useFieldArray({ control, name: "materials" });
  const rows = useWatch({ control, name: "materials" });
  const errors = formState.errors.materials;
  const listError = errors?.message ?? errors?.root?.message;

  const chosenIds = useMemo(() => (rows ?? []).map((row) => row.materialId), [rows]);

  const optionsFor = (index: number): ComboboxOption[] =>
    options.map((option) => ({
      value: option.id,
      label: option.name,
      disabled: chosenIds.some((id, other) => other !== index && id === option.id),
    }));

  const full = fields.length >= MAX_PROJECT_MATERIALS;

  return (
    <div role="group" aria-labelledby={labelId} className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <span id={labelId} className="text-sm font-semibold text-foreground">
          الخامات
        </span>
        <span className="text-xs text-muted-foreground tabular-nums">
          {fields.length} من {MAX_PROJECT_MATERIALS}
        </span>
      </div>

      {loadError && <p className="text-xs text-danger">{loadError}</p>}

      {fields.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border bg-surface-muted/40 px-4 py-4 text-center text-sm text-muted-foreground">
          لم تتم إضافة خامات
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {fields.map((field, index) => {
            const rowErrors = errors?.[index];
            return (
              <li key={field.id} className="flex items-start gap-2">
                <span className="mt-3 w-6 shrink-0 text-center text-xs text-muted-foreground tabular-nums">
                  {index + 1}
                </span>
                <Controller
                  control={control}
                  name={`materials.${index}.materialId`}
                  render={({ field: { value, onChange, onBlur, ref } }) => (
                    <Combobox
                      aria-label={`الخامة ${index + 1}`}
                      placeholder="اختر الخامة"
                      options={optionsFor(index)}
                      value={value}
                      onChange={onChange}
                      onBlur={onBlur}
                      inputRef={ref}
                      loading={loading}
                      disabled={disabled}
                      error={rowErrors?.materialId?.message}
                      className="min-w-0 flex-[2]"
                    />
                  )}
                />
                <Input
                  aria-label={`القيمة ${index + 1}`}
                  placeholder="القيمة"
                  dir="ltr"
                  inputMode="decimal"
                  autoComplete="off"
                  readOnly={disabled}
                  error={rowErrors?.value?.message}
                  containerClassName="min-w-0 flex-1"
                  {...register(`materials.${index}.value`)}
                />
                <button
                  type="button"
                  onClick={() => remove(index)}
                  disabled={disabled}
                  aria-label={`إزالة الخامة ${index + 1}`}
                  title="إزالة"
                  className="mt-1.5 rounded-lg p-2 text-muted-foreground hover:bg-danger-soft hover:text-danger disabled:opacity-50"
                >
                  <X size={16} aria-hidden="true" />
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {listError && (
        <p role="alert" className="text-xs text-danger">
          {listError}
        </p>
      )}

      <div>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => append({ materialId: "", value: "" }, { shouldFocus: true })}
          disabled={disabled || full}
        >
          <Plus size={14} aria-hidden="true" />
          إضافة خامة
        </Button>
      </div>
    </div>
  );
}
