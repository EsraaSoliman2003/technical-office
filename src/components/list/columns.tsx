import { formatDateTime } from "@/lib/formatDate";
import type { AuditFields } from "@/types/paged";
import type { ListColumn } from "./ListTable";

const mutedCell = "whitespace-nowrap text-muted-foreground";

function DateValue({ value }: { value: string | null }) {
  return (
    <span dir="ltr" className="tabular-nums">
      {formatDateTime(value)}
    </span>
  );
}

/**
 * The four audit columns every list ends with:
 * مدخل البيانات · توقيت الإضافة (sortable) · آخر تعديل · توقيت التعديل (sortable).
 */
export function auditColumns<T extends AuditFields, TSortBy extends string>(sortKeys: {
  createdAt: TSortBy;
  updatedAt: TSortBy;
}): ListColumn<T, TSortBy>[] {
  return [
    { key: "createdByName", header: "مدخل البيانات", className: mutedCell, cell: (item) => item.createdByName || "—" },
    {
      key: "createdAt",
      header: "توقيت الإضافة",
      sortKey: sortKeys.createdAt,
      className: mutedCell,
      cell: (item) => <DateValue value={item.createdAt} />,
    },
    { key: "updatedByName", header: "آخر تعديل", className: mutedCell, cell: (item) => item.updatedByName || "—" },
    {
      key: "updatedAt",
      header: "توقيت التعديل",
      sortKey: sortKeys.updatedAt,
      className: mutedCell,
      cell: (item) => <DateValue value={item.updatedAt} />,
    },
  ];
}
