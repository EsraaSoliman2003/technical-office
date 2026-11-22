"use client";

import { X } from "lucide-react";
import { useState, type FormEvent } from "react";
import ImageUploadField from "@/components/ImageUploadField";
import type {
  Company,
  CompanyForm,
  CompanyFormField,
} from "../types";
import type { UploadedImage } from "@/types/UploadedImage";

type CompanyFormDialogProps = {
  editingCompany: Company | null;
  form: CompanyForm;
  formError: string;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onFieldChange: (field: CompanyFormField, value: string) => void;
  onAttachmentsAdd: (attachments: UploadedImage[]) => void;
  onAttachmentsChange: (attachments: UploadedImage[]) => void;
};

export default function CompanyFormDialog({
  editingCompany,
  form,
  formError,
  onClose,
  onSubmit,
  onFieldChange,
  onAttachmentsAdd,
  onAttachmentsChange,
}: CompanyFormDialogProps) {
  const [pendingUploadCount, setPendingUploadCount] = useState(0);
  const formInputClass =
    "entity-edit__input min-h-10 text-sm focus:border-[#103462] focus:ring-2 focus:ring-[#103462]/10 mt-1";
  const closeForm = () => {
    if (pendingUploadCount === 0) onClose();
  };
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    if (pendingUploadCount > 0) {
      event.preventDefault();
      return;
    }

    onSubmit(event);
  };

  return (
    <div
      className="entity-edit__overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) closeForm();
      }}
    >
      <form
        aria-labelledby="company-form-title"
        aria-modal="true"
        className="entity-edit__dialog max-h-[90vh] w-full max-w-xl overflow-y-auto"
        onSubmit={handleSubmit}
        role="dialog"
      >
        <header className="entity-edit__header">
          <div>
            <h2 id="company-form-title" className="entity-edit__title">
              {editingCompany ? "تعديل الشركة" : "إضافة شركة جديدة"}
            </h2>
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
          <label className="entity-edit__label">
            اسم الشركة *
            <input
              autoFocus
              required
              className={formInputClass}
              value={form.name}
              onChange={(event) => onFieldChange("name", event.target.value)}
              placeholder="أدخل اسم الشركة"
            />
          </label>
          <label className="entity-edit__label">
            الموبايل
            <input
              type="tel"
              className={formInputClass}
              value={form.mobile}
              onChange={(event) => onFieldChange("mobile", event.target.value)}
              placeholder="أدخل رقم الموبايل"
            />
          </label>
          <label className="entity-edit__label sm:col-span-2">
            السجل التجارى
            <input
              className={formInputClass}
              value={form.commercialRegister}
              onChange={(event) =>
                onFieldChange("commercialRegister", event.target.value)
              }
              placeholder="أدخل رقم السجل التجارى"
            />
          </label>
        </div>

        <div className="mt-4">
          <ImageUploadField
            label="المرفقات"
            images={form.attachments}
            onAdd={onAttachmentsAdd}
            onRemove={(id) =>
              onAttachmentsChange(
                form.attachments.filter((attachment) => attachment.id !== id),
              )
            }
            onPendingChange={(isPending) =>
              setPendingUploadCount((count) => count + (isPending ? 1 : -1))
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
              : editingCompany
                ? "حفظ التعديلات"
                : "إضافة الشركة"}
          </button>
        </footer>
      </form>
    </div>
  );
}
