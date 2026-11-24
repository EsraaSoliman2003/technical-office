"use client";

import { useMemo, useState } from "react";
import { skipToken } from "@reduxjs/toolkit/query";
import {
  AttachmentCountButton,
  LtrText,
  NotesCell,
  QuantityText,
  TotalQuantity,
  totalQuantityLabel,
} from "@/components/list/cells";
import { auditColumns } from "@/components/list/columns";
import { useCanWrite } from "@/components/list/formHelpers";
import ListPage, { ListSuspense } from "@/components/list/ListPage";
import type { ListColumn } from "@/components/list/ListTable";
import { OptionFilter } from "@/components/list/OptionFilter";
import { TextFilter } from "@/components/list/TextFilter";
import { useListState, type ListStateOptions } from "@/components/list/useListState";
import { filterName, waitingForOptions } from "@/components/options/useOptionList";
import { activeFilters, type PrintColumn } from "@/components/print/PrintView";
import { usePrintExport } from "@/components/print/usePrintExport";
import { formatDateOnly, formatQuantity } from "@/lib/numbers";
import {
  materialDeliveryApi,
  useListMaterialDeliveriesQuery,
  useRemoveMaterialDeliveryMutation,
} from "@/rtk/endpoints/materialDeliveryApi";
import { useAppDispatch } from "@/rtk/hooks";
import type { MaterialDeliveryFilters, MaterialDeliveryItem, MaterialDeliverySortBy } from "@/types/materialDelivery";
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

/** A date-only value ("yyyy/MM/dd", no timezone shift), ltr. */
const DateOnly = ({ value }: { value: string | null }) => (
  <span dir="ltr" className="tabular-nums">
    {formatDateOnly(value)}
  </span>
);

/** The business columns for طباعة / PDF (no attachments / audit / actions). */
const PRINT_COLUMNS: PrintColumn<MaterialDeliveryItem>[] = [
  { header: "رقم التفويض", cell: (row) => <LtrText value={row.authorizationNumber} /> },
  { header: "رقم البوليصة", cell: (row) => <LtrText value={row.billOfLadingNumber} /> },
  { header: "تاريخ البوليصة", cell: (row) => <DateOnly value={row.billDate} /> },
  { header: "اسم المشروع", cell: (row) => row.projectName },
  { header: "الخامة", cell: (row) => row.materialName },
  { header: "الكمية", cell: (row) => <span dir="ltr">{formatQuantity(row.quantity)}</span> },
  { header: "رقم السيارة", cell: (row) => <LtrText value={row.vehicleNumber} /> },
  { header: "المصنع", cell: (row) => row.factoryName || "—" },
  { header: "ملاحظات", cell: (row) => row.notes || "—", multiline: true },
];

type DialogState = { mode: "create" } | { mode: "edit"; item: MaterialDeliveryItem } | null;

