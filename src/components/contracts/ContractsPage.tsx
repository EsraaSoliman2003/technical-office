"use client";

import { useMemo, useState } from "react";
import { skipToken } from "@reduxjs/toolkit/query";
import { CategoryAttachmentButtons } from "@/components/attachments/categories";
import { AmountText, DateOnlyText, LtrText, NotesCell } from "@/components/list/cells";
import { auditColumns } from "@/components/list/columns";
import { useCanWrite } from "@/components/list/formHelpers";
import ListPage, { ListSuspense } from "@/components/list/ListPage";
import type { ListColumn } from "@/components/list/ListTable";
import { OptionFilter } from "@/components/list/OptionFilter";
import { SegmentedFilter } from "@/components/list/SegmentedFilter";
import { SelectFilter } from "@/components/list/SelectFilter";
import { TextFilter } from "@/components/list/TextFilter";
import { useListState, type ListStateOptions } from "@/components/list/useListState";
import { filterName, waitingForOptions, type OptionList } from "@/components/options/useOptionList";
import { activeFilters, type PrintColumn } from "@/components/print/PrintView";
import { usePrintExport } from "@/components/print/usePrintExport";
import { isStatementCounterStatus } from "@/components/statements/labels";
import { useStatementLists } from "@/components/statements/useStatementLists";
import { Badge } from "@/components/ui";
import { formatAmount, formatDateOnly } from "@/lib/numbers";
import { contractApi, useListContractsQuery, useRemoveContractMutation } from "@/rtk/endpoints/contractApi";
import { useAppDispatch } from "@/rtk/hooks";
import type { ContractAttachmentCategory, ContractFilters, ContractItem, ContractSortBy } from "@/types/contract";
import ContractAttachmentsDialog from "./ContractAttachmentsDialog";
import ContractFormDialog from "./ContractFormDialog";
import {
  ADVANCE_COUNTER_STATUSES,
  CONTRACT_ATTACHMENT_CATEGORIES,
  CONTRACT_ATTACHMENT_LABELS,
  contractLabel,
} from "./labels";
import { useContractLists } from "./useContractLists";

const SORT_COLUMNS: readonly ContractSortBy[] = [
  "contractNumber",
  "name",
  "projectName",
  "companyName",
  "contractValue",
  "status",
  "contractDate",
  "advanceStatus",
  "advanceValue",
  "createdAt",
  "updatedAt",
];

/** The الأوراق المعلقة button's value in the السلفة row (not an advance status). */
const PENDING_PAPERS = "hasPendingPapers";

type DialogState = { mode: "create" } | { mode: "edit"; contract: ContractItem } | null;
type ViewingState = { contract: ContractItem; category: ContractAttachmentCategory } | null;

/** The business columns for طباعة / PDF (no attachments / audit / actions). */
function printColumns(
  stages: OptionList,
  statuses: OptionList,
  advanceStatuses: OptionList
): PrintColumn<ContractItem>[] {
  return [
    { header: "رقم العقد", cell: (row) => <LtrText value={row.contractNumber} /> },
    { header: "اسم العقد", cell: (row) => row.name, multiline: true },
    { header: "اسم المشروع", cell: (row) => row.projectName },
    { header: "اسم الشركة", cell: (row) => row.companyName },
    {
      header: "قيمة العقد",
      cell: (row) => (row.contractValue === null ? "—" : <span dir="ltr">{formatAmount(row.contractValue)}</span>),
    },
    { header: "موقف العقد", cell: (row) => statuses.nameOf(row.status) ?? row.status },
    { header: "مرحلة العقد", cell: (row) => (row.stage ? (stages.nameOf(row.stage) ?? row.stage) : "—") },
    { header: "تاريخ التعاقد", cell: (row) => <span dir="ltr">{formatDateOnly(row.contractDate)}</span> },
    { header: "موقف السلفة", cell: (row) => advanceStatuses.nameOf(row.advanceStatus) ?? row.advanceStatus },
    {
      header: "قيمة السلفة",
      cell: (row) => (row.advanceValue === null ? "—" : <span dir="ltr">{formatAmount(row.advanceValue)}</span>),
    },
    { header: "الأوراق", cell: (row) => <span className="tabular-nums">{row.paperCount}</span> },
    { header: "ملاحظات", cell: (row) => row.notes || "—", multiline: true },
  ];
}

