"use client";

import { useMemo, useState } from "react";
import { skipToken } from "@reduxjs/toolkit/query";
import { AmountText, LtrText, NotesCell, PercentText } from "@/components/list/cells";
import { auditColumns } from "@/components/list/columns";
import { useCanWrite } from "@/components/list/formHelpers";
import ListPage, { ListSuspense } from "@/components/list/ListPage";
import type { ListColumn } from "@/components/list/ListTable";
import { SegmentedFilter } from "@/components/list/SegmentedFilter";
import { useListState, type ListStateOptions } from "@/components/list/useListState";
import { useLabeledList, waitingForOptions, type OptionList } from "@/components/options/useOptionList";
import { activeFilters, type PrintColumn } from "@/components/print/PrintView";
import { usePrintExport } from "@/components/print/usePrintExport";
import { Badge } from "@/components/ui";
import { formatAmount } from "@/lib/numbers";
import {
  advanceSheetApi,
  useListAdvanceSheetsQuery,
  useRemoveAdvanceSheetMutation,
} from "@/rtk/endpoints/advanceSheetApi";
import { useContractMetaQuery } from "@/rtk/endpoints/contractApi";
import { useAppDispatch } from "@/rtk/hooks";
import type { AdvanceSheetFilters, AdvanceSheetItem, AdvanceSheetSortBy } from "@/types/advanceSheet";
import AdvanceSheetFormDialog from "./AdvanceSheetFormDialog";
import { advanceSheetLabel, EXCEEDS_ALLOWED_LABEL } from "./labels";

const SORT_COLUMNS: readonly AdvanceSheetSortBy[] = ["createdAt", "updatedAt"];

type DialogState = { mode: "create" } | { mode: "edit"; sheet: AdvanceSheetItem } | null;

const money = (value: number | null) => (value === null ? "—" : <span dir="ltr">{formatAmount(value)}</span>);
const percent = (value: number | null) => (value === null ? "—" : <span dir="ltr">{formatAmount(value)}%</span>);

/** السلفة with the "تتجاوز الحد المسموح" warning badge. */
function RequestedCell({ item }: { item: AdvanceSheetItem }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="font-semibold">
        <AmountText value={item.requestedAmount} />
      </span>
      {item.exceedsAllowed && <Badge variant="danger">{EXCEEDS_ALLOWED_LABEL}</Badge>}
    </div>
  );
}

/** The business columns for طباعة / PDF (no audit / actions). */
function printColumns(advanceStatuses: OptionList): PrintColumn<AdvanceSheetItem>[] {
  return [
    { header: "رقم العقد", cell: (row) => <LtrText value={row.contractNumber} /> },
    { header: "بيان العقد", cell: (row) => row.contractName, multiline: true },
    {
      header: "السلفة",
      cell: (row) => (
        <>
          {money(row.requestedAmount)}
          {row.exceedsAllowed && ` (${EXCEEDS_ALLOWED_LABEL})`}
        </>
      ),
    },
    { header: "موقف السلفة", cell: (row) => advanceStatuses.nameOf(row.advanceStatus) ?? row.advanceStatus },
    { header: "الحد الاقصى المسموح", cell: (row) => money(row.maxAllowedRequest) },
    { header: "نسبة اجمالي المنصرف", cell: (row) => percent(row.totalSpentPercent) },
  ];
}