function MaterialDeliveriesPageContent() {
  const canWrite = useCanWrite();
  const dispatch = useAppDispatch();
  const { projects, materials } = useDeliveryOptionLists(undefined, { full: false });

  // Text filters take any value; dropdown ids not in their (loaded) options are dropped from the URL.
  const listOptions = useMemo<ListStateOptions<MaterialDeliverySortBy>>(
    () => ({
      pageSize: 20,
      sortColumns: SORT_COLUMNS,
      defaultSortBy: "createdAt",
      defaultSortDir: "desc",
      ascendingFirst: ["authorizationNumber", "billOfLadingNumber", "projectName", "materialName"],
      filterValues: {
        authorizationNumber: undefined,
        projectId: projects.ids,
        materialId: materials.ids,
        billOfLadingNumber: undefined,
      },
    }),
    [projects.ids, materials.ids]
  );
  const list = useListState(listOptions);
  const filters: MaterialDeliveryFilters = {
    authorizationNumber: list.filters.authorizationNumber,
    projectId: list.filters.projectId,
    materialId: list.filters.materialId,
    billOfLadingNumber: list.filters.billOfLadingNumber,
  };
  const waiting = waitingForOptions([
    [filters.projectId, projects],
    [filters.materialId, materials],
  ]);
  const listQuery = useListMaterialDeliveriesQuery(waiting ? skipToken : { ...list.params, ...filters });
  // Show the loading skeleton while waiting.
  const query = { ...listQuery, isFetching: listQuery.isFetching || waiting };
  const [removeRecord] = useRemoveMaterialDeliveryMutation();
  const [dialog, setDialog] = useState<DialogState>(null);
  const [viewing, setViewing] = useState<MaterialDeliveryItem | null>(null);

  const columns = useMemo<ListColumn<MaterialDeliveryItem, MaterialDeliverySortBy>[]>(
    () => [
      {
        key: "authorizationNumber",
        header: "رقم التفويض",
        sortKey: "authorizationNumber",
        className: "whitespace-nowrap text-foreground",
        cell: (item) => <LtrText value={item.authorizationNumber} />,
      },
      {
        key: "billOfLadingNumber",
        header: "رقم البوليصة",
        sortKey: "billOfLadingNumber",
        className: "whitespace-nowrap text-foreground",
        cell: (item) => <LtrText value={item.billOfLadingNumber} />,
      },
      {
        key: "billDate",
        header: "تاريخ البوليصة",
        sortKey: "billDate",
        className: "whitespace-nowrap text-muted-foreground",
        cell: (item) => <DateOnly value={item.billDate} />,
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
        key: "quantity",
        header: "الكمية",
        sortKey: "quantity",
        className: "whitespace-nowrap text-foreground",
        cell: (item) => <QuantityText value={item.quantity} />,
      },
      {
        key: "vehicleNumber",
        header: "رقم السيارة",
        className: "whitespace-nowrap text-muted-foreground",
        cell: (item) => <LtrText value={item.vehicleNumber} />,
      },
      {
        key: "factoryName",
        header: "المصنع",
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
        className: "py-2 whitespace-nowrap text-muted-foreground",
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
    [setViewing]
  );

  const materialName = filterName(filters.materialId, materials, query.currentData?.items, (row) => row.materialName);

  // ---- طباعة / PDF: all rows for the current filters and sort → print view ----
  const printer = usePrintExport<MaterialDeliveryItem>();
  const print = () =>
    printer.print(
      // One-off, unsubscribed fetch: the rows are not kept in the store.
      () =>
        dispatch(
          materialDeliveryApi.endpoints.exportMaterialDeliveries.initiate(
            { search: list.params.search, sortBy: list.sortBy, sortDir: list.sortDir, ...filters },
            { subscribe: false, forceRefetch: true }
          )
        ),
      (rows, printedAt) => {
        const printMaterialName = filterName(filters.materialId, materials, rows, (row) => row.materialName);
        return {
          title: "خامات المشاريع",
          filters: activeFilters([
            ["رقم التفويض", filters.authorizationNumber],
            ["المشروع", filterName(filters.projectId, projects, rows, (row) => row.projectName)],
            ["الخامة", printMaterialName],
            ["رقم البوليصة", filters.billOfLadingNumber],
            ["البحث", list.search ? `"${list.search}"` : undefined],
          ]),
          columns: PRINT_COLUMNS,
          rows,
          total: {
            label: totalQuantityLabel(printMaterialName),
            value: formatQuantity(rows.reduce((sum, row) => sum + row.quantity, 0)),
          },
          printedAt,
        };
      }
    );

  return (
    <ListPage
      title="خامات المشاريع"
      list={list}
      query={query}
      columns={columns}
      itemLabel={materialDeliveryLabel}
      minWidthClassName="min-w-[1800px]"
      canWrite={canWrite}
      onAdd={() => setDialog({ mode: "create" })}
      onEdit={(item) => setDialog({ mode: "edit", item })}
      onDelete={(item) => removeRecord(item.id)}
      searchPlaceholder="بحث شامل"
      headerActions={printer.button(print)}
      toolbar={
        <>
          <TextFilter
            label="رقم التفويض"
            ltr
            value={filters.authorizationNumber}
            onChange={(value) => list.setFilter("authorizationNumber", value)}
          />
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
          <TextFilter
            label="رقم البوليصة"
            ltr
            value={filters.billOfLadingNumber}
            onChange={(value) => list.setFilter("billOfLadingNumber", value)}
          />
        </>
      }
      summary={<TotalQuantity value={query.currentData?.totalQuantity} materialName={materialName} />}
    >
      {dialog && (
        <MaterialDeliveryFormDialog
          key={dialog.mode === "edit" ? dialog.item.id : "create"}
          item={dialog.mode === "edit" ? dialog.item : undefined}
          prefill={
            dialog.mode === "create" ? { projectId: filters.projectId, materialId: filters.materialId } : undefined
          }
          onClose={() => setDialog(null)}
          // Keep المشروع / الخامة (they pre-fill the next add); clear the number filters, which the
          // new delivery may not match.
          onCreated={() => list.showNewest({ keepFilters: ["projectId", "materialId"] })}
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
