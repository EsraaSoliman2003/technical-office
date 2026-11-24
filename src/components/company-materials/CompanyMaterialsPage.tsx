"use client";

import { useMemo, useState } from "react";
import { Paperclip, Printer } from "lucide-react";
import { toast } from "sonner";
import { auditColumns } from "@/components/list/columns";
import { useCanWrite } from "@/components/list/formHelpers";
import ListPage, { ListSuspense } from "@/components/list/ListPage";
import type { ListColumn } from "@/components/list/ListTable";
import { useListState, type ListStateOptions } from "@/components/list/useListState";
import { Button, Combobox } from "@/components/ui";
import { formatQuantity } from "@/lib/numbers";
import {
  useLazyExportCompanyMaterialsQuery,
  useListCompanyMaterialsQuery,
  useRemoveCompanyMaterialMutation,
} from "@/rtk/endpoints/companyMaterialApi";
import type { CompanyMaterialFilters, CompanyMaterialItem, CompanyMaterialSortBy } from "@/types/companyMaterial";
import { getFailureMessage, isApiFailure, NO_PERMISSION_MESSAGE } from "@/utils/apiFailure";
import CompanyMaterialAttachmentsDialog from "./CompanyMaterialAttachmentsDialog";
import CompanyMaterialFormDialog from "./CompanyMaterialFormDialog";
import CompanyMaterialsPrintView, { type PrintData } from "./CompanyMaterialsPrintView";
import { companyMaterialLabel } from "./labels";
import { useOptionLists, type OptionList } from "./useOptionLists";

const SORT_COLUMNS: readonly CompanyMaterialSortBy[] = [
  "loadingPermitNumber",
  "projectName",
  "materialName",
  "companyName",
  "quantity",
  "createdAt",
  "updatedAt",
];

type DialogState = { mode: "create" } | { mode: "edit"; item: CompanyMaterialItem } | null;

/** A clearable dropdown filter in the toolbar (empty = all). */
function OptionFilter({
  label,
  allLabel,
  list,
  value,
  onChange,
}: {
  label: string;
  allLabel: string;
  list: OptionList;
  value: string | undefined;
  onChange: (value: string | null) => void;
}) {
  return (
    <Combobox
      aria-label={label}
      placeholder={allLabel}
      clearable
      options={list.options}
      value={value ?? ""}
      onChange={(next) => onChange(next || null)}
      loading={list.loading}
      error={list.loadError ? `تعذر تحميل قائمة ${label}` : undefined}
      className="w-full sm:w-56"
    />
  );
}

const quantityText = (value: number) => (
  <span dir="ltr" className="tabular-nums">
    {formatQuantity(value)}
  </span>
);

