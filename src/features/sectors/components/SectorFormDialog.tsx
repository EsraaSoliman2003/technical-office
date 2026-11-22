"use client";

import { X } from "lucide-react";
import type { FormEvent } from "react";
import type { Sector, SectorForm } from "../types";

type SectorFormDialogProps = {
  editingSector: Sector | null;
  form: SectorForm;
  formError: string;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onFieldChange: (field: keyof SectorForm, value: string) => void;
};

export default function SectorFormDialog({
  editingSector,
  form,
  formError,
  onClose,
  onSubmit,
  onFieldChange,
}: SectorFormDialogProps) {
  const formInputClass =
    "entity-edit__input min-h-10 text-sm focus:border-[#103462] focus:ring-2 focus:ring-[#103462]/10 mt-2";

  return (
    <div
      className="entity-edit__overlay entity-edit__overlay--form"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <form
        aria-labelledby="sector-form-title"
        aria-modal="true"
        className="entity-edit__dialog entity-edit__dialog--form entity-edit__dialog--form-compact"
        onSubmit={onSubmit}
        role="dialog"
      >
        <header className="entity-edit__header">
          <div>
            <h2 id="sector-form-title" className="entity-edit__title">
              {editingSector ? "تعديل القطاع" : "إضافة قطاع جديد"}
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
          اسم القطاع *
          <input
            autoFocus
            required
            className={formInputClass}
            value={form.name}
            onChange={(event) => onFieldChange("name", event.target.value)}
            placeholder="أدخل اسم القطاع"
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
            {editingSector ? "حفظ التعديلات" : "إضافة القطاع"}
          </button>
        </footer>
      </form>
    </div>
  );
}
