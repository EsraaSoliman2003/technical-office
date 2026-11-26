"use client";

import { useEffect, useId, useMemo, useState, type ReactNode } from "react";
import { skipToken } from "@reduxjs/toolkit/query";
import { AlertTriangle, Printer, RefreshCw } from "lucide-react";
import { ADVANCE_COUNTER_STATUSES } from "@/components/contracts/labels";
import { ListSuspense } from "@/components/list/ListPage";
import { OptionFilter } from "@/components/list/OptionFilter";
import { useListState, type ListStateOptions } from "@/components/list/useListState";
import { useLabeledList, useOptionList, waitingForOptions } from "@/components/options/useOptionList";
import PrintView, { activeFilters, type PrintColumn, type PrintJob } from "@/components/print/PrintView";
import { isPendingStatementStatus, isStatementCounterStatus } from "@/components/statements/labels";
import { Button, EmptyState } from "@/components/ui";
import { useContractMetaQuery, useListContractsQuery } from "@/rtk/endpoints/contractApi";
import { useProjectOptionsQuery } from "@/rtk/endpoints/projectApi";
import { useStatementMetaQuery } from "@/rtk/endpoints/statementApi";
import { getFailureMessage, isApiFailure } from "@/utils/apiFailure";
import { ComingSoonTile, SkeletonTiles, SummaryTile, type SummaryTileData } from "./SummaryTile";

/** Only `?projectId=` is used; the list options are what `useListState` needs for it. */
const LIST_BASE: Omit<ListStateOptions<"createdAt">, "filterValues"> = {
  pageSize: 1,
  sortColumns: ["createdAt"],
  defaultSortBy: "createdAt",
  defaultSortDir: "desc",
};

const LETTER_TILES = ["الكل", "متابعة", "بدون متابعة"];

type Section = { title: string; tiles: SummaryTileData[] | undefined; skeletons: number };
type PrintRow = { id: string; label: string; count: string };

const PRINT_COLUMNS: PrintColumn<PrintRow>[] = [
  { header: "البند", cell: (row) => row.label },
  { header: "العدد", cell: (row) => <span dir="ltr">{row.count}</span> },
];

/** `/contracts/?…` keeping the project (and `/statements/` for all statements). */
function href(path: string, params: Record<string, string | undefined>) {
  const query = new URLSearchParams(
    Object.entries(params).flatMap(([key, value]) => (value ? [[key, value] as [string, string]] : []))
  ).toString();
  return query ? `${path}?${query}` : path;
}

/** Count per status (missing → 0). */
function countsOf(entries: { status: string; count: number }[] | undefined) {
  if (!entries) return undefined;
  const byStatus = new Map(entries.map((entry) => [entry.status, entry.count]));
  return (status: string) => byStatus.get(status) ?? 0;
}

