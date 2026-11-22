"use client";

import { X } from "lucide-react";
import type { FormEvent } from "react";
import type { Material, MaterialForm } from "../types";

type MaterialFormDialogProps = {
  editingMaterial: Material | null;
  form: MaterialForm;
  formError: string;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onFieldChange: (field: keyof MaterialForm, value: string) => void;
};

export default function MaterialFormDialog({
  editingMaterial,
  form,
  formError,
  onClose,
  onSubmit,
  onFieldChange,
}: MaterialFormDialogProps) {
  const formInputClass =
    "entity-edit__input min-h-10 text-sm focus:border-[#103462] focus:ring-2 focus:ring-[#103462]/10 mt-1";

  return (
    <div
      className="entity-edit__overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <form
        aria-labelledby="material-form-title"
        aria-modal="true"
        className="entity-edit__dialog max-h-[90vh] w-full max-w-md overflow-y-auto"
        onSubmit={onSubmit}
        role="dialog"
      >
        <header className="entity-edit__header">
          <div>
            <h2 id="material-form-title" className="entity-edit__title">
              {editingMaterial ? "تعديل الخامة" : "إضافة خامة جديدة"}
            </h2>
          </div>
          <button
            type="button"
            aria-label="إغلاق النافذة"
            className="entity-edit__close"
            onClick={onClose}
          >
            <X size={18} aria-hidden="true" />
          </button>
        </header>

        {formError && (
          <p
            role="alert"
            className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700"
          >
            {formError}
          </p>
        )}

        <label className="entity-edit__label">
          اسم الخامة *
          <input
            autoFocus
            required
            className={formInputClass}
            value={form.name}
            onChange={(event) => onFieldChange("name", event.target.value)}
            placeholder="أدخل اسم الخامة"
          />
        </label>

        <footer className="entity-edit__actions">
          <button
            type="button"
            className="entity-edit__cancel"
            onClick={onClose}
          >
            إلغاء
          </button>
          <button type="submit" className="entity-edit__save">
            {editingMaterial ? "حفظ التعديلات" : "إضافة الخامة"}
          </button>
        </footer>
      </form>
    </div>
  );
}
