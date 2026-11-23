"use client";

import { X } from "lucide-react";
import type { FormEvent } from "react";
import { quotationStages, quotationStatuses } from "../constants";
import type { Quotation, QuotationForm } from "../types";

type QuotationFormDialogProps = {
  editingQuotation: Quotation | null;
  form: QuotationForm;
  formError: string;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onFieldChange: (field: keyof QuotationForm, value: string) => void;
};

export default function QuotationFormDialog({
  editingQuotation,
  form,
  formError,
  onClose,
  onSubmit,
  onFieldChange,
}: QuotationFormDialogProps) {
  const formInputClass =
    "entity-edit__input min-h-10 text-sm focus:border-[#103462] focus:ring-2 focus:ring-[#103462]/10";

  return (
    <div
      className="entity-edit__overlay entity-edit__overlay--form"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <form
        aria-labelledby="quotation-form-title"
        aria-modal="true"
        className="entity-edit__dialog entity-edit__dialog--form entity-edit__dialog--form-standard"
        onSubmit={onSubmit}
        role="dialog"
      >
        <header className="entity-edit__header">
          <div>
            <h2 id="quotation-form-title" className="entity-edit__title">
              {editingQuotation ? "تعديل المقايسة" : "إضافة مقايسة جديدة"}
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              الحقول المشار إليها مطلوبة. البيانات المحفوظة مؤقتة لهذه الجلسة.
            </p>
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

        <div className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2">
          <label className="entity-edit__label">
            رقم المقايسة *
            <input
              autoFocus
              required
              className={formInputClass}
              value={form.number}
              onChange={(event) => onFieldChange("number", event.target.value)}
              placeholder="أدخل رقم المقايسة"
            />
          </label>
          <label className="entity-edit__label">
            المشروع *
            <input
              required
              className={formInputClass}
              value={form.project}
              onChange={(event) => onFieldChange("project", event.target.value)}
              placeholder="أدخل اسم المشروع"
            />
          </label>
          <label className="entity-edit__label">
            الشركة *
            <input
              required
              className={formInputClass}
              value={form.company}
              onChange={(event) => onFieldChange("company", event.target.value)}
              placeholder="أدخل اسم الشركة"
            />
          </label>
          <label className="entity-edit__label">
            المسؤول الحالي *
            <input
              required
              className={formInputClass}
              value={form.owner}
              onChange={(event) => onFieldChange("owner", event.target.value)}
              placeholder="أدخل اسم المسؤول"
            />
          </label>
          <label className="entity-edit__label">
            قيمة المقايسة من الإدارة (جنيه) *
            <input
              required
              min="0"
              step="0.01"
              type="number"
              className={formInputClass}
              value={form.administrationValue}
              onChange={(event) =>
                onFieldChange("administrationValue", event.target.value)
              }
              placeholder="0.00"
            />
          </label>
          <label className="entity-edit__label">
            قيمة المقايسة من الاستشاري (جنيه) *
            <input
              required
              min="0"
              step="0.01"
              type="number"
              className={formInputClass}
              value={form.consultantValue}
              onChange={(event) =>
                onFieldChange("consultantValue", event.target.value)
              }
              placeholder="0.00"
            />
          </label>
          <label className="entity-edit__label">
            المرحلة الحالية *
            <select
              required
              className={formInputClass}
              value={form.stage}
              onChange={(event) => onFieldChange("stage", event.target.value)}
            >
              <option value="">اختر المرحلة</option>
              {quotationStages.map((stage) => (
                <option key={stage} value={stage}>
                  {stage}
                </option>
              ))}
            </select>
          </label>
          <label className="entity-edit__label">
            الحالة *
            <select
              required
              className={formInputClass}
              value={form.status}
              onChange={(event) => onFieldChange("status", event.target.value)}
            >
              <option value="">اختر الحالة</option>
              {quotationStatuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>
          <label className="entity-edit__label sm:col-span-2">
            وصف المقايسة *
            <textarea
              required
              rows={3}
              className={`${formInputClass} resize-y`}
              value={form.description}
              onChange={(event) =>
                onFieldChange("description", event.target.value)
              }
              placeholder="اكتب وصفًا مختصرًا للمقايسة"
            />
          </label>
        </div>

        <footer className="entity-edit__actions">
          <button
            type="button"
            className="entity-edit__cancel"
            onClick={onClose}
          >
            إلغاء
          </button>
          <button type="submit" className="entity-edit__save">
            {editingQuotation ? "حفظ التعديلات" : "إضافة المقايسة"}
          </button>
        </footer>
      </form>
    </div>
  );
}
