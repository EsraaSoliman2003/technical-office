"use client";

import { X } from "lucide-react";
import { useState, type FormEvent } from "react";
import ImageUploadField from "@/components/ImageUploadField";
import { projectStatuses } from "../constants";
import type {
  Project,
  ProjectForm,
  ProjectFormField,
  ProjectImage,
} from "../types";

type ProjectFormDialogProps = {
  editingProject: Project | null;
  form: ProjectForm;
  formError: string;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onFieldChange: (field: ProjectFormField, value: string) => void;
  onImagesAdd: (
    field: "materials" | "offers",
    images: ProjectImage[],
  ) => void;
  onImagesChange: (
    field: "materials" | "offers",
    images: ProjectImage[],
  ) => void;
};

export default function ProjectFormDialog({
  editingProject,
  form,
  formError,
  onClose,
  onSubmit,
  onFieldChange,
  onImagesAdd,
  onImagesChange,
}: ProjectFormDialogProps) {
  const [pendingUploadCount, setPendingUploadCount] = useState(0);
  const formInputClass =
    "entity-edit__input min-h-10 text-sm focus:border-[#103462] focus:ring-2 focus:ring-[#103462]/10 mt-1";
  const closeForm = () => {
    if (pendingUploadCount === 0) onClose();
  };

  const fields: {
    key: ProjectFormField;
    label: string;
    type?: "number" | "date";
    min?: string;
    max?: string;
    step?: string;
    required?: boolean;
    options?: readonly string[];
  }[] = [
    { key: "name", label: "اسم المشروع", required: true },
    { key: "allocation", label: "المخصص" },
    {
      key: "projectStatus",
      label: "موقف المشروع",
      options: projectStatuses,
    },
    {
      key: "executionPercentage",
      label: "نسبة التنفيذ (%)",
      type: "number",
      min: "0",
      max: "100",
      step: "0.01",
    },
    { key: "completionDate", label: "تاريخ النهو", type: "date" },
    { key: "curbstones", label: "بلدورات", type: "number", min: "0", step: "any" },
    { key: "marble", label: "رخام", type: "number", min: "0", step: "any" },
    { key: "cement", label: "اسمنت", type: "number", min: "0", step: "any" },
    { key: "iron", label: "حديد", type: "number", min: "0", step: "any" },
  ];

  return (
    <div
      className="entity-edit__overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) closeForm();
      }}
    >
      <form
        aria-labelledby="project-form-title"
        aria-modal="true"
        className="entity-edit__dialog max-h-[90vh] w-full max-w-3xl overflow-y-auto"
        onSubmit={onSubmit}
        role="dialog"
      >
        <header className="entity-edit__header">
          <div>
            <h2 id="project-form-title" className="entity-edit__title">
              {editingProject ? "تعديل المشروع" : "إضافة مشروع جديد"}
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              الحقول المشار إليها مطلوبة. البيانات محفوظة مؤقتًا لهذه الجلسة.
            </p>
          </div>
          <button
            type="button"
            aria-label="إغلاق النافذة"
            className="entity-edit__close"
            onClick={closeForm}
            disabled={pendingUploadCount > 0}
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

        <div className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2">
          {fields.map((field) => (
            <label
              key={field.key}
              className="entity-edit__label"
            >
              {field.label}
              {field.required ? " *" : ""}
              {field.options ? (
                <select
                  required={field.required}
                  className={formInputClass}
                  value={form[field.key]}
                  onChange={(event) =>
                    onFieldChange(field.key, event.target.value)
                  }
                >
                  <option value="">اختر موقف المشروع</option>
                  {field.options.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  autoFocus={field.key === "name"}
                  required={field.required}
                  min={field.min}
                  max={field.max}
                  step={field.step}
                  type={field.type ?? "text"}
                  className={formInputClass}
                  value={form[field.key]}
                  onChange={(event) =>
                    onFieldChange(field.key, event.target.value)
                  }
                  placeholder={
                    field.key === "name" ? "أدخل اسم المشروع" : "—"
                  }
                />
              )}
            </label>
          ))}
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <ImageUploadField
            label="الخامات"
            images={form.materials}
            onAdd={(images) => onImagesAdd("materials", images)}
            onPendingChange={(isPending) =>
              setPendingUploadCount((count) => count + (isPending ? 1 : -1))
            }
            onRemove={(id) =>
              onImagesChange(
                "materials",
                form.materials.filter((image) => image.id !== id),
              )
            }
          />
          <ImageUploadField
            label="العروض"
            images={form.offers}
            onAdd={(images) => onImagesAdd("offers", images)}
            onPendingChange={(isPending) =>
              setPendingUploadCount((count) => count + (isPending ? 1 : -1))
            }
            onRemove={(id) =>
              onImagesChange(
                "offers",
                form.offers.filter((image) => image.id !== id),
              )
            }
          />
        </div>

        <footer className="entity-edit__actions">
          <button
            type="button"
            className="entity-edit__cancel"
            onClick={closeForm}
            disabled={pendingUploadCount > 0}
          >
            إلغاء
          </button>
          <button
            type="submit"
            className="entity-edit__save"
            disabled={pendingUploadCount > 0}
          >
            {pendingUploadCount > 0
              ? "جاري تحميل الصور..."
              : editingProject
                ? "حفظ التعديلات"
                : "إضافة المشروع"}
          </button>
        </footer>
      </form>
    </div>
  );
}
