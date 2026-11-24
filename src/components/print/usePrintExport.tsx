"use client";

import { useState, type ReactNode } from "react";
import { Printer } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui";
import { getFailureMessage, isApiFailure, NO_PERMISSION_MESSAGE, type ApiFailure } from "@/utils/apiFailure";
import PrintView, { type PrintJob } from "./PrintView";

/**
 * `/export` failure → toast text. The API reports "more than 5000 rows" as a 400 with
 * `errors.search`; any other 400 shows its first field error (or the general message).
 */
export function exportErrorMessage(failure: ApiFailure | undefined) {
  if (failure?.status === 403) return NO_PERMISSION_MESSAGE;
  if (failure?.status === 400) {
    const entries = Object.entries(failure.fieldErrors);
    if (entries.some(([key]) => key.toLowerCase() === "search")) {
      return "عدد السجلات كبير جدًا للطباعة (الحد الأقصى 5000 سجل). ضيّق نطاق البحث أو الفلاتر ثم حاول مرة أخرى.";
    }
    const first = entries.flatMap(([, messages]) => messages)[0];
    if (first) return first;
  }
  return getFailureMessage(failure);
}

type ExportResult<T> = { data?: T[]; error?: unknown };

/**
 * طباعة / PDF for a list: `print(fetchRows, buildJob)` fetches all rows for the current filters
 * (the page's `/export`), shows the errors as toasts, then mounts the print view. Render `button`
 * (e.g. in `ListPage` headerActions) and `view` (anywhere in the page).
 *
 * `fetchRows` should be a one-off, unsubscribed fetch (e.g. `dispatch(api.endpoints.x.initiate(args,
 * { subscribe: false, forceRefetch: true }))`) so up to 5000 rows are not kept in the store.
 */
export function usePrintExport<T extends { id: string }>() {
  const [exporting, setExporting] = useState(false);
  const [job, setJob] = useState<PrintJob<T> | null>(null);

  const print = async (
    fetchRows: () => PromiseLike<ExportResult<T>>,
    buildJob: (rows: T[], printedAt: string) => PrintJob<T>
  ) => {
    if (exporting) return;
    setExporting(true);
    let result: ExportResult<T>;
    try {
      result = await fetchRows();
    } finally {
      setExporting(false);
    }
    if (result.error || !result.data) {
      toast.error(exportErrorMessage(isApiFailure(result.error) ? result.error : undefined));
      return;
    }
    if (result.data.length === 0) {
      toast.error("لا توجد بيانات للطباعة");
      return;
    }
    setJob(buildJob(result.data, new Date().toISOString()));
  };

  const button = (onClick: () => void): ReactNode => (
    <Button variant="secondary" onClick={onClick} loading={exporting}>
      {!exporting && <Printer size={18} aria-hidden="true" />}
      طباعة / PDF
    </Button>
  );

  // Keyed: printing again (even if the last afterprint never came) remounts and prints.
  const view = job && <PrintView key={job.printedAt} job={job} onDone={() => setJob(null)} />;

  return { exporting, print, button, view };
}
