"use client";

import { useCallback, useMemo, useState } from "react";
import {
  AttachmentCountButton,
  LtrText,
  NotesCell,
  QuantityText,
  TotalQuantity,
  totalQuantityLabel,
} from "@/components/list/cells";
import { auditColumns } from "@/components/list/columns";
import ColumnValueFilter, { type ColumnFilterOption } from "@/components/list/ColumnValueFilter";
import { useCanWrite } from "@/components/list/formHelpers";
import ListPage, { ListSuspense } from "@/components/list/ListPage";
import type { ListColumn } from "@/components/list/ListTable";
import { useListState, type ListStateOptions } from "@/components/list/useListState";
import { activeFilters, type PrintColumn } from "@/components/print/PrintView";
import { usePrintExport } from "@/components/print/usePrintExport";
import { formatQuantity } from "@/lib/numbers";
import {
  companyMaterialApi,
  useListCompanyMaterialsQuery,
  useRemoveCompanyMaterialMutation,
} from "@/rtk/endpoints/companyMaterialApi";
import { useAppDispatch } from "@/rtk/hooks";
import type { CompanyMaterialItem, CompanyMaterialSortBy } from "@/types/companyMaterial";
import CompanyMaterialAttachmentsDialog from "./CompanyMaterialAttachmentsDialog";
import CompanyMaterialFormDialog from "./CompanyMaterialFormDialog";
import { companyMaterialLabel } from "./labels";
import { useOptionLists } from "./useOptionLists";

const SORT_COLUMNS: readonly CompanyMaterialSortBy[] = [
  "loadingPermitNumber",
  "projectName",
  "materialName",
  "companyName",
  "quantity",
  "createdAt",
  "updatedAt",
];

/** The business columns for طباعة / PDF (no attachments / audit / actions). */
const PRINT_COLUMNS: PrintColumn<CompanyMaterialItem>[] = [
  {
    header: "رقم اذن التحميل",
    cell: (row) => <LtrText value={row.loadingPermitNumber} />,
  },
  { header: "اسم المشروع", cell: (row) => row.projectName },
  { header: "الخامة", cell: (row) => row.materialName },
  { header: "الشركة المنفذة", cell: (row) => row.companyName },
  {
    header: "الكمية",
    cell: (row) => <span dir="ltr">{formatQuantity(row.quantity)}</span>,
  },
  { header: "المهندس المستلم", cell: (row) => row.receivingEngineer || "—" },
  { header: "ملاحظات", cell: (row) => row.notes || "—", multiline: true },
];

type DialogState = { mode: "create" } | { mode: "edit"; item: CompanyMaterialItem } | null;
type LocalFilterKey =
  | "projectId"
  | "materialId"
  | "companyId"
  | "loadingPermitNumber"
  | "receivingEngineer"
  | "attachmentCount";
type LocalFilters = Partial<Record<LocalFilterKey, string[]>>;

function getLocalFilterValue(item: CompanyMaterialItem, key: LocalFilterKey) {
  switch (key) {
    case "projectId":
      return item.projectId;
    case "materialId":
      return item.materialId;
    case "companyId":
      return item.companyId;
    case "loadingPermitNumber":
      return item.loadingPermitNumber || "—";
    case "receivingEngineer":
      return item.receivingEngineer || "—";
    case "attachmentCount":
      return item.attachmentCount > 0 ? String(item.attachmentCount) : "—";
  }
}

function getOptionLabels(selected: string[] | undefined, options: ColumnFilterOption[]) {
  const labels = (selected ?? []).map(
    (value) => options.find((option) => option.value === value)?.label ?? value
  );
  return labels.length > 0 ? labels.join("، ") : undefined;
}

function getLocalFilterOptions(items: CompanyMaterialItem[], key: LocalFilterKey): ColumnFilterOption[] {
  return Array.from(new Set(items.map((item) => getLocalFilterValue(item, key))))
    .sort((a, b) => a.localeCompare(b, "ar"))
    .map((value) => ({ value, label: value }));
}

