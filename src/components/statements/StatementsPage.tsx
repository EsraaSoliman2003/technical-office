"use client";

import { useMemo, useState } from "react";
import { skipToken } from "@reduxjs/toolkit/query";
import {
  AmountText,
  AttachmentCountButton,
  DateOnlyText,
  LtrText,
  NotesCell,
  PercentText,
} from "@/components/list/cells";
import { auditColumns } from "@/components/list/columns";
import { useCanWrite } from "@/components/list/formHelpers";
import ListPage, { ListSuspense } from "@/components/list/ListPage";
import type { ListColumn } from "@/components/list/ListTable";
import { OptionFilter } from "@/components/list/OptionFilter";
import { SegmentedFilter } from "@/components/list/SegmentedFilter";
import { SelectFilter } from "@/components/list/SelectFilter";
import { useListState, type ListStateOptions } from "@/components/list/useListState";
import { filterName, waitingForOptions, type OptionList } from "@/components/options/useOptionList";
import { activeFilters, type PrintColumn } from "@/components/print/PrintView";
import { usePrintExport } from "@/components/print/usePrintExport";
import { Badge } from "@/components/ui";
import { formatAmount, formatDateOnly } from "@/lib/numbers";
import { statementApi, useListStatementsQuery, useRemoveStatementMutation } from "@/rtk/endpoints/statementApi";
import { useAppDispatch } from "@/rtk/hooks";
import type { StatementFilters, StatementItem, StatementSortBy } from "@/types/statement";
import { statementLabel } from "./labels";
import StatementAttachmentsDialog from "./StatementAttachmentsDialog";
import StatementFormDialog from "./StatementFormDialog";
import { useStatementLists } from "./useStatementLists";

const SORT_COLUMNS: readonly StatementSortBy[] = ["status", "createdAt", "updatedAt"];

type DialogState = { mode: "create" } | { mode: "edit"; statement: StatementItem } | null;

const money = (value: number | null) => (value === null ? "—" : <span dir="ltr">{formatAmount(value)}</span>);

/** The business columns for طباعة / PDF (no attachments / audit / actions). */
function printColumns(statuses: OptionList, installments: OptionList): PrintColumn<StatementItem>[] {
  return [
    { header: "رقم العقد", cell: (row) => <LtrText value={row.contractNumber} /> },
    { header: "بيان العقد", cell: (row) => row.contractName, multiline: true },
    { header: "قيمة المستخلص", cell: (row) => money(row.amount) },
    { header: "صافي الصرف", cell: (row) => money(row.netPayment) },
    { header: "موقف المستخلص", cell: (row) => statuses.nameOf(row.status) ?? row.status },
    {
      header: "دفعة",
      cell: (row) => (row.installment ? (installments.nameOf(row.installment) ?? row.installment) : "—"),
    },
    { header: "تاريخ الصرف", cell: (row) => <span dir="ltr">{formatDateOnly(row.paymentDate)}</span> },
    {
      header: "النسبة المؤوية للصرف",
      cell: (row) => (row.paymentPercent === null ? "—" : <span dir="ltr">{formatAmount(row.paymentPercent)}%</span>),
    },
  ];
}

