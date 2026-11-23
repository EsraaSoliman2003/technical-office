"use client";

import { X } from "lucide-react";
import { quotationStatusClassName } from "../constants";
import type { Quotation } from "../types";

type QuotationDetailsDialogProps = {
  quotation: Quotation;
  onClose: () => void;
};

export default function QuotationDetailsDialog({
  quotation,
  onClose,
}: QuotationDetailsDialogProps) {
  return (
    <div
      className="entity-edit__overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        aria-labelledby="quotation-details-title"
        aria-modal="true"
        className="entity-edit__dialog max-h-[90vh] overflow-y-auto"
        role="dialog"
      >
        <header className="entity-edit__header">
          <div>
            <h2 id="quotation-details-title" className="entity-edit__title">
              تفاصيل المقايسة
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              رقم {quotation.number}
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
          {[
            ["المشروع", quotation.project],
            ["الشركة", quotation.company],
            ["قيمة الإدارة", `${quotation.administrationValue} جنيه`],
            ["قيمة الاستشاري", `${quotation.consultantValue} جنيه`],
            ["المرحلة الحالية", quotation.stage],
            ["المسؤول الحالي", quotation.owner],
          ].map(([label, value]) => (
            <div key={label} className="rounded-lg bg-slate-50 p-3">
              <dt className="text-[11px] text-slate-500">{label}</dt>
              <dd className="mt-1 text-sm font-semibold text-slate-800">
                {value}
              </dd>
            </div>
          ))}
          <div className="rounded-lg bg-slate-50 p-3">
            <dt className="text-[11px] text-slate-500">الحالة</dt>
            <dd className="mt-1">
              <span
                className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${quotationStatusClassName[quotation.status] ?? "bg-slate-100 text-slate-700"}`}
              >
                {quotation.status}
              </span>
            </dd>
          </div>
          <div className="rounded-lg bg-slate-50 p-3 sm:col-span-2">
            <dt className="text-[11px] text-slate-500">وصف المقايسة</dt>
            <dd className="mt-1 whitespace-pre-wrap text-sm text-slate-800">
              {quotation.description}
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
