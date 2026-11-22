"use client";

import { X } from "lucide-react";
import { useState, type FormEvent } from "react";
import type { UploadedFile } from "@/types/UploadedFile";
import BillOfLadingUploadField from "./BillOfLadingUploadField";
import type {
  CompanyMaterial,
  CompanyMaterialForm,
  CompanyMaterialFormField,
} from "../types";
import {
  companyMaterialMaterials,
  companyMaterialProjects,
  executingCompanies,
} from "../constants";

type CompanyMaterialFormDialogProps = {
  editingCompanyMaterial: CompanyMaterial | null;
  form: CompanyMaterialForm;
  formError: string;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onFieldChange: (field: CompanyMaterialFormField, value: string) => void;
  onBillOfLadingChange: (file: UploadedFile | null) => void;
};

export default function CompanyMaterialFormDialog({
  editingCompanyMaterial,
  form,
  formError,
  onClose,
  onSubmit,
  onFieldChange,
  onBillOfLadingChange,
}: CompanyMaterialFormDialogProps) {
  const [isBillUploading, setIsBillUploading] = useState(false);
  const formInputClass =
    "entity-edit__input min-h-10 text-sm focus:border-[#103462] focus:ring-2 focus:ring-[#103462]/10 mt-1";
  const closeForm = () => {
    if (!isBillUploading) onClose();
  };
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    if (isBillUploading) {
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
        aria-labelledby="company-material-form-title"
        aria-modal="true"
        className="entity-edit__dialog max-h-[90vh] w-full max-w-3xl overflow-y-auto"
        onSubmit={handleSubmit}
        role="dialog"
      >
        <header className="entity-edit__header">
          <div>
            <h2
              id="company-material-form-title"
              className="entity-edit__title"
            >
              {editingCompanyMaterial
                ? "تعديل خامة الشركة"
                : "إضافة خامة شركة"}
            </h2>
          </div>
          <button
            type="button"
            aria-label="إغلاق النافذة"
            className="entity-edit__close"
            onClick={closeForm}
            disabled={isBillUploading}
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
          <label className="entity-edit__label sm:col-span-2">
            ملاحظات
            <textarea
              rows={3}
              className={`${formInputClass} resize-y`}
              value={form.notes}
              onChange={(event) => onFieldChange("notes", event.target.value)}
              placeholder="أدخل الملاحظات"
            />
          </label>
          <label className="entity-edit__label">
            المهندس المستلم *
            <input
              required
              className={formInputClass}
              value={form.receivingEngineer}
              onChange={(event) =>
                onFieldChange("receivingEngineer", event.target.value)
              }
              placeholder="أدخل اسم المهندس المستلم"
            />
          </label>
          <label className="entity-edit__label">
            الكمية *
            <input
              required
              min="0"
              step="any"
              type="number"
              className={formInputClass}
              value={form.quantity}
              onChange={(event) => onFieldChange("quantity", event.target.value)}
              placeholder="أدخل الكمية"
            />
          </label>
          <label className="entity-edit__label">
            الشركة المنفذه *
            <select
              required
              className={formInputClass}
              value={form.executingCompany}
              onChange={(event) =>
                onFieldChange("executingCompany", event.target.value)
              }
            >
              <option value="" disabled>
                اختر الشركة المنفذة
              </option>
              {executingCompanies.map((company) => (
                <option key={company} value={company}>
                  {company}
                </option>
              ))}
            </select>
          </label>
          <label className="entity-edit__label">
            الخامه *
            <select
              required
              className={formInputClass}
              value={form.material}
              onChange={(event) => onFieldChange("material", event.target.value)}
            >
              <option value="" disabled>
                اختر الخامة
              </option>
              {companyMaterialMaterials.map((material) => (
                <option key={material} value={material}>
                  {material}
                </option>
              ))}
            </select>
          </label>
          <label className="entity-edit__label">
            اسم المشروع *
            <select
              required
              className={formInputClass}
              value={form.projectName}
              onChange={(event) =>
                onFieldChange("projectName", event.target.value)
              }
            >
              <option value="" disabled>
                اختر المشروع
              </option>
              {companyMaterialProjects.map((project) => (
                <option key={project} value={project}>
                  {project}
                </option>
              ))}
            </select>
          </label>
          <label className="entity-edit__label">
            رقم اذن التحميل *
            <input
              required
              className={formInputClass}
              value={form.loadingPermitNumber}
              onChange={(event) =>
                onFieldChange("loadingPermitNumber", event.target.value)
              }
              placeholder="أدخل رقم إذن التحميل"
            />
          </label>
          <BillOfLadingUploadField
            file={form.billOfLading}
            onChange={onBillOfLadingChange}
            onPendingChange={setIsBillUploading}
          />
        </div>

        <footer className="entity-edit__actions">
          <button
            type="button"
            className="entity-edit__cancel"
            onClick={closeForm}
            disabled={isBillUploading}
          >
            إلغاء
          </button>
          <button
            type="submit"
            className="entity-edit__save"
            disabled={isBillUploading}
          >
            {isBillUploading
              ? "جاري تحميل البوليصة..."
              : editingCompanyMaterial
                ? "حفظ التعديلات"
                : "إضافة الخامة"}
          </button>
        </footer>
      </form>
    </div>
  );
}