/** الأوراق: the paper count, with "2 معلقة" when some are received and not sent out yet. */
function PaperCount({ item }: { item: ContractItem }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="tabular-nums">{item.paperCount}</span>
      {item.pendingPaperCount > 0 && (
        <Badge variant="accent">
          <span className="tabular-nums">{item.pendingPaperCount}</span> معلقة
        </Badge>
      )}
    </div>
  );
}

/** المستخلصات: how many, and the sum of their amounts ("2 · 1,000.00"). */
function StatementTotals({ item }: { item: ContractItem }) {
  if (item.statementCount === 0) return <span className="text-muted-foreground tabular-nums">0</span>;
  return (
    <div className="flex items-center gap-1.5">
      <span className="tabular-nums">{item.statementCount}</span>
      <span aria-hidden="true" className="text-muted-foreground">
        ·
      </span>
      <AmountText value={item.statementsTotal} />
    </div>
  );
}

function ContractsPageContent() {
  const canWrite = useCanWrite();
  const dispatch = useAppDispatch();
  const { projects, companies, stages, statuses, advanceStatuses } = useContractLists(undefined, { full: false });
  const { statuses: statementStatuses } = useStatementLists(undefined, { contracts: false });
  // ?statementStatus= accepts only the statuses that have a counter button (undefined while meta loads).
  const statementCounterIds = useMemo(
    () =>
      statementStatuses.ids &&
      statementStatuses.options.filter((option) => isStatementCounterStatus(option)).map((option) => option.value),
    [statementStatuses.ids, statementStatuses.options]
  );

  // رقم العقد takes any value; ids / statuses / stages / advance statuses not in their (loaded) lists are dropped
  // from the URL (hasPendingPapers: only "true").
  const listOptions = useMemo<ListStateOptions<ContractSortBy>>(
    () => ({
      pageSize: 20,
      sortColumns: SORT_COLUMNS,
      defaultSortBy: "createdAt",
      defaultSortDir: "desc",
      ascendingFirst: ["contractNumber", "name", "projectName", "companyName"],
      filterValues: {
        contractNumber: undefined,
        projectId: projects.ids,
        companyId: companies.ids,
        status: statuses.ids,
        stage: stages.ids,
        advanceStatus: advanceStatuses.ids,
        hasPendingPapers: ["true"],
        // Only the six statuses that have a counter button (not تم الصرف), so every active filter can be cleared.
        statementStatus: statementCounterIds,
      },
    }),
    [projects.ids, companies.ids, statuses.ids, stages.ids, advanceStatuses.ids, statementCounterIds]
  );
  const list = useListState(listOptions);
  const filters: ContractFilters = {
    contractNumber: list.filters.contractNumber,
    projectId: list.filters.projectId,
    companyId: list.filters.companyId,
    status: list.filters.status,
    stage: list.filters.stage,
    advanceStatus: list.filters.advanceStatus,
    hasPendingPapers: list.filters.hasPendingPapers,
    statementStatus: list.filters.statementStatus,
  };
  const waiting = waitingForOptions([
    [filters.projectId, projects],
    [filters.companyId, companies],
    [filters.status, statuses],
    [filters.stage, stages],
    [filters.advanceStatus, advanceStatuses],
    [filters.statementStatus, statementStatuses],
  ]);
  const listQuery = useListContractsQuery(waiting ? skipToken : { ...list.params, ...filters });
  // Show the loading skeleton while waiting.
  const query = { ...listQuery, isFetching: listQuery.isFetching || waiting };
  const [removeContract] = useRemoveContractMutation();
  const [dialog, setDialog] = useState<DialogState>(null);
  const [viewing, setViewing] = useState<ViewingState>(null);

  const columns = useMemo<ListColumn<ContractItem, ContractSortBy>[]>(
    () => [
      {
        key: "contractNumber",
        header: "رقم العقد",
        sortKey: "contractNumber",
        className: "whitespace-nowrap font-semibold text-foreground",
        cell: (item) => <LtrText value={item.contractNumber} />,
      },
      {
        key: "name",
        header: "اسم العقد",
        sortKey: "name",
        className: "text-foreground",
        cell: (item) => <NotesCell value={item.name} />,
      },
      {
        key: "projectName",
        header: "اسم المشروع",
        sortKey: "projectName",
        className: "text-foreground",
        cell: (item) => item.projectName,
      },
      {
        key: "companyName",
        header: "اسم الشركة",
        sortKey: "companyName",
        className: "text-foreground",
        cell: (item) => item.companyName,
      },
      {
        key: "contractValue",
        header: "قيمة العقد",
        sortKey: "contractValue",
        className: "whitespace-nowrap text-foreground",
        cell: (item) => <AmountText value={item.contractValue} />,
      },
      {
        key: "status",
        header: "موقف العقد",
        sortKey: "status", // the server sorts in journey order (كتيبة → … → تم التعاقد)
        className: "whitespace-nowrap",
        cell: (item) => <Badge variant="primary">{statuses.nameOf(item.status) ?? item.status}</Badge>,
      },
      {
        key: "stage",
        header: "مرحلة العقد",
        className: "whitespace-nowrap text-muted-foreground",
        cell: (item) => (item.stage ? (stages.nameOf(item.stage) ?? item.stage) : "—"),
      },
      {
        key: "contractDate",
        header: "تاريخ التعاقد",
        sortKey: "contractDate",
        className: "whitespace-nowrap text-muted-foreground",
        cell: (item) => <DateOnlyText value={item.contractDate} />,
      },
      {
        key: "advanceStatus",
        header: "موقف السلفة",
        sortKey: "advanceStatus", // journey order (لا توجد سلفة → … → تم الصرف)
        className: "whitespace-nowrap",
        cell: (item) => (
          <Badge variant="primary">{advanceStatuses.nameOf(item.advanceStatus) ?? item.advanceStatus}</Badge>
        ),
      },
      {
        key: "advanceValue",
        header: "قيمة السلفة",
        sortKey: "advanceValue",
        className: "whitespace-nowrap text-foreground",
        cell: (item) => <AmountText value={item.advanceValue} />,
      },
      {
        key: "attachments",
        header: "المرفقات",
        className: "py-2 whitespace-nowrap",
        cell: (item) => (
          <CategoryAttachmentButtons
            categories={CONTRACT_ATTACHMENT_CATEGORIES}
            labels={CONTRACT_ATTACHMENT_LABELS}
            counts={item.attachmentCounts}
            itemName={contractLabel(item)}
            onOpen={(category) => setViewing({ contract: item, category })}
          />
        ),
      },
      {
        key: "papers",
        header: "الأوراق",
        className: "whitespace-nowrap text-foreground",
        cell: (item) => <PaperCount item={item} />,
      },
      {
        key: "statements",
        header: "المستخلصات",
        className: "whitespace-nowrap text-foreground",
        cell: (item) => <StatementTotals item={item} />,
      },
      {
        key: "notes",
        header: "ملاحظات",
        className: "text-muted-foreground",
        cell: (item) => <NotesCell value={item.notes} />,
      },
      ...auditColumns<ContractItem, ContractSortBy>({ createdAt: "createdAt", updatedAt: "updatedAt" }),
    ],
    [statuses, stages, advanceStatuses, setViewing]
  );

  // ---- Status counters (the old row of buttons): counts follow the other filters ----
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

  // ---- السلفة counters (the old second row): لواء · ادارة · هيئة · مركزية · الأوراق المعلقة ----
  // One choice spread over ?advanceStatus= / ?hasPendingPapers=true; clicking the active one clears it.
  const advanceCounts = listQuery.data?.advanceCounts;
  const advanceCountOf = useMemo(() => {
    if (!advanceCounts) return undefined;
    const byStatus = new Map(advanceCounts.statuses.map((entry) => [entry.status, entry.count]));
    return (status: string) => byStatus.get(status) ?? 0;
  }, [advanceCounts]);
  const advanceItems = [
    ...advanceStatuses.options
      .filter((option) => ADVANCE_COUNTER_STATUSES.includes(option.value))
      .map((option) => ({ value: option.value, label: option.label, count: advanceCountOf?.(option.value) })),
    { value: PENDING_PAPERS, label: "الأوراق المعلقة", count: advanceCounts?.pendingPapers },
  ];
  const advanceChoice = filters.hasPendingPapers ? PENDING_PAPERS : (filters.advanceStatus ?? null);
  const chooseAdvance = (value: string | null) => {
    if (value === null || value === advanceChoice) list.setFilters({ advanceStatus: null, hasPendingPapers: null });
    else if (value === PENDING_PAPERS) list.setFilters({ advanceStatus: null, hasPendingPapers: "true" });
    else list.setFilters({ advanceStatus: value, hasPendingPapers: null });
  };
  const advanceFilterLabel = filters.hasPendingPapers
    ? "الأوراق المعلقة"
    : filters.advanceStatus
      ? (advanceStatuses.nameOf(filters.advanceStatus) ?? filters.advanceStatus)
      : undefined;

  // ---- موقف المستخلص counters (third row): معلق · كتيبة · لواء · ادارة · هيئة · مركزية ----
  // ?statementStatus= (click again → clear); counts from the page, the last ones kept while loading.
  const statementCounts = listQuery.data?.statementCounts;
  const statementCountOf = useMemo(() => {
    if (!statementCounts) return undefined;
    const byStatus = new Map(statementCounts.statuses.map((entry) => [entry.status, entry.count]));
    return (status: string) => byStatus.get(status) ?? 0;
  }, [statementCounts]);
  const statementItems = statementStatuses.options
    .filter((option) => isStatementCounterStatus(option))
    .map((option) => ({ value: option.value, label: option.label, count: statementCountOf?.(option.value) }));
  const chooseStatementStatus = (value: string | null) =>
    list.setFilter("statementStatus", value === filters.statementStatus ? null : value);

  // ---- طباعة / PDF: all rows for the current filters and sort → print view ----
  const printer = usePrintExport<ContractItem>();
  const print = () =>
    printer.print(
      // One-off, unsubscribed fetch: the rows are not kept in the store.
      () =>
        dispatch(
          contractApi.endpoints.exportContracts.initiate(
            { search: list.params.search, sortBy: list.sortBy, sortDir: list.sortDir, ...filters },
            { subscribe: false, forceRefetch: true }
          )
        ),
      (rows, printedAt) => ({
        title: "العقود",
        filters: activeFilters([
          ["رقم العقد", filters.contractNumber],
          ["المشروع", filterName(filters.projectId, projects, rows, (row) => row.projectName)],
          ["الشركة", filterName(filters.companyId, companies, rows, (row) => row.companyName)],
          ["موقف العقد", filters.status ? (statuses.nameOf(filters.status) ?? filters.status) : undefined],
          ["مرحلة العقد", filters.stage ? (stages.nameOf(filters.stage) ?? filters.stage) : undefined],
          ["السلفة", advanceFilterLabel],
          [
            "موقف المستخلص",
            filters.statementStatus
              ? (statementStatuses.nameOf(filters.statementStatus) ?? filters.statementStatus)
              : undefined,
          ],
          ["البحث", list.search ? `"${list.search}"` : undefined],
        ]),
        columns: printColumns(stages, statuses, advanceStatuses),
        rows,
        total: {
          label: "إجمالي قيمة العقود",
          value: formatAmount(rows.reduce((sum, row) => sum + (row.contractValue ?? 0), 0)),
        },
        printedAt,
      })
    );

  const totalValue = query.currentData?.totalValue;
  const totalAdvanceValue = query.currentData?.totalAdvanceValue;

  return (
    <ListPage
      title="العقود"
      list={list}
      query={query}
      columns={columns}
      itemLabel={contractLabel}
      minWidthClassName="min-w-[2400px]"
      canWrite={canWrite}
      onAdd={() => setDialog({ mode: "create" })}
      onEdit={(contract) => setDialog({ mode: "edit", contract })}
      onDelete={(contract) => removeContract(contract.id)}
      searchPlaceholder="بحث شامل"
      headerActions={printer.button(print)}
      topBar={
        statuses.loadError ? (
          <p className="text-sm text-danger">تعذر تحميل حالات العقود</p>
        ) : (
          <div className="flex flex-col items-start gap-2">
            <SegmentedFilter
              label="تصفية حسب موقف العقد"
              items={counterItems}
              value={filters.status}
              onChange={(value) => list.setFilter("status", value)}
            />
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold text-foreground">السلفة</span>
              <SegmentedFilter
                label="تصفية حسب السلفة"
                items={advanceItems}
                value={advanceChoice}
                onChange={chooseAdvance}
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold text-foreground">موقف المستخلص</span>
              {statementStatuses.loadError ? (
                <p className="text-sm text-danger">تعذر تحميل حالات المستخلصات</p>
              ) : (
                <SegmentedFilter
                  label="تصفية حسب موقف المستخلص"
                  items={statementItems}
                  value={filters.statementStatus}
                  onChange={chooseStatementStatus}
                />
              )}
            </div>
          </div>
        )
      }
      toolbar={
        <>
          <TextFilter
            label="رقم العقد"
            ltr
            value={filters.contractNumber}
            onChange={(value) => list.setFilter("contractNumber", value)}
          />
          <OptionFilter
            label="اسم المشروع"
            allLabel="كل المشاريع"
            list={projects}
            value={filters.projectId}
            onChange={(value) => list.setFilter("projectId", value)}
          />
          <OptionFilter
            label="اسم الشركة"
            allLabel="كل الشركات"
            list={companies}
            value={filters.companyId}
            onChange={(value) => list.setFilter("companyId", value)}
          />
          <SelectFilter
            label="مرحلة العقد"
            allLabel="كل المراحل"
            list={stages}
            value={filters.stage}
            onChange={(value) => list.setFilter("stage", value)}
          />
        </>
      }
      countLabel="عدد العقود"
      summary={
        totalValue !== undefined && (
          <div className="flex flex-wrap gap-x-6 gap-y-1">
            <p className="text-sm text-muted-foreground">
              إجمالي قيمة العقود:{" "}
              <span className="font-semibold text-foreground">
                <AmountText value={totalValue} />
              </span>
            </p>
            <p className="text-sm text-muted-foreground">
              إجمالي السلف:{" "}
              <span className="font-semibold text-foreground">
                <AmountText value={totalAdvanceValue} />
              </span>
            </p>
          </div>
        )
      }
    >
      {dialog && (
        <ContractFormDialog
          key={dialog.mode === "edit" ? dialog.contract.id : "create"}
          contract={dialog.mode === "edit" ? dialog.contract : undefined}
          prefill={
            dialog.mode === "create" ? { projectId: filters.projectId, companyId: filters.companyId } : undefined
          }
          onClose={() => setDialog(null)}
          // Keep المشروع / الشركة (they pre-fill the next add); the new contract may not match the others.
          onCreated={() => list.showNewest({ keepFilters: ["projectId", "companyId"] })}
        />
      )}
      {viewing && (
        <ContractAttachmentsDialog
          contract={viewing.contract}
          category={viewing.category}
          canWrite={canWrite}
          onClose={() => setViewing(null)}
        />
      )}
      {printer.view}
    </ListPage>
  );
}

/** العقود (/contracts): status / السلفة / المستخلص counters, filters, totals, print, add/edit (papers, statements). */
export default function ContractsPage() {
  return (
    <ListSuspense>
      <ContractsPageContent />
    </ListSuspense>
  );
}
