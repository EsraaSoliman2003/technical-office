"use client";

import { X } from "lucide-react";
import { useState, type FormEvent } from "react";
import ImageUploadField from "@/components/ImageUploadField";
import {
  factories,
  materials,
  mixers,
  projects,
  projectTypes,
  transportCompanies,
} from "../constants";
import type {
  ProjectMaterial,
  ProjectMaterialForm,
  ProjectMaterialFormField,
} from "../types";
import type { UploadedFile } from "@/types/UploadedFile";

type ProjectMaterialFormDialogProps = {
  editingProjectMaterial: ProjectMaterial | null;
  form: ProjectMaterialForm;
  formError: string;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onFieldChange: (field: ProjectMaterialFormField, value: string) => void;
  onBillAttachmentChange: (file: UploadedFile | null) => void;
};

export default function ProjectMaterialFormDialog({
  editingProjectMaterial,
  form,
  formError,
  onClose,
  onSubmit,
  onFieldChange,
  onBillAttachmentChange,
}: ProjectMaterialFormDialogProps) {
  const [isUploading, setIsUploading] = useState(false);
  const formInputClass =
    "entity-edit__input min-h-10 text-sm focus:border-[#103462] focus:ring-2 focus:ring-[#103462]/10 mt-1";
  const closeForm = () => {
    if (!isUploading) onClose();
  };
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    if (isUploading) {
      event.preventDefault();
      return;
    }

    onSubmit(event);
  };

  const fields: {
    key: ProjectMaterialFormField;
    label: string;
    type?: "number" | "date";
    min?: string;
    step?: string;
    required?: boolean;
    options?: readonly string[];
    multiline?: boolean;
  }[] = [
    { key: "authorizationNumber", label: "رقم التفويض", required: true },
    {
      key: "projectType",
      label: "نوع المشروع",
      options: projectTypes,
      required: true,
    },
    {
      key: "projectName",
      label: "المشروع",
      options: projects,
      required: true,
    },
    { key: "billOfLadingNumber", label: "رقم البوليصة", required: true },
    { key: "billDate", label: "تاريخ البوليصة", type: "date", required: true },
    {
      key: "quantity",
      label: "الكمية",
      type: "number",
      min: "0",
      step: "any",
      required: true,
    },
    {
      key: "material",
      label: "الخامة",
      options: materials,
      required: true,
    },
    { key: "loadingPermitNumber", label: "إذن التحميل", required: true },
    { key: "salesOrderNumber", label: "رقم أمر البيع", required: true },
    { key: "vehicleNumber", label: "رقم السيارة", required: true },
    { key: "driverName", label: "اسم السائق", required: true },
    {
      key: "factory",
      label: "المصنع",
      options: factories,
      required: true,
    },
    {
      key: "mixer",
      label: "الخلاطة",
      options: mixers,
      required: true,
    },
    {
      key: "transportCompany",
      label: "شركة النقل",
      options: transportCompanies,
      required: true,
    },
    {
      key: "receivedDate",
      label: "تاريخ الاستلام",
      type: "date",
      required: true,
    },
    {
      key: "exitDate",
      label: "تاريخ الخروج",
      type: "date",
      required: true,
    },
    { key: "notes", label: "ملاحظات", multiline: true },
  ];

  return (
    <div
      className="entity-edit__overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) closeForm();
      }}
    >
      <form
        aria-labelledby="project-material-form-title"
        aria-modal="true"
        className="entity-edit__dialog max-h-[90vh] w-full max-w-4xl overflow-y-auto"
        onSubmit={handleSubmit}
        role="dialog"
      >
        <header className="entity-edit__header">
          <div>
            <h2
              id="project-material-form-title"
              className="entity-edit__title"
            >
              {editingProjectMaterial
                ? "تعديل خامة المشروع"
                : "إضافة خامة مشروع"}
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              البيانات محفوظة مؤقتًا لهذه الجلسة.
            </p>
          </div>
          <button
            type="button"
            aria-label="إغلاق النافذة"
            className="entity-edit__close"
            onClick={closeForm}
            disabled={isUploading}
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
              className={`entity-edit__label${field.multiline ? " sm:col-span-2" : ""}`}
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
                  <option value="">اختر {field.label}</option>
                  {field.options.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              ) : field.multiline ? (
                <textarea
                  rows={3}
                  className={`${formInputClass} resize-y`}
                  value={form[field.key]}
                  onChange={(event) =>
                    onFieldChange(field.key, event.target.value)
                  }
                  placeholder="أدخل الملاحظات"
                />
              ) : (
                <input
                  autoFocus={field.key === "authorizationNumber"}
                  required={field.required}
                  min={field.min}
                  step={field.step}
                  type={field.type ?? "text"}
                  className={formInputClass}
                  value={form[field.key]}
                  onChange={(event) =>
                    onFieldChange(field.key, event.target.value)
                  }
                  placeholder={field.label}
                />
              )}
            </label>
          ))}
          <div className="sm:col-span-2">
            <ImageUploadField
              label="مرفق البوليصة"
              images={form.billAttachment ? [form.billAttachment] : []}
              multiple={false}
              onAdd={(files) => onBillAttachmentChange(files[0] ?? null)}
              onRemove={() => onBillAttachmentChange(null)}
              onPendingChange={setIsUploading}
            />
          </div>
        </div>

        <footer className="entity-edit__actions">
          <button
            type="button"
            className="entity-edit__cancel"
            onClick={closeForm}
            disabled={isUploading}
          >
            إلغاء
          </button>
          <button
            type="submit"
            className="entity-edit__save"
            disabled={isUploading}
          >
            {isUploading
              ? "جاري تحميل الصورة..."
              : editingProjectMaterial
                ? "حفظ التعديلات"
                : "إضافة الخامة"}
          </button>
        </footer>
      </form>
    </div>
  );
}
