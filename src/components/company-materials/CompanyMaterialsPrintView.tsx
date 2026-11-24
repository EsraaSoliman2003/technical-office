"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { formatDateTime } from "@/lib/formatDate";
import { formatQuantity } from "@/lib/numbers";
import type { CompanyMaterialItem } from "@/types/companyMaterial";

export type PrintData = {
  rows: CompanyMaterialItem[];
  /** Active filters as "label: value" lines (empty → "الكل"). */
  filters: { label: string; value: string }[];
  /** Material name when a material filter is set (shown with the total). */
  materialName?: string;
  /** ISO time the data was exported. */
  printedAt: string;
};

type CompanyMaterialsPrintViewProps = {
  data: PrintData;
  /** Called after the print dialog closes. */
  onDone: () => void;
};

const COLUMNS = [
  "رقم اذن التحميل",
  "اسم المشروع",
  "الخامة",
  "الشركة المنفذة",
  "الكمية",
  "المهندس المستلم",
  "ملاحظات",
] as const;

/**
 * Print layout for خامات الشركات, rendered in the app (works in the static export and in Tauri):
 * title, active filters, print date, the business columns and the total quantity. It is hidden
 * on screen; while mounted, printing shows only this (see `.print-view` in globals.css). Opens the
 * browser's print dialog (where the user can "Save as PDF") once mounted.
 */
export default function CompanyMaterialsPrintView({ data, onDone }: CompanyMaterialsPrintViewProps) {
  const onDoneRef = useRef(onDone);
  useEffect(() => {
    onDoneRef.current = onDone;
  });

  useEffect(() => {
    document.body.classList.add("printing");
    let finished = false;
    const done = () => {
      if (finished) return;
      finished = true;
      onDoneRef.current();
    };
    // Fallback if `afterprint` never fires: the first interaction after print() returned
    // (print() blocks until the dialog closes in Chromium/WebView2 and Firefox).
    const fallbackEvents = ["pointerdown", "keydown", "focus"] as const;
    window.addEventListener("afterprint", done);
    // After the print DOM is committed and painted.
    const frame = requestAnimationFrame(() => {
      window.print();
      if (!finished) for (const type of fallbackEvents) window.addEventListener(type, done, { once: true });
    });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("afterprint", done);
      for (const type of fallbackEvents) window.removeEventListener(type, done);
      document.body.classList.remove("printing");
    };
  }, []);

  const total = data.rows.reduce((sum, row) => sum + row.quantity, 0);

  return createPortal(
    <div className="print-view" dir="rtl" lang="ar">
      <h1>خامات الشركات</h1>
      <p className="print-meta">
        {data.filters.length > 0 ? data.filters.map((filter) => `${filter.label}: ${filter.value}`).join(" · ") : "الكل"}
        {" · "}
        تاريخ الطباعة: <span dir="ltr">{formatDateTime(data.printedAt)}</span>
        {" · "}
        عدد السجلات: <span dir="ltr">{data.rows.length}</span>
      </p>

      <table>
        <thead>
          <tr>
            {COLUMNS.map((column) => (
              <th key={column}>{column}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.rows.map((row) => (
            <tr key={row.id}>
              <td>{row.loadingPermitNumber ? <span dir="ltr">{row.loadingPermitNumber}</span> : "—"}</td>
              <td>{row.projectName}</td>
              <td>{row.materialName}</td>
              <td>{row.companyName}</td>
              <td>
                <span dir="ltr">{formatQuantity(row.quantity)}</span>
              </td>
              <td>{row.receivingEngineer || "—"}</td>
              <td style={{ whiteSpace: "pre-line" }}>{row.notes || "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <p className="print-total">
        إجمالي الكمية{data.materialName ? ` (${data.materialName})` : ""}:{" "}
        <span dir="ltr">{formatQuantity(total)}</span>
      </p>
    </div>,
    document.body
  );
}