function AdvancesPageContent() {
  const canWrite = useCanWrite();
  const dispatch = useAppDispatch();
  // موقف السلفة labels and order: the contracts' meta.
  const meta = useContractMetaQuery();
  const advanceStatuses = useLabeledList(meta.currentData?.advanceStatuses, meta.isLoading, meta.isError);

  // A status not in the (loaded) list is dropped from the URL.
  const listOptions = useMemo<ListStateOptions<AdvanceSheetSortBy>>(
    () => ({
      pageSize: 20,
      sortColumns: SORT_COLUMNS,
      defaultSortBy: "createdAt",
      defaultSortDir: "desc",
      filterValues: { advanceStatus: advanceStatuses.ids },
    }),
    [advanceStatuses.ids]
  );
  const list = useListState(listOptions);
  const filters: AdvanceSheetFilters = { advanceStatus: list.filters.advanceStatus };
  const waiting = waitingForOptions([[filters.advanceStatus, advanceStatuses]]);
  const listQuery = useListAdvanceSheetsQuery(waiting ? skipToken : { ...list.params, ...filters });
  // Show the loading skeleton while waiting.
  const query = { ...listQuery, isFetching: listQuery.isFetching || waiting };
  const [removeSheet] = useRemoveAdvanceSheetMutation();
  const [dialog, setDialog] = useState<DialogState>(null);

  const columns = useMemo<ListColumn<AdvanceSheetItem, AdvanceSheetSortBy>[]>(
    () => [
      {
        key: "contractNumber",
        header: "رقم العقد",
        className: "whitespace-nowrap font-semibold text-foreground",
        cell: (item) => <LtrText value={item.contractNumber} />,
      },
      {
        key: "contractName",
        header: "بيان العقد",
        className: "text-foreground",
        cell: (item) => <NotesCell value={item.contractName} />,
      },
      {
        key: "requestedAmount",
        header: "السلفة",
        className: "whitespace-nowrap text-foreground",
        cell: (item) => <RequestedCell item={item} />,
      },
      {
        key: "advanceStatus",
        header: "موقف السلفة",
        className: "whitespace-nowrap",
        cell: (item) => (
          <Badge variant="primary">{advanceStatuses.nameOf(item.advanceStatus) ?? item.advanceStatus}</Badge>
        ),
      },
      {
        key: "maxAllowedRequest",
        header: "الحد الاقصى المسموح",
        className: "whitespace-nowrap text-foreground",
        cell: (item) => <AmountText value={item.maxAllowedRequest} />,
      },
      {
        key: "totalSpentPercent",
        header: "نسبة اجمالي المنصرف",
        className: "whitespace-nowrap text-foreground",
        cell: (item) => <PercentText value={item.totalSpentPercent} />,
      },
      ...auditColumns<AdvanceSheetItem, AdvanceSheetSortBy>({ createdAt: "createdAt", updatedAt: "updatedAt" }),
    ],
    [advanceStatuses]
  );

  // ---- موقف السلفة counters: counts follow the other filters (the last ones kept while loading) ----
  const statusCounts = listQuery.data?.statusCounts;
  const counts = useMemo(() => {
    if (!statusCounts) return undefined;
    const byStatus = new Map(statusCounts.statuses.map((entry) => [entry.status, entry.count]));
    return { all: statusCounts.all, of: (status: string) => byStatus.get(status) ?? 0 };
  }, [statusCounts]);
  const counterItems = [
    { value: null, label: "الكل", count: counts?.all },
    ...advanceStatuses.options.map((option) => ({
      value: option.value,
      label: option.label,
      count: counts?.of(option.value),
    })),
  ];

  // ---- طباعة / PDF: all rows for the current filters and sort → print view ----
  const printer = usePrintExport<AdvanceSheetItem>();
  const print = () =>
    printer.print(
      // One-off, unsubscribed fetch: the rows are not kept in the store.
      () =>
        dispatch(
          advanceSheetApi.endpoints.exportAdvanceSheets.initiate(
            { search: list.params.search, sortBy: list.sortBy, sortDir: list.sortDir, ...filters },
            { subscribe: false, forceRefetch: true }
          )
        ),
      (rows, printedAt) => ({
        title: "السلف",
        filters: activeFilters([
          [
            "موقف السلفة",
            filters.advanceStatus
              ? (advanceStatuses.nameOf(filters.advanceStatus) ?? filters.advanceStatus)
              : undefined,
          ],
          ["البحث", list.search ? `"${list.search}"` : undefined],
        ]),
        columns: printColumns(advanceStatuses),
        rows,
        // Summed in whole piastres (×100) so many 2-decimal amounts add up exactly.
        total: {
          label: "إجمالي السلف",
          value: formatAmount(rows.reduce((sum, row) => sum + Math.round((row.requestedAmount ?? 0) * 100), 0) / 100),
        },
        printedAt,
      })
    );

  const totalRequested = query.currentData?.totalRequested;

  return (
    <ListPage
      title="السلف"
      list={list}
      query={query}
      columns={columns}
      itemLabel={advanceSheetLabel}
      minWidthClassName="min-w-[1300px]"
      canWrite={canWrite}
      onAdd={() => setDialog({ mode: "create" })}
      onEdit={(sheet) => setDialog({ mode: "edit", sheet })}
      onDelete={(sheet) => removeSheet({ id: sheet.id, contractId: sheet.contractId })}
      searchPlaceholder="بحث شامل"
      headerActions={printer.button(print)}
      topBar={
        advanceStatuses.loadError ? (
          <p className="text-sm text-danger">تعذر تحميل حالات السلفة</p>
        ) : (
          <SegmentedFilter
            label="تصفية حسب موقف السلفة"
            items={counterItems}
            value={filters.advanceStatus}
            onChange={(value) => list.setFilter("advanceStatus", value)}
          />
        )
      }
      countLabel="عدد السلف"
      summary={
        totalRequested !== undefined && (
          <p className="text-sm text-muted-foreground">
            إجمالي السلف:{" "}
            <span className="font-semibold text-foreground">
              <AmountText value={totalRequested} />
            </span>
          </p>
        )
      }
    >
      {dialog && (
        <AdvanceSheetFormDialog
          key={dialog.mode === "edit" ? dialog.sheet.id : "create"}
          sheet={dialog.mode === "edit" ? dialog.sheet : undefined}
          onClose={() => setDialog(null)}
          // Clears the filter too, so the new sheet is on top.
          onCreated={() => list.showNewest()}
          onOpenExisting={(sheet) => setDialog({ mode: "edit", sheet })}
        />
      )}
      {printer.view}
    </ListPage>
  );
}

/** السلف (/advances): حساب قيمة السلفة per contract — status counters, totals, print, add/edit. */
export default function AdvancesPage() {
  return (
    <ListSuspense>
      <AdvancesPageContent />
    </ListSuspense>
  );
}