function CompanyMaterialsPageContent() {
  const canWrite = useCanWrite();
  const dispatch = useAppDispatch();
  const { projects, materials, companies } = useOptionLists();

  const listOptions = useMemo<ListStateOptions<CompanyMaterialSortBy>>(
    () => ({
      pageSize: 20,
      sortColumns: SORT_COLUMNS,
      defaultSortBy: "createdAt",
      defaultSortDir: "desc",
      ascendingFirst: ["loadingPermitNumber", "projectName", "materialName", "companyName"],
    }),
    []
  );
  const list = useListState(listOptions);
  const query = useListCompanyMaterialsQuery(list.params);
  const [removeRecord] = useRemoveCompanyMaterialMutation();
  const [dialog, setDialog] = useState<DialogState>(null);
  const [viewing, setViewing] = useState<CompanyMaterialItem | null>(null);
  const pageItems = query.currentData?.items ?? [];
  const filterPageKey = `${list.page}:${list.search}:${list.sortBy}:${list.sortDir}`;
  const [pageFilterState, setPageFilterState] = useState<{ key: string; filters: LocalFilters }>({
    key: filterPageKey,
    filters: {},
  });
  const localFilters: LocalFilters =
    pageFilterState.key === filterPageKey ? pageFilterState.filters : {};
  const updateLocalFilter = useCallback(
    (key: LocalFilterKey, values: string[]) => {
      setPageFilterState((current) => ({
        key: filterPageKey,
        filters: {
          ...(current.key === filterPageKey ? current.filters : {}),
          [key]: values,
        },
      }));
    },
    [filterPageKey]
  );
  const filteredItems = useMemo(
    () =>
      pageItems.filter((item) =>
        (Object.keys(localFilters) as LocalFilterKey[]).every((key) => {
          const selected = localFilters[key];
          return !selected?.length || selected.includes(getLocalFilterValue(item, key));
        })
      ),
    [localFilters, pageItems]
  );
  const hasLocalFilters = Object.values(localFilters).some((values) => values?.length);
  const filteredQuery = useMemo(
    () => ({
      ...query,
      currentData: query.currentData ? { ...query.currentData, items: filteredItems } : undefined,
    }),
    [filteredItems, query]
  );

  const columns = useMemo<ListColumn<CompanyMaterialItem, CompanyMaterialSortBy>[]>(
    () => {
      const filterControl = (
        label: string,
        options: ColumnFilterOption[],
        selectedValues: string[],
        onChange: (values: string[]) => void,
        props?: { loading?: boolean; loadError?: boolean }
      ) => (
        <ColumnValueFilter
          label={label}
          options={options}
          selectedValues={selectedValues}
          onChange={onChange}
          {...props}
        />
      );

      return [
        {
          key: "loadingPermitNumber",
          header: "رقم اذن التحميل",
          headerControl: filterControl(
            "رقم اذن التحميل",
            getLocalFilterOptions(pageItems, "loadingPermitNumber"),
            localFilters.loadingPermitNumber ?? [],
            (values) => updateLocalFilter("loadingPermitNumber", values)
          ),
          sortKey: "loadingPermitNumber",
          className: "whitespace-nowrap text-foreground",
          cell: (item) => <LtrText value={item.loadingPermitNumber} />,
        },
        {
          key: "projectName",
          header: "اسم المشروع",
          headerControl: filterControl(
            "اسم المشروع",
            projects.options,
            localFilters.projectId ?? [],
            (values) => updateLocalFilter("projectId", values),
            { loading: projects.loading, loadError: projects.loadError }
          ),
          sortKey: "projectName",
          className: "font-semibold text-foreground",
          cell: (item) => item.projectName,
        },
        {
          key: "materialName",
          header: "الخامة",
          headerControl: filterControl(
            "الخامة",
            materials.options,
            localFilters.materialId ?? [],
            (values) => updateLocalFilter("materialId", values),
            { loading: materials.loading, loadError: materials.loadError }
          ),
          sortKey: "materialName",
          className: "whitespace-nowrap text-foreground",
          cell: (item) => item.materialName,
        },
        {
          key: "companyName",
          header: "الشركة المنفذة",
          headerControl: filterControl(
            "الشركة المنفذة",
            companies.options,
            localFilters.companyId ?? [],
            (values) => updateLocalFilter("companyId", values),
            { loading: companies.loading, loadError: companies.loadError }
          ),
          sortKey: "companyName",
          className: "text-foreground",
          cell: (item) => item.companyName,
        },
        {
          key: "quantity",
          header: "الكمية",
          sortKey: "quantity",
          className: "whitespace-nowrap text-foreground",
          cell: (item) => <QuantityText value={item.quantity} />,
        },
        {
          key: "receivingEngineer",
          header: "المهندس المستلم",
          headerControl: filterControl(
            "المهندس المستلم",
            getLocalFilterOptions(pageItems, "receivingEngineer"),
            localFilters.receivingEngineer ?? [],
            (values) => updateLocalFilter("receivingEngineer", values)
          ),
          className: "text-muted-foreground",
          cell: (item) => item.receivingEngineer || "—",
        },
        {
          key: "notes",
          header: "ملاحظات",
          className: "text-muted-foreground",
          cell: (item) => <NotesCell value={item.notes} />,
        },
        {
          key: "attachments",
          header: "البوليصة",
          headerControl: filterControl(
            "البوليصة",
            getLocalFilterOptions(pageItems, "attachmentCount"),
            localFilters.attachmentCount ?? [],
            (values) => updateLocalFilter("attachmentCount", values)
          ),
          className: "py-1.5 whitespace-nowrap text-muted-foreground",
          cell: (item) => (
            <AttachmentCountButton
              count={item.attachmentCount}
              label={`عرض البوليصة: ${companyMaterialLabel(item)}`}
              title="عرض البوليصة"
              onClick={() => setViewing(item)}
            />
          ),
        },
        ...auditColumns<CompanyMaterialItem, CompanyMaterialSortBy>({
          createdAt: "createdAt",
          updatedAt: "updatedAt",
        }),
      ];
    },
    [
      companies,
      localFilters,
      materials,
      pageItems,
      projects,
      updateLocalFilter,
    ]
  );

  const materialName = getOptionLabels(localFilters.materialId, materials.options);

  // ---- طباعة / PDF: all rows for the current filters and sort → print view ----
  const printer = usePrintExport<CompanyMaterialItem>();
  const print = () =>
    printer.print(
      // One-off, unsubscribed fetch: the rows are not kept in the store.
      () =>
        dispatch(
          companyMaterialApi.endpoints.exportCompanyMaterials.initiate(
            {
              search: list.params.search,
              sortBy: list.sortBy,
              sortDir: list.sortDir,
            },
            { subscribe: false, forceRefetch: true }
          )
        ),
      (rows, printedAt) => {
        const printRows = hasLocalFilters ? filteredItems : rows;
        return {
          title: "خامات الشركات",
          filters: activeFilters([
            ["المشروع", getOptionLabels(localFilters.projectId, projects.options)],
            ["الخامة", materialName],
            ["الشركة المنفذة", getOptionLabels(localFilters.companyId, companies.options)],
            ["البحث", list.search ? `"${list.search}"` : undefined],
          ]),
          columns: PRINT_COLUMNS,
          rows: printRows,
          total: {
            label: totalQuantityLabel(materialName),
            value: formatQuantity(printRows.reduce((sum, row) => sum + row.quantity, 0)),
          },
          printedAt,
        };
      }
    );

  return (
    <ListPage
      title="خامات الشركات"
      list={list}
      query={filteredQuery}
      columns={columns}
      itemLabel={companyMaterialLabel}
      minWidthClassName="min-w-[1700px]"
      canWrite={canWrite}
      showSearch={false}
      onAdd={() => setDialog({ mode: "create" })}
      onEdit={(item) => setDialog({ mode: "edit", item })}
      onDelete={(item) => removeRecord(item.id)}
      headerActions={printer.button(print)}
      hasLocalFilters={hasLocalFilters}
      summary={
        <>
          {hasLocalFilters && (
            <span className="text-sm text-muted-foreground">
              المعروض في الصفحة: {filteredItems.length} من {pageItems.length}
            </span>
          )}
          <TotalQuantity
            value={
              hasLocalFilters
                ? filteredItems.reduce((sum, item) => sum + item.quantity, 0)
                : query.currentData?.totalQuantity
            }
            materialName={materialName}
          />
        </>
      }
    >
      {dialog && (
        <CompanyMaterialFormDialog
          key={dialog.mode === "edit" ? dialog.item.id : "create"}
          item={dialog.mode === "edit" ? dialog.item : undefined}
          prefill={
            dialog.mode === "create"
              ? {
                  projectId: localFilters.projectId?.length === 1 ? localFilters.projectId[0] : undefined,
                  materialId: localFilters.materialId?.length === 1 ? localFilters.materialId[0] : undefined,
                  companyId: localFilters.companyId?.length === 1 ? localFilters.companyId[0] : undefined,
                }
              : undefined
          }
          onClose={() => setDialog(null)}
          onCreated={() => {
            setPageFilterState({
              key: filterPageKey,
              filters: {
                projectId: localFilters.projectId?.length === 1 ? localFilters.projectId : [],
                materialId: localFilters.materialId?.length === 1 ? localFilters.materialId : [],
                companyId: localFilters.companyId?.length === 1 ? localFilters.companyId : [],
              },
            });
            list.showNewest();
          }}
        />
      )}
      {viewing && (
        <CompanyMaterialAttachmentsDialog item={viewing} canWrite={canWrite} onClose={() => setViewing(null)} />
      )}
      {printer.view}
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