function StatementsPageContent() {
  const canWrite = useCanWrite();
  const dispatch = useAppDispatch();
  const { contracts, statuses, installments } = useStatementLists();

  // Contract ids / statuses / دفعة values not in their (loaded) lists are dropped from the URL.
  const listOptions = useMemo<ListStateOptions<StatementSortBy>>(
    () => ({
      pageSize: 20,
      sortColumns: SORT_COLUMNS,
      defaultSortBy: "createdAt",
      defaultSortDir: "desc",
      filterValues: { contractId: contracts.ids, status: statuses.ids, installment: installments.ids },
    }),
    [contracts.ids, statuses.ids, installments.ids]
  );
  const list = useListState(listOptions);
  const filters: StatementFilters = {
    contractId: list.filters.contractId,
    status: list.filters.status,
    installment: list.filters.installment,
  };
  const waiting = waitingForOptions([
    [filters.contractId, contracts],
    [filters.status, statuses],
    [filters.installment, installments],
  ]);
  const listQuery = useListStatementsQuery(waiting ? skipToken : { ...list.params, ...filters });
  // Show the loading skeleton while waiting.
  const query = { ...listQuery, isFetching: listQuery.isFetching || waiting };
  const [removeStatement] = useRemoveStatementMutation();
  const [dialog, setDialog] = useState<DialogState>(null);
  const [viewing, setViewing] = useState<StatementItem | null>(null);

  const columns = useMemo<ListColumn<StatementItem, StatementSortBy>[]>(
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
        key: "amount",
        header: "قيمة المستخلص",
        className: "whitespace-nowrap text-foreground",
        cell: (item) => <AmountText value={item.amount} />,
      },
      {
        key: "netPayment",
        header: "صافي الصرف",
        className: "whitespace-nowrap text-foreground",
        cell: (item) => <AmountText value={item.netPayment} />,
      },
      {
        key: "status",
        header: "موقف المستخلص",
        sortKey: "status",
        className: "whitespace-nowrap",
        cell: (item) => <Badge variant="primary">{statuses.nameOf(item.status) ?? item.status}</Badge>,
      },
      {
        key: "installment",
        header: "دفعة",
        className: "whitespace-nowrap text-muted-foreground",
        cell: (item) => (item.installment ? (installments.nameOf(item.installment) ?? item.installment) : "—"),
      },
      {
        key: "paymentDate",
        header: "تاريخ الصرف",
        className: "whitespace-nowrap text-muted-foreground",
        cell: (item) => <DateOnlyText value={item.paymentDate} />,
      },
      {
        key: "paymentPercent",
        header: "النسبة المؤوية للصرف",
        className: "whitespace-nowrap text-foreground",
        cell: (item) => <PercentText value={item.paymentPercent} />,
      },
      {
        key: "attachments",
        header: "المرفقات",
        className: "py-1.5 whitespace-nowrap",
        cell: (item) => (
          <AttachmentCountButton
            count={item.attachmentCount}
            label={`عرض مرفقات ${statementLabel(item)}`}
            onClick={() => setViewing(item)}
          />
        ),
      },
      ...auditColumns<StatementItem, StatementSortBy>({ createdAt: "createdAt", updatedAt: "updatedAt" }),
    ],
    [statuses, installments, setViewing]
  );

  // ---- موقف المستخلص counters: counts follow the other filters ----
  // The last loaded counts stay while the next page loads (no flicker when switching status).
  const statusCounts = listQuery.data?.statusCounts;
  const counts = useMemo(() => {
    if (!statusCounts) return undefined;
    const byStatus = new Map(statusCounts.statuses.map((entry) => [entry.status, entry.count]));
    return { all: statusCounts.all, of: (status: string) => byStatus.get(status) ?? 0 };
  }, [statusCounts]);
  const counterItems = [
    { value: null, label: "الكل", count: counts?.all },
    ...statuses.options.map((option) => ({
      value: option.value,
      label: option.label,
      count: counts?.of(option.value),
    })),
  ];

  // ---- طباعة / PDF: all rows for the current filters and sort → print view ----
  const printer = usePrintExport<StatementItem>();
  const print = () =>
    printer.print(
      // One-off, unsubscribed fetch: the rows are not kept in the store.
      () =>
        dispatch(
          statementApi.endpoints.exportStatements.initiate(
            { search: list.params.search, sortBy: list.sortBy, sortDir: list.sortDir, ...filters },
            { subscribe: false, forceRefetch: true }
          )
        ),
      (rows, printedAt) => ({
        title: "المستخلصات",
        filters: activeFilters([
          ["رقم العقد", filterName(filters.contractId, contracts, rows, (row) => row.contractNumber)],
          ["موقف المستخلص", filters.status ? (statuses.nameOf(filters.status) ?? filters.status) : undefined],
          ["دفعة", filters.installment ? (installments.nameOf(filters.installment) ?? filters.installment) : undefined],
          ["البحث", list.search ? `"${list.search}"` : undefined],
        ]),
        columns: printColumns(statuses, installments),
        rows,
        // Summed in whole piastres (×100) so many 2-decimal amounts add up exactly.
        total: [
          {
            label: "إجمالي قيمة المستخلصات",
            value: formatAmount(rows.reduce((sum, row) => sum + Math.round(row.amount * 100), 0) / 100),
          },
          {
            label: "إجمالي صافي الصرف",
            value: formatAmount(rows.reduce((sum, row) => sum + Math.round((row.netPayment ?? 0) * 100), 0) / 100),
          },
        ],
        printedAt,
      })
    );

  const totalAmount = query.currentData?.totalAmount;
  const totalNetPayment = query.currentData?.totalNetPayment;

  return (
    <ListPage
      title="المستخلصات"
      list={list}
      query={query}
      columns={columns}
      itemLabel={statementLabel}
      minWidthClassName="min-w-[1700px]"
      canWrite={canWrite}
      onAdd={() => setDialog({ mode: "create" })}
      onEdit={(statement) => setDialog({ mode: "edit", statement })}
      onDelete={(statement) => removeStatement(statement.id)}
      searchPlaceholder="بحث شامل"
      headerActions={printer.button(print)}
      topBar={
        statuses.loadError ? (
          <p className="text-sm text-danger">تعذر تحميل حالات المستخلصات</p>
        ) : (
          <SegmentedFilter
            label="تصفية حسب موقف المستخلص"
            items={counterItems}
            value={filters.status}
            onChange={(value) => list.setFilter("status", value)}
          />
        )
      }
      toolbar={
        <>
          <OptionFilter
            label="رقم العقد"
            allLabel="كل العقود"
            list={contracts}
            value={filters.contractId}
            onChange={(value) => list.setFilter("contractId", value)}
          />
          <SelectFilter
            label="دفعة"
            allLabel="كل الدفعات"
            list={installments}
            value={filters.installment}
            onChange={(value) => list.setFilter("installment", value)}
          />
        </>
      }
      countLabel="عدد المستخلصات"
      summary={
        totalAmount !== undefined && (
          <div className="flex flex-wrap gap-x-6 gap-y-1">
            <p className="text-sm text-muted-foreground">
              إجمالي قيمة المستخلصات:{" "}
              <span className="font-semibold text-foreground">
                <AmountText value={totalAmount} />
              </span>
            </p>
            <p className="text-sm text-muted-foreground">
              إجمالي صافي الصرف:{" "}
              <span className="font-semibold text-foreground">
                <AmountText value={totalNetPayment} />
              </span>
            </p>
          </div>
        )
      }
    >
      {dialog && (
        <StatementFormDialog
          key={dialog.mode === "edit" ? dialog.statement.id : "create"}
          statement={dialog.mode === "edit" ? dialog.statement : undefined}
          onClose={() => setDialog(null)}
          // Clears the filters too, so the new statement is on top.
          onCreated={() => list.showNewest()}
        />
      )}
      {viewing && (
        <StatementAttachmentsDialog statement={viewing} canWrite={canWrite} onClose={() => setViewing(null)} />
      )}
      {printer.view}
    </ListPage>
  );
}

/** المستخلصات (/statements): status counters, filters, totals, print, add/edit with attachments. */
export default function StatementsPage() {
  return (
    <ListSuspense>
      <StatementsPageContent />
    </ListSuspense>
  );
}
