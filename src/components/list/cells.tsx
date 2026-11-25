"use client";

import { Paperclip } from "lucide-react";
import { formatAmount, formatDateOnly, formatQuantity } from "@/lib/numbers";

/** "92.300" (3 decimals, Latin digits, ltr). */
export function QuantityText({ value }: { value: number }) {
  return (
    <span dir="ltr" className="tabular-nums">
      {formatQuantity(value)}
    </span>
  );
}

/** Text shown left-to-right (numbers, codes), or "—" when empty. */
export function LtrText({ value }: { value: string | null | undefined }) {
  return value ? <span dir="ltr">{value}</span> : "—";
}

/** Long text clamped to two lines; the full text is in the tooltip (and read in full by screen readers). */
export function NotesCell({ value }: { value: string | null | undefined }) {
  if (!value) return "—";
  return (
    <p title={value} className="line-clamp-2 max-w-64 whitespace-pre-line">
      {value}
    </p>
  );
}

/** Paperclip button with the attachment count (opens the viewer), or "—" when there are none. */
export function AttachmentCountButton({
  count,
  label,
  title = "عرض المرفقات",
  onClick,
}: {
  count: number;
  /** Accessible name, e.g. "عرض البوليصة: حديد - شركة النور". */
  label: string;
  /** Tooltip (default "عرض المرفقات"). */
  title?: string;
  onClick: () => void;
}) {
  if (count === 0) return "—";
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`${label} (${count})`}
      title={title}
      className="inline-flex items-center gap-1 rounded-lg border border-border px-2 py-1 text-xs font-semibold text-foreground hover:border-primary/40 hover:bg-primary-soft hover:text-primary-text"
    >
      <Paperclip size={13} aria-hidden="true" />
      <span className="tabular-nums">{count}</span>
    </button>
  );
}

/** "إجمالي الكمية (حديد): 92.300" under a list (`ListPage` summary). */
export function TotalQuantity({ value, materialName }: { value: number | undefined; materialName?: string }) {
  if (value === undefined) return null;
  return (
    <p className="text-sm text-muted-foreground">
      {totalQuantityLabel(materialName)}:{" "}
      <span className="font-semibold text-foreground">
        <QuantityText value={value} />
      </span>
    </p>
  );
}

export function totalQuantityLabel(materialName?: string) {
  return `إجمالي الكمية${materialName ? ` (${materialName})` : ""}`;
}

/** Money "220,000,000.00" (Latin digits, ltr), or "—" when empty. */
export function AmountText({ value }: { value: number | null | undefined }) {
  if (value === null || value === undefined) return "—";
  return (
    <span dir="ltr" className="tabular-nums">
      {formatAmount(value)}
    </span>
  );
}

/** A date-only value "yyyy/MM/dd" (no timezone shift, ltr), or "—". */
export function DateOnlyText({ value }: { value: string | null | undefined }) {
  return (
    <span dir="ltr" className="tabular-nums">
      {formatDateOnly(value)}
    </span>
  );
}

/** A percentage "12.50%" (ltr), or "—" when empty. */
export function PercentText({ value }: { value: number | null | undefined }) {
  if (value === null || value === undefined) return "—";
  return (
    <span dir="ltr" className="tabular-nums">
      {formatAmount(value)}%
    </span>
  );
}
