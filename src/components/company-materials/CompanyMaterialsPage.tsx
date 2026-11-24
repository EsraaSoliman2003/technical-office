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
import { useListState, type ListStateOptions } from "@/components/list/useListState";
import { filterName, waitingForOptions } from "@/components/options/useOptionList";
import { activeFilters, type PrintColumn } from "@/components/print/PrintView";
import { usePrintExport } from "@/components/print/usePrintExport";
import { formatQuantity } from "@/lib/numbers";
import {
  companyMaterialApi,
  useListCompanyMaterialsQuery,
  useRemoveCompanyMaterialMutation,
} from "@/rtk/endpoints/companyMaterialApi";
import { useAppDispatch } from "@/rtk/hooks";
import type { CompanyMaterialFilters, CompanyMaterialItem, CompanyMaterialSortBy } from "@/types/companyMaterial";
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

function CompanyMaterialsPageContent() {
  const canWrite = useCanWrite();
  const dispatch = useAppDispatch();
  const { projects, materials, companies } = useOptionLists();

  // Unknown ids in the URL are dropped once the option lists are loaded.
  const listOptions = useMemo<ListStateOptions<CompanyMaterialSortBy>>(
    () => ({
      pageSize: 20,
      sortColumns: SORT_COLUMNS,
      defaultSortBy: "createdAt",
      defaultSortDir: "desc",
      ascendingFirst: ["loadingPermitNumber", "projectName", "materialName", "companyName"],
      filterValues: {
        projectId: projects.ids,
        materialId: materials.ids,
        companyId: companies.ids,
      },
    }),
    [projects.ids, materials.ids, companies.ids]
  );
  const list = useListState(listOptions);
  const filters: CompanyMaterialFilters = {
    projectId: list.filters.projectId,
    materialId: list.filters.materialId,
    companyId: list.filters.companyId,
  };
  const waiting = waitingForOptions([
    [filters.projectId, projects],
    [filters.materialId, materials],
    [filters.companyId, companies],
  ]);
  const listQuery = useListCompanyMaterialsQuery(waiting ? skipToken : { ...list.params, ...filters });
  // Show the loading skeleton while waiting.
  const query = { ...listQuery, isFetching: listQuery.isFetching || waiting };
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
        cell: (item) => <LtrText value={item.loadingPermitNumber} />,
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
        cell: (item) => <QuantityText value={item.quantity} />,
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
        cell: (item) => <NotesCell value={item.notes} />,
      },
      {
        key: "attachments",
        header: "البوليصة",
        className: "py-2 whitespace-nowrap text-muted-foreground",
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
    ],
    [setViewing]
  );

  const materialName = filterName(filters.materialId, materials, query.currentData?.items, (row) => row.materialName);

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
              ...filters,
            },
            { subscribe: false, forceRefetch: true }
          )
        ),
      (rows, printedAt) => {
        const printMaterialName = filterName(filters.materialId, materials, rows, (row) => row.materialName);
        return {
          title: "خامات الشركات",
          filters: activeFilters([
            ["المشروع", filterName(filters.projectId, projects, rows, (row) => row.projectName)],
            ["الخامة", printMaterialName],
            ["الشركة المنفذة", filterName(filters.companyId, companies, rows, (row) => row.companyName)],
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
      headerActions={printer.button(print)}
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
      summary={<TotalQuantity value={query.currentData?.totalQuantity} materialName={materialName} />}
    >
      {dialog && (
        <CompanyMaterialFormDialog
          key={dialog.mode === "edit" ? dialog.item.id : "create"}
          item={dialog.mode === "edit" ? dialog.item : undefined}
          prefill={dialog.mode === "create" ? filters : undefined}
          onClose={() => setDialog(null)}
          // The new row matches the pre-filled filters, so they stay.
          onCreated={() => list.showNewest({ keepFilters: ["projectId", "materialId", "companyId"] })}
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
