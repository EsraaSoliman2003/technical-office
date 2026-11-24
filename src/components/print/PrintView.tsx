"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { formatDateTime } from "@/lib/formatDate";

export type PrintColumn<T> = {
  header: string;
  cell: (row: T) => ReactNode;
  /** Keep line breaks (e.g. notes). */
  multiline?: boolean;
};

/** What to print: built from the exported rows. */
export type PrintJob<T> = {
  title: string;
  /** Active filters as "label: value" (empty → "الكل"). */
  filters: { label: string; value: string }[];
  columns: PrintColumn<T>[];
  rows: T[];
  /** Line under the table, e.g. "إجمالي الكمية (حديد)" + "92.300". */
  total?: { label: string; value: string };
  /** ISO time the data was exported. */
  printedAt: string;
};

type PrintViewProps<T extends { id: string }> = {
  job: PrintJob<T>;
  /** Called after the print dialog closes. */
  onDone: () => void;
};

/**
 * A print layout rendered in the app (works in the static export and in Tauri): title, active
 * filters, print date, a table and an optional total. It is hidden on screen; while mounted,
 * printing shows only this (A4 landscape, always light: `.print-view` in globals.css). Opens the
 * browser's print dialog (where the user can "Save as PDF") once mounted. Mount it with a `key`
 * per job so printing again remounts it.
 */
export default function PrintView<T extends { id: string }>({ job, onDone }: PrintViewProps<T>) {
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

  return createPortal(
    <div className="print-view" dir="rtl" lang="ar">
      <h1>{job.title}</h1>
      <p className="print-meta">
        {job.filters.length > 0 ? job.filters.map((filter) => `${filter.label}: ${filter.value}`).join(" · ") : "الكل"}
        {" · "}
        تاريخ الطباعة: <span dir="ltr">{formatDateTime(job.printedAt)}</span>
        {" · "}
        عدد السجلات: <span dir="ltr">{job.rows.length}</span>
      </p>

      <table>
        <thead>
          <tr>
            {job.columns.map((column) => (
              <th key={column.header}>{column.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {job.rows.map((row) => (
            <tr key={row.id}>
              {job.columns.map((column) => (
                <td key={column.header} style={column.multiline ? { whiteSpace: "pre-line" } : undefined}>
                  {column.cell(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {job.total && (
        <p className="print-total">
          {job.total.label}: <span dir="ltr">{job.total.value}</span>
        </p>
      )}
    </div>,
    document.body
  );
}
