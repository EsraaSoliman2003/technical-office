"use client";

import type { ReactNode } from "react";
import { skipToken } from "@reduxjs/toolkit/query";
import { AlertTriangle } from "lucide-react";
import { Spinner } from "@/components/ui";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { cn } from "@/lib/cn";
import { checkDecimal, formatQuantity, parseDecimal } from "@/lib/numbers";
import { useMaterialDeliveryTotalsQuery } from "@/rtk/endpoints/materialDeliveryApi";

type DeliveryTotalsPanelProps = {
  projectId: string;
  materialId: string;
  /** The delivery being edited (its saved quantity is not counted twice). */
  excludeId?: string | null;
  /** The quantity being typed (added to what was dispensed when valid). */
  quantity: string;
};

function TotalBox({ label, value, tone }: { label: string; value: ReactNode; tone?: "danger" }) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border border-border bg-surface px-3 py-2">
      <dt className="text-xs font-semibold text-muted-foreground">{label}</dt>
      <dd className={cn("text-sm font-bold text-foreground", tone === "danger" && "text-danger")}>{value}</dd>
    </div>
  );
}

/** A quantity in integer thousandths (it has at most 3 decimals). */
const toMilli = (value: number) => Math.round(value * 1000);

/** Numbers left-to-right (a negative remainder keeps its sign on the left). */
const ltr = (value: number) => (
  <span dir="ltr" className="tabular-nums">
    {formatQuantity(value)}
  </span>
);

/**
 * Read-only totals for the chosen project + material (like the old screen's boxes):
 * اجمالي التصديق (approved), اجمالي المنصرف (dispensed + the typed quantity), المتبقي, and a
 * non-blocking warning when dispensed exceeds approved. Refetched (debounced) when the project
 * or material changes.
 */
export function DeliveryTotalsPanel({ projectId, materialId, excludeId, quantity }: DeliveryTotalsPanelProps) {
  const key = useDebouncedValue(projectId && materialId ? `${projectId}|${materialId}` : "", 300);
  const [debouncedProject, debouncedMaterial] = key.split("|");
  const args =
    key && debouncedProject === projectId && debouncedMaterial === materialId
      ? { projectId, materialId, ...(excludeId ? { excludeId } : {}) }
      : skipToken;
  const { currentData, isFetching, isError, refetch } = useMaterialDeliveryTotalsQuery(args);

  if (!projectId || !materialId) return null;

  const typed = checkDecimal(quantity, 3) === "ok" ? (parseDecimal(quantity) ?? 0) : 0;
  let body;
  if (!currentData && (isFetching || args === skipToken)) {
    body = (
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <Spinner size={16} /> جاري حساب الإجماليات…
      </p>
    );
  } else if (!currentData || isError) {
    body = (
      <p className="flex flex-wrap items-center gap-2 text-sm text-danger">
        تعذر تحميل الإجماليات.
        <button type="button" onClick={() => refetch()} className="font-semibold underline">
          إعادة المحاولة
        </button>
      </p>
    );
  } else {
    // In integer thousandths (3 decimals), so exact totals compare equal (no false warning,
    // no "-0.000" from floating-point leftovers like 0.1 + 0.2).
    const approvedMilli = currentData.approved === null ? null : toMilli(currentData.approved);
    const dispensedMilli = toMilli(currentData.dispensed) + toMilli(typed);
    const remainingMilli = approvedMilli === null ? null : approvedMilli - dispensedMilli;
    const approved = approvedMilli === null ? null : approvedMilli / 1000;
    const dispensed = dispensedMilli / 1000;
    const remaining = remainingMilli === null ? null : remainingMilli / 1000;
    const exceeded = remainingMilli !== null && remainingMilli < 0;
    body = (
      <>
        <dl className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <TotalBox label="اجمالي التصديق" value={approved === null ? "غير محدد في المشروع" : ltr(approved)} />
          <TotalBox label="اجمالي المنصرف" value={ltr(dispensed)} tone={exceeded ? "danger" : undefined} />
          <TotalBox
            label="المتبقي"
            value={remaining === null ? "—" : ltr(remaining)}
            tone={remaining !== null && remaining < 0 ? "danger" : undefined}
          />
        </dl>
        {exceeded && (
          <p role="alert" className="mt-2 flex items-center gap-2 text-sm font-semibold text-danger">
            <AlertTriangle size={16} aria-hidden="true" className="shrink-0" />
            الكمية المنصرفة تتجاوز الكمية المصدّق عليها
          </p>
        )}
      </>
    );
  }

  return (
    <section
      aria-label="إجماليات الخامة في المشروع"
      aria-busy={isFetching}
      className="rounded-xl border border-border bg-surface-muted/60 p-3"
    >
      {body}
    </section>
  );
}