const pad = (value: number) => String(value).padStart(2, "0");
const timeOf = (timestamp: number) => {
  const date = new Date(timestamp);
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

function SummarySection({ title, children }: { title: string; children: ReactNode }) {
  const id = useId();
  return (
    <section aria-labelledby={id} className="rounded-2xl border border-border bg-surface p-4 shadow-sm md:p-5">
      <h2 id={id} className="mb-4 flex items-center gap-2 text-base font-bold text-foreground">
        <span className="h-2 w-2 rotate-45 bg-accent" aria-hidden="true" />
        {title}
      </h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-8">{children}</div>
    </section>
  );
}

function DailySummaryContent() {
  const projects = useOptionList(useProjectOptionsQuery());
  const contractMeta = useContractMetaQuery();
  const statementMeta = useStatementMetaQuery();
  const statuses = useLabeledList(contractMeta.currentData?.statuses, contractMeta.isLoading, contractMeta.isError);
  const advanceStatuses = useLabeledList(
    contractMeta.currentData?.advanceStatuses,
    contractMeta.isLoading,
    contractMeta.isError
  );
  const statementStatuses = useLabeledList(
    statementMeta.currentData?.statuses,
    statementMeta.isLoading,
    statementMeta.isError
  );

  // ?projectId= synced like the other pages (an unknown id is dropped once the options load).
  const listOptions = useMemo<ListStateOptions<"createdAt">>(
    () => ({ ...LIST_BASE, filterValues: { projectId: projects.ids } }),
    [projects.ids]
  );
  const list = useListState(listOptions);
  const projectId = list.filters.projectId;
  const waiting = waitingForOptions([[projectId, projects]]);

  // One request feeds every section: the contracts list's counters for the project (one row only).
  const query = useListContractsQuery(
    waiting ? skipToken : { page: 1, pageSize: 1, sortBy: "createdAt", sortDir: "desc", projectId }
  );
  const { refetch } = query;
  const page = query.currentData;

  // Refetch when coming back to the window (the counters change during the day).
  useEffect(() => {
    if (waiting) return;
    const onFocus = () => void refetch();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [waiting, refetch]);

  // ---- Sections ----
  const statusCount = countsOf(page?.statusCounts.statuses);
  const advanceCount = countsOf(page?.advanceCounts.statuses);
  const statementCount = countsOf(page?.statementCounts.statuses);
  const keep = { projectId };

  const sections: Section[] = [
    {
      title: "موقف العقد",
      skeletons: 8,
      tiles: statuses.ids && [
        { key: "all", label: "الكل", count: page?.statusCounts.all, href: href("/contracts/", keep), neutral: true },
        // Every status from meta, in its order (new ones appear automatically).
        ...statuses.options.map((option) => ({
          key: option.value,
          label: option.label,
          count: statusCount?.(option.value),
          href: href("/contracts/", { status: option.value, ...keep }),
        })),
      ],
    },
    {
      title: "موقف السلفة",
      skeletons: 5,
      tiles: advanceStatuses.ids && [
        ...advanceStatuses.options
          .filter((option) => ADVANCE_COUNTER_STATUSES.includes(option.value))
          .map((option) => ({
            key: option.value,
            label: option.label,
            count: advanceCount?.(option.value),
            href: href("/contracts/", { advanceStatus: option.value, ...keep }),
          })),
        {
          key: "pendingPapers",
          label: "الأوراق المعلقة",
          count: page?.advanceCounts.pendingPapers,
          href: href("/contracts/", { hasPendingPapers: "true", ...keep }),
        },
      ],
    },
    {
      title: "موقف المستخلص",
      skeletons: 6,
      tiles: statementStatuses.ids && [
        {
          key: "all",
          label: "الكل",
          // Every statement (incl. معلق and تم الصرف).
          count: page?.statementCounts.statuses.reduce((sum, entry) => sum + entry.count, 0),
          href: "/statements/",
          neutral: true,
        },
        ...statementStatuses.options
          .filter((option) => isStatementCounterStatus(option) && !isPendingStatementStatus(option))
          .map((option) => ({
            key: option.value,
            label: option.label,
            count: statementCount?.(option.value),
            href: href("/contracts/", { statementStatus: option.value, ...keep }),
          })),
      ],
    },
  ];

  // ---- طباعة / PDF: the four sections as tables ----
  const [printJob, setPrintJob] = useState<PrintJob<PrintRow> | null>(null);
  const printable = Boolean(page) && sections.every((section) => section.tiles);
  const print = () => {
    const groups = sections.map((section) => ({
      title: section.title,
      rows: (section.tiles ?? []).map((tile) => ({
        id: `${section.title}-${tile.key}`,
        label: tile.label,
        count: String(tile.count ?? "—"),
      })),
    }));
    groups.push({
      title: "موقف الجوابات",
      rows: LETTER_TILES.map((label) => ({ id: `letters-${label}`, label, count: "قريبًا" })),
    });
    setPrintJob({
      title: "التمام اليومي",
      filters: activeFilters([["المشروع", projectId ? (projects.nameOf(projectId) ?? projectId) : undefined]]),
      columns: PRINT_COLUMNS,
      rows: [],
      groups,
      printedAt: new Date().toISOString(),
    });
  };

  const metaFailed = contractMeta.isError || statementMeta.isError;
  const failed = (query.isError && !page) || metaFailed;
  const failure = isApiFailure(query.error) ? query.error : undefined;
  const retry = () => {
    if (!waiting) void refetch();
    if (contractMeta.isError) void contractMeta.refetch();
    if (statementMeta.isError) void statementMeta.refetch();
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="flex items-center gap-3 text-2xl font-bold text-foreground">
          <span className="h-7 w-1.5 rounded-full bg-primary" aria-hidden="true" />
          التمام اليومي
        </h1>
        <div className="flex flex-wrap items-center gap-2">
          <OptionFilter
            label="اسم المشروع"
            allLabel="كل المشاريع"
            list={projects}
            value={projectId}
            onChange={(value) => list.setFilter("projectId", value)}
          />
          <Button variant="secondary" onClick={print} disabled={!printable}>
            <Printer size={18} aria-hidden="true" />
            طباعة / PDF
          </Button>
        </div>
      </div>

      <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground" aria-live="polite">
        {query.fulfilledTimeStamp && (
          <span>
            آخر تحديث: <span dir="ltr">{timeOf(query.fulfilledTimeStamp)}</span>
          </span>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => void refetch()}
          disabled={waiting}
          loading={query.isFetching}
          aria-label="تحديث الأرقام"
          title="تحديث"
        >
          {!query.isFetching && <RefreshCw size={16} aria-hidden="true" />}
        </Button>
      </div>

      {failed ? (
        <EmptyState
          icon={AlertTriangle}
          title="تعذر تحميل التمام اليومي"
          description={metaFailed ? "تعذر تحميل الحالات" : getFailureMessage(failure)}
          action={
            <Button variant="secondary" onClick={retry}>
              إعادة المحاولة
            </Button>
          }
        />
      ) : (
        <div className="space-y-5" aria-busy={query.isFetching}>
          {sections.map((section) => (
            <SummarySection key={section.title} title={section.title}>
              {section.tiles ? (
                section.tiles.map((tile) => <SummaryTile key={tile.key} tile={tile} />)
              ) : (
                <SkeletonTiles count={section.skeletons} />
              )}
            </SummarySection>
          ))}
          {/* Letters are not built yet: the section is kept so it plugs in then. */}
          <SummarySection title="موقف الجوابات">
            {LETTER_TILES.map((label) => (
              <ComingSoonTile key={label} label={label} />
            ))}
          </SummarySection>
        </div>
      )}

      {printJob && <PrintView key={printJob.printedAt} job={printJob} onDone={() => setPrintJob(null)} />}
    </div>
  );
}

/** التمام اليومي (/daily-summary): the contracts' counters per section, for all projects or one. */
export default function DailySummaryPage() {
  return (
    <ListSuspense>
      <DailySummaryContent />
    </ListSuspense>
  );
}