function CompanyMaterialsPageContent() {
  const canWrite = useCanWrite();
  const lists = useOptionLists();
  const { projects, materials, companies } = lists;

  // Unknown ids in the URL are dropped once the option lists are loaded.
  const listOptions = useMemo<ListStateOptions<CompanyMaterialSortBy>>(
    () => ({
      pageSize: 20,
      sortColumns: SORT_COLUMNS,
      defaultSortBy: "createdAt",
      defaultSortDir: "desc",
      ascendingFirst: ["loadingPermitNumber", "projectName", "materialName", "companyName"],
      filterValues: { projectId: projects.ids, materialId: materials.ids, companyId: companies.ids },
    }),
    [projects.ids, materials.ids, companies.ids]
  );
  const list = useListState(listOptions);
  const filters: CompanyMaterialFilters = {
    projectId: list.filters.projectId,
    materialId: list.filters.materialId,
    companyId: list.filters.companyId,
  };
  const query = useListCompanyMaterialsQuery({ ...list.params, ...filters });
  const [removeRecord] = useRemoveCompanyMaterialMutation();
  const [dialog, setDialog] = useState<DialogState>(null);
  const [viewing, setViewing] = useState<CompanyMaterialItem | null>(null);

  const columns = useMemo<ListColumn<CompanyMaterialItem, CompanyMaterialSortBy>[]>(
    () => [
      {
        key: "loadingPermitNumber",
        header: "رقم اذن التحميل",
        sortKey: "loadingPermitNumber",
        className: "whitespace-nowrap text-foreground",
        cell: (item) => (item.loadingPermitNumber ? <span dir="ltr">{item.loadingPermitNumber}</span> : "—"),
      },
      {
        key: "projectName",
        header: "اسم المشروع",
        sortKey: "projectName",
        className: "font-semibold text-foreground",
        cell: (item) => item.projectName,
      },
      {
        key: "materialName",
        header: "الخامة",
        sortKey: "materialName",
        className: "whitespace-nowrap text-foreground",
        cell: (item) => item.materialName,
      },
      {
        key: "companyName",
        header: "الشركة المنفذة",
        sortKey: "companyName",
        className: "text-foreground",
        cell: (item) => item.companyName,
      },
      {
        key: "quantity",
        header: "الكمية",
        sortKey: "quantity",
        className: "whitespace-nowrap text-foreground",
        cell: (item) => quantityText(item.quantity),
      },
      {
        key: "receivingEngineer",
        header: "المهندس المستلم",
        className: "text-muted-foreground",
        cell: (item) => item.receivingEngineer || "—",
      },
      {
        key: "notes",
        header: "ملاحظات",
        className: "text-muted-foreground",
        // Two lines; the full text is in the tooltip (and read in full by screen readers).
        cell: (item) =>
          item.notes ? (
            <p title={item.notes} className="line-clamp-2 max-w-64 whitespace-pre-line">
              {item.notes}
            </p>
          ) : (
            "—"
          ),
      },
      {
        key: "attachments",
        header: "البوليصة",
        className: "py-2 whitespace-nowrap text-muted-foreground",
        cell: (item) =>
          item.attachmentCount > 0 ? (
            <button
              type="button"
              onClick={() => setViewing(item)}
              aria-label={`عرض البوليصة: ${companyMaterialLabel(item)} (${item.attachmentCount})`}
              title="عرض البوليصة"
              className="inline-flex items-center gap-1 rounded-lg border border-border px-2 py-1 text-xs font-semibold text-foreground hover:border-primary/40 hover:bg-primary-soft hover:text-primary-text"
            >
              <Paperclip size={13} aria-hidden="true" />
              <span className="tabular-nums">{item.attachmentCount}</span>
            </button>
          ) : (
            "—"
          ),
      },
      ...auditColumns<CompanyMaterialItem, CompanyMaterialSortBy>({ createdAt: "createdAt", updatedAt: "updatedAt" }),
    ],
    [setViewing]
  );

  const totalQuantity = query.currentData?.totalQuantity;
  const materialName = materials.nameOf(filters.materialId);

  // ---- طباعة / PDF: all rows for the current filters and sort → print view ----
  const [exportRows] = useLazyExportCompanyMaterialsQuery();
  const [exporting, setExporting] = useState(false);
  const [printData, setPrintData] = useState<PrintData | null>(null);

  const print = async () => {
    if (exporting) return;
    setExporting(true);
    let result;
    try {
      result = await exportRows(
        { search: list.params.search, sortBy: list.sortBy, sortDir: list.sortDir, ...filters },
        false // always fresh
      );
    } finally {
      setExporting(false);
    }
    if (result.error || !result.data) {
      const failure = isApiFailure(result.error) ? result.error : undefined;
      toast.error(
        failure?.status === 400
          ? "عدد السجلات كبير جدًا للطباعة (الحد الأقصى 5000 سجل). ضيّق نطاق البحث أو الفلاتر ثم حاول مرة أخرى."
          : failure?.status === 403
            ? NO_PERMISSION_MESSAGE
            : getFailureMessage(failure)
      );
      return;
    }
    if (result.data.length === 0) {
      toast.error("لا توجد بيانات للطباعة");
      return;
    }
    const active = [
      { label: "المشروع", value: projects.nameOf(filters.projectId) },
      { label: "الخامة", value: materialName },
      { label: "الشركة المنفذة", value: companies.nameOf(filters.companyId) },
      { label: "البحث", value: list.search ? `"${list.search}"` : undefined },
    ].filter((filter): filter is { label: string; value: string } => Boolean(filter.value));
    setPrintData({ rows: result.data, filters: active, materialName, printedAt: new Date().toISOString() });
  };

  return (
    <ListPage
      title="خامات الشركات"
      list={list}
      query={query}
      columns={columns}
      itemLabel={companyMaterialLabel}
      minWidthClassName="min-w-[1700px]"
      canWrite={canWrite}
      onAdd={() => setDialog({ mode: "create" })}
      onEdit={(item) => setDialog({ mode: "edit", item })}
      onDelete={(item) => removeRecord(item.id)}
      searchPlaceholder="بحث شامل"
      headerActions={
        <Button variant="secondary" onClick={print} loading={exporting}>
          {!exporting && <Printer size={18} aria-hidden="true" />}
          طباعة / PDF
        </Button>
      }
      toolbar={
        <>
          <OptionFilter
            label="اسم المشروع"
            allLabel="كل المشاريع"
            list={projects}
            value={filters.projectId}
            onChange={(value) => list.setFilter("projectId", value)}
          />
          <OptionFilter
            label="الخامة"
            allLabel="كل الخامات"
            list={materials}
            value={filters.materialId}
            onChange={(value) => list.setFilter("materialId", value)}
          />
          <OptionFilter
            label="الشركة المنفذة"
            allLabel="كل الشركات"
            list={companies}
            value={filters.companyId}
            onChange={(value) => list.setFilter("companyId", value)}
          />
        </>
      }
      summary={
        totalQuantity !== undefined && (
          <p className="text-sm text-muted-foreground">
            إجمالي الكمية{materialName ? ` (${materialName})` : ""}:{" "}
            <span className="font-semibold text-foreground">{quantityText(totalQuantity)}</span>
          </p>
        )
      }
    >
      {dialog && (
        <CompanyMaterialFormDialog
          key={dialog.mode === "edit" ? dialog.item.id : "create"}
          item={dialog.mode === "edit" ? dialog.item : undefined}
          prefill={dialog.mode === "create" ? filters : undefined}
          onClose={() => setDialog(null)}
          onCreated={list.showNewest}
        />
      )}
      {viewing && (
        <CompanyMaterialAttachmentsDialog item={viewing} canWrite={canWrite} onClose={() => setViewing(null)} />
      )}
      {printData && (
        // Keyed: printing again (even if the last afterprint never came) remounts and prints.
        <CompanyMaterialsPrintView key={printData.printedAt} data={printData} onDone={() => setPrintData(null)} />
      )}
    </ListPage>
  );
}

/** خامات الشركات (/data/company-materials): filters, total quantity, add/edit with البوليصة. */
export default function CompanyMaterialsPage() {
  return (
    <ListSuspense>
      <CompanyMaterialsPageContent />
    </ListSuspense>
  );
}
