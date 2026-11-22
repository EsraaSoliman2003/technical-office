"use client";

import { FileText, X } from "lucide-react";
import type { CompanyMaterial } from "../types";

type CompanyMaterialDetailsDialogProps = {
  companyMaterial: CompanyMaterial;
  onClose: () => void;
};

export default function CompanyMaterialDetailsDialog({
  companyMaterial,
  onClose,
}: CompanyMaterialDetailsDialogProps) {
  const details = [
    ["ملاحظات", companyMaterial.notes || "—"],
    ["المهندس المستلم", companyMaterial.receivingEngineer],
    [
      "الكمية",
      Number(companyMaterial.quantity).toLocaleString("en-US"),
    ],
    ["الشركة المنفذه", companyMaterial.executingCompany],
    ["الخامة", companyMaterial.material],
    ["اسم المشروع", companyMaterial.projectName],
    ["رقم اذن التحميل", companyMaterial.loadingPermitNumber],
  ];

  return (
    <div
      className="entity-edit__overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        aria-labelledby="company-material-details-title"
        aria-modal="true"
        className="entity-edit__dialog max-h-[90vh] w-full max-w-3xl overflow-y-auto"
        role="dialog"
      >
        <header className="entity-edit__header">
          <div>
            <h2
              id="company-material-details-title"
              className="entity-edit__title"
            >
              تفاصيل خامة الشركة
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              {companyMaterial.material} — {companyMaterial.projectName}
            </p>
          </div>
          <button
            type="button"
            aria-label="إغلاق التفاصيل"
            className="entity-edit__close"
            onClick={onClose}
          >
            <X size={18} aria-hidden="true" />
          </button>
        </header>

        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {details.map(([label, value]) => (
            <div key={label} className="rounded-lg bg-slate-50 p-3">
              <dt className="text-[11px] text-slate-500">{label}</dt>
              <dd className="mt-1 whitespace-pre-wrap text-sm font-semibold text-slate-800">
                {value}
              </dd>
            </div>
          ))}
          <div className="rounded-lg bg-slate-50 p-3 sm:col-span-2">
            <dt className="text-[11px] text-slate-500">البوليصة</dt>
            <dd className="mt-2">
              {companyMaterial.billOfLading ? (
                companyMaterial.billOfLading.mimeType.startsWith("image/") ? (
                  <img
                    src={companyMaterial.billOfLading.src}
                    alt={companyMaterial.billOfLading.name}
                    className="max-h-96 max-w-full rounded-lg object-contain"
                  />
                ) : (
                  <a
                    href={companyMaterial.billOfLading.src}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-[#103462] underline"
                  >
                    <FileText size={18} aria-hidden="true" />
                    {companyMaterial.billOfLading.name}
                  </a>
                )
              ) : (
                <span className="text-sm text-slate-500">
                  لا توجد بوليصة مرفوعة
                </span>
              )}
            </dd>
          </div>
        </dl>

        <footer className="entity-edit__actions">
          <button
            type="button"
            className="entity-edit__cancel"
            onClick={onClose}
          >
            إغلاق
          </button>
        </footer>
      </section>
    </div>
  );
}
