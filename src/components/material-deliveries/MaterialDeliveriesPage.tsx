"use client";

import { useCallback, useMemo, useState } from "react";
import {
  AttachmentCountButton,
  DateOnlyText,
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
import TextColumnFilter from "@/components/list/TextColumnFilter";
import { useListState, type ListStateOptions } from "@/components/list/useListState";
import { activeFilters, type PrintColumn } from "@/components/print/PrintView";
import { usePrintExport } from "@/components/print/usePrintExport";
import { formatDateOnly, formatQuantity } from "@/lib/numbers";
import {
  materialDeliveryApi,
  useListMaterialDeliveriesQuery,
  useRemoveMaterialDeliveryMutation,
} from "@/rtk/endpoints/materialDeliveryApi";
import { useAppDispatch } from "@/rtk/hooks";
import type { MaterialDeliveryItem, MaterialDeliverySortBy } from "@/types/materialDelivery";
import { materialDeliveryLabel } from "./labels";
import MaterialDeliveryAttachmentsDialog from "./MaterialDeliveryAttachmentsDialog";
import MaterialDeliveryFormDialog from "./MaterialDeliveryFormDialog";
import { useDeliveryOptionLists } from "./useDeliveryOptionLists";

const SORT_COLUMNS: readonly MaterialDeliverySortBy[] = [
  "authorizationNumber",
  "billOfLadingNumber",
  "billDate",
  "projectName",
  "materialName",
  "quantity",
  "createdAt",
  "updatedAt",
];

/** The business columns for طباعة / PDF (no attachments / audit / actions). */
const PRINT_COLUMNS: PrintColumn<MaterialDeliveryItem>[] = [
  { header: "رقم التفويض", cell: (row) => <LtrText value={row.authorizationNumber} /> },
  { header: "رقم البوليصة", cell: (row) => <LtrText value={row.billOfLadingNumber} /> },
  { header: "تاريخ البوليصة", cell: (row) => <DateOnlyText value={row.billDate} /> },
  { header: "اسم المشروع", cell: (row) => row.projectName },
  { header: "الخامة", cell: (row) => row.materialName },
  { header: "الكمية", cell: (row) => <span dir="ltr">{formatQuantity(row.quantity)}</span> },
  { header: "رقم السيارة", cell: (row) => <LtrText value={row.vehicleNumber} /> },
  { header: "المصنع", cell: (row) => row.factoryName || "—" },
  { header: "ملاحظات", cell: (row) => row.notes || "—", multiline: true },
];

type DialogState = { mode: "create" } | { mode: "edit"; item: MaterialDeliveryItem } | null;
type LocalFilterKey =
  | "authorizationNumber"
  | "billOfLadingNumber"
  | "projectId"
  | "materialId"
  | "billDate"
  | "vehicleNumber"
  | "factoryName"
  | "attachmentCount";
type LocalFilters = Partial<Record<LocalFilterKey, string[]>>;

function getLocalFilterValue(item: MaterialDeliveryItem, key: LocalFilterKey) {
  switch (key) {
    case "authorizationNumber":
      return item.authorizationNumber || "—";
    case "billOfLadingNumber":
      return item.billOfLadingNumber || "—";
    case "projectId":
      return item.projectId;
    case "materialId":
      return item.materialId;
    case "billDate":
      return formatDateOnly(item.billDate);
    case "vehicleNumber":
      return item.vehicleNumber || "—";
    case "factoryName":
      return item.factoryName || "—";
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

function getLocalFilterOptions(items: MaterialDeliveryItem[], key: LocalFilterKey): ColumnFilterOption[] {
  return Array.from(new Set(items.map((item) => getLocalFilterValue(item, key))))
    .sort((a, b) => a.localeCompare(b, "ar"))
    .map((value) => ({ value, label: value }));
}

function matchesLocalFilters(item: MaterialDeliveryItem, filters: LocalFilters) {
  return (Object.keys(filters) as LocalFilterKey[]).every((key) => {
    const selected = filters[key];
    return !selected?.length || selected.includes(getLocalFilterValue(item, key));
  });
}

function MaterialDeliveriesPageContent() {
  const canWrite = useCanWrite();
  const dispatch = useAppDispatch();
  const { projects, materials } = useDeliveryOptionLists(undefined, { full: false });

  const listOptions = useMemo<ListStateOptions<MaterialDeliverySortBy>>(
    () => ({
      pageSize: 20,
      sortColumns: SORT_COLUMNS,
      defaultSortBy: "createdAt",
      defaultSortDir: "desc",
      ascendingFirst: ["authorizationNumber", "billOfLadingNumber", "projectName", "materialName"],
    }),
    []
  );
  const list = useListState(listOptions);
  const query = useListMaterialDeliveriesQuery(list.params);
  const [removeRecord] = useRemoveMaterialDeliveryMutation();
  const [dialog, setDialog] = useState<DialogState>(null);
  const [viewing, setViewing] = useState<MaterialDeliveryItem | null>(null);
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
    () => pageItems.filter((item) => matchesLocalFilters(item, localFilters)),
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

  const columns = useMemo<ListColumn<MaterialDeliveryItem, MaterialDeliverySortBy>[]>(
    () => [
      {
        key: "authorizationNumber",
        header: "رقم التفويض",
        headerControl: (
          <TextColumnFilter
            label="رقم التفويض"
            options={getLocalFilterOptions(pageItems, "authorizationNumber")}
            selectedValues={localFilters.authorizationNumber ?? []}
            onChange={(values) => updateLocalFilter("authorizationNumber", values)}
          />
        ),
        sortKey: "authorizationNumber",
        className: "whitespace-nowrap text-foreground",
        cell: (item) => <LtrText value={item.authorizationNumber} />,
      },
      {
        key: "billOfLadingNumber",
        header: "رقم البوليصة",
        headerControl: (
          <TextColumnFilter
            label="رقم البوليصة"
            options={getLocalFilterOptions(pageItems, "billOfLadingNumber")}
            selectedValues={localFilters.billOfLadingNumber ?? []}
            onChange={(values) => updateLocalFilter("billOfLadingNumber", values)}
          />
        ),
        sortKey: "billOfLadingNumber",
        className: "whitespace-nowrap text-foreground",
        cell: (item) => <LtrText value={item.billOfLadingNumber} />,
      },
      {
        key: "billDate",
        header: "تاريخ البوليصة",
        headerControl: (
          <ColumnValueFilter
            label="تاريخ البوليصة"
            options={getLocalFilterOptions(pageItems, "billDate")}
            selectedValues={localFilters.billDate ?? []}
            onChange={(values) => updateLocalFilter("billDate", values)}
          />
        ),
        sortKey: "billDate",
        className: "whitespace-nowrap text-muted-foreground",
        cell: (item) => <DateOnlyText value={item.billDate} />,
      },
      {
        key: "projectName",
        header: "اسم المشروع",
        headerControl: (
          <ColumnValueFilter
            label="اسم المشروع"
            options={projects.options}
            selectedValues={localFilters.projectId ?? []}
            onChange={(values) => updateLocalFilter("projectId", values)}
            loading={projects.loading}
            loadError={projects.loadError}
          />
        ),
        sortKey: "projectName",
        className: "font-semibold text-foreground",
        cell: (item) => item.projectName,
      },
      {
        key: "materialName",
        header: "الخامة",
        headerControl: (
          <ColumnValueFilter
            label="الخامة"
            options={materials.options}
            selectedValues={localFilters.materialId ?? []}
            onChange={(values) => updateLocalFilter("materialId", values)}
            loading={materials.loading}
            loadError={materials.loadError}
          />
        ),
        sortKey: "materialName",
        className: "whitespace-nowrap text-foreground",
        cell: (item) => item.materialName,
      },
      {
        key: "quantity",
        header: "الكمية",
        sortKey: "quantity",
        className: "whitespace-nowrap text-foreground",
        cell: (item) => <QuantityText value={item.quantity} />,
      },
      {
        key: "vehicleNumber",
        header: "رقم السيارة",
        headerControl: (
          <ColumnValueFilter
            label="رقم السيارة"
            options={getLocalFilterOptions(pageItems, "vehicleNumber")}
            selectedValues={localFilters.vehicleNumber ?? []}
            onChange={(values) => updateLocalFilter("vehicleNumber", values)}
          />
        ),
        className: "whitespace-nowrap text-muted-foreground",
        cell: (item) => <LtrText value={item.vehicleNumber} />,
      },
      {
        key: "factoryName",
        header: "المصنع",
        headerControl: (
          <ColumnValueFilter
            label="المصنع"
            options={getLocalFilterOptions(pageItems, "factoryName")}
            selectedValues={localFilters.factoryName ?? []}
            onChange={(values) => updateLocalFilter("factoryName", values)}
          />
        ),
        className: "text-muted-foreground",
        cell: (item) => item.factoryName || "—",
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
        headerControl: (
          <ColumnValueFilter
            label="البوليصة"
            options={getLocalFilterOptions(pageItems, "attachmentCount")}
            selectedValues={localFilters.attachmentCount ?? []}
            onChange={(values) => updateLocalFilter("attachmentCount", values)}
          />
        ),
        className: "py-1.5 whitespace-nowrap text-muted-foreground",
        cell: (item) => (
          <AttachmentCountButton
            count={item.attachmentCount}
            label={`عرض البوليصة: ${materialDeliveryLabel(item)}`}
            title="عرض البوليصة"
            onClick={() => setViewing(item)}
          />
        ),
      },
      ...auditColumns<MaterialDeliveryItem, MaterialDeliverySortBy>({ createdAt: "createdAt", updatedAt: "updatedAt" }),
    ],
    [
      localFilters,
      materials,
      pageItems,
      projects,
      setViewing,
      updateLocalFilter,
    ]
  );

  const materialName = getOptionLabels(localFilters.materialId, materials.options);

  // ---- طباعة / PDF: all rows for the current filters and sort → print view ----
  const printer = usePrintExport<MaterialDeliveryItem>();
  const print = () =>
    printer.print(
      // One-off, unsubscribed fetch: the rows are not kept in the store.
      () =>
        dispatch(
          materialDeliveryApi.endpoints.exportMaterialDeliveries.initiate(
            { search: list.params.search, sortBy: list.sortBy, sortDir: list.sortDir },
            { subscribe: false, forceRefetch: true }
          )
        ),
      (rows, printedAt) => {
        const filteredRows = hasLocalFilters ? filteredItems : rows;
        return {
          title: "خامات المشاريع",
          filters: activeFilters([
            ["رقم التفويض", localFilters.authorizationNumber?.join("، ")],
            ["المشروع", getOptionLabels(localFilters.projectId, projects.options)],
            ["الخامة", materialName],
            ["رقم البوليصة", localFilters.billOfLadingNumber?.join("، ")],
            ["تاريخ البوليصة", localFilters.billDate?.join("، ")],
            ["رقم السيارة", localFilters.vehicleNumber?.join("، ")],
            ["المصنع", localFilters.factoryName?.join("، ")],
            ["البوليصة", localFilters.attachmentCount?.join("، ")],
            ["البحث", list.search ? `"${list.search}"` : undefined],
          ]),
          columns: PRINT_COLUMNS,
          rows: filteredRows,
          total: {
            label: totalQuantityLabel(materialName),
            value: formatQuantity(filteredRows.reduce((sum, row) => sum + row.quantity, 0)),
          },
          printedAt,
        };
      }
    );

  return (
    <ListPage
      title="خامات المشاريع"
      list={list}
      query={filteredQuery}
      columns={columns}
      itemLabel={materialDeliveryLabel}
      minWidthClassName="min-w-[1800px]"
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
        <MaterialDeliveryFormDialog
          key={dialog.mode === "edit" ? dialog.item.id : "create"}
          item={dialog.mode === "edit" ? dialog.item : undefined}
          prefill={
            dialog.mode === "create"
              ? {
                  projectId: localFilters.projectId?.length === 1 ? localFilters.projectId[0] : undefined,
                  materialId: localFilters.materialId?.length === 1 ? localFilters.materialId[0] : undefined,
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
              },
            });
            list.showNewest();
          }}
        />
      )}
      {viewing && (
        <MaterialDeliveryAttachmentsDialog item={viewing} canWrite={canWrite} onClose={() => setViewing(null)} />
      )}
      {printer.view}
    </ListPage>
  );
}

/** خامات المشاريع (/data/project-materials): deliveries with filters, total quantity, print, add/edit. */
export default function MaterialDeliveriesPage() {
  return (
    <ListSuspense>
      <MaterialDeliveriesPageContent />
    </ListSuspense>
  );
}
