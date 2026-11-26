"use client";

import { useCallback, useMemo, useState } from "react";
import { auditColumns } from "@/components/list/columns";
import ColumnValueFilter, { type ColumnFilterOption } from "@/components/list/ColumnValueFilter";
import { useCanWrite } from "@/components/list/formHelpers";
import ListPage, { ListSuspense } from "@/components/list/ListPage";
import type { ListColumn } from "@/components/list/ListTable";
import TextColumnFilter from "@/components/list/TextColumnFilter";
import { useListState, type ListStateOptions } from "@/components/list/useListState";
import { getLookup } from "@/lib/lookups";
import { useListLookupsQuery, useRemoveLookupMutation } from "@/rtk/endpoints/lookupApi";
import type { LookupDto, LookupResource, LookupSortBy } from "@/types/lookup";
import LookupFormDialog from "./LookupFormDialog";

export type LookupPageProps = {
  /** Lookup from `LOOKUPS`, e.g. "agencies" → /api/agencies (title and field label come from the list). */
  resource: LookupResource;
};

const LIST_OPTIONS: ListStateOptions<LookupSortBy> = {
  pageSize: 20,
  sortColumns: ["name", "createdAt", "updatedAt"],
  defaultSortBy: "createdAt",
  defaultSortDir: "desc",
  ascendingFirst: ["name"],
};

type DialogState = { mode: "create" } | { mode: "edit"; item: LookupDto } | null;
type NameFilterState = { key: string; values: string[] };

function LookupPageContent({ resource }: LookupPageProps) {
  const { title, fieldLabel } = getLookup(resource);
  const canWrite = useCanWrite();
  const list = useListState(LIST_OPTIONS);
  const query = useListLookupsQuery({ resource, ...list.params });
  const hasNameHeaderFilter =
    resource === "agencies" ||
    resource === "sectors" ||
    resource === "materials" ||
    resource === "project-types" ||
    resource === "factories" ||
    resource === "mixers" ||
    resource === "transport-companies";
  const pageItems = query.currentData?.items ?? [];
  const filterPageKey = `${resource}:${list.page}:${list.search}:${list.sortBy}:${list.sortDir}`;
  const [nameFilterState, setNameFilterState] = useState<NameFilterState>({
    key: filterPageKey,
    values: [],
  });
  const selectedNames = nameFilterState.key === filterPageKey ? nameFilterState.values : [];
  const updateNameFilter = useCallback(
    (values: string[]) => setNameFilterState({ key: filterPageKey, values }),
    [filterPageKey]
  );
  const filteredItems = useMemo(
    () => pageItems.filter((item) => !selectedNames.length || selectedNames.includes(item.name)),
    [pageItems, selectedNames]
  );
  const hasLocalFilters = selectedNames.length > 0;
  const filteredQuery = useMemo(
    () => ({
      ...query,
      currentData: query.currentData ? { ...query.currentData, items: filteredItems } : undefined,
    }),
    [filteredItems, query]
  );
  const nameFilterOptions = useMemo<ColumnFilterOption[]>(
    () =>
      Array.from(new Set(pageItems.map((item) => item.name)))
        .sort((a, b) => a.localeCompare(b, "ar"))
        .map((value) => ({ value, label: value })),
    [pageItems]
  );
  const [removeLookup] = useRemoveLookupMutation();
  const [dialog, setDialog] = useState<DialogState>(null);

  const columns = useMemo<ListColumn<LookupDto, LookupSortBy>[]>(
    () => [
      {
        key: "name",
        header: fieldLabel,
        headerControl: hasNameHeaderFilter ? (
          <TextColumnFilter
            label={`اسم ${fieldLabel}`}
            selectedValues={selectedNames}
            onChange={updateNameFilter}
            options={nameFilterOptions}
          />
        ) : undefined,
        sortKey: "name",
        className: "font-semibold text-foreground",
        cell: (item) => item.name,
      },
      ...auditColumns<LookupDto, LookupSortBy>({ createdAt: "createdAt", updatedAt: "updatedAt" }),
    ],
    [fieldLabel, hasNameHeaderFilter, nameFilterOptions, selectedNames, updateNameFilter]
  );

  return (
    <ListPage
      title={title}
      list={list}
      query={filteredQuery}
      columns={columns}
      itemLabel={(item) => item.name}
      showSearch={!hasNameHeaderFilter}
      hasLocalFilters={hasLocalFilters}
      summary={
        hasLocalFilters ? (
          <span className="text-sm text-muted-foreground">
            المعروض في الصفحة: {filteredItems.length} من {pageItems.length}
          </span>
        ) : undefined
      }
      canWrite={canWrite}
      onAdd={() => setDialog({ mode: "create" })}
      onEdit={(item) => setDialog({ mode: "edit", item })}
      onDelete={(item) => removeLookup({ resource, id: item.id })}
    >
      {dialog && (
        <LookupFormDialog
          key={dialog.mode === "edit" ? dialog.item.id : "create"}
          resource={resource}
          fieldLabel={fieldLabel}
          item={dialog.mode === "edit" ? dialog.item : undefined}
          onClose={() => setDialog(null)}
          onCreated={list.showNewest}
        />
      )}
    </ListPage>
  );
}

/**
 * Reusable screen for name-only lookups (list, search, sort, paginate, add, edit, delete),
 * built on the generic list block in `src/components/list`.
 * A new lookup: add it to `LOOKUPS` (src/lib/lookups.ts) and add a route file with `<LookupPage resource="..." />`.
 */
export default function LookupPage(props: LookupPageProps) {
  return (
    <ListSuspense>
      <LookupPageContent {...props} />
    </ListSuspense>
  );
}
