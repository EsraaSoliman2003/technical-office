"use client";

import { useCallback, useMemo, useState } from "react";
import { Paperclip } from "lucide-react";
import { auditColumns } from "@/components/list/columns";
import ColumnValueFilter, { type ColumnFilterOption } from "@/components/list/ColumnValueFilter";
import { useCanWrite } from "@/components/list/formHelpers";
import ListPage, { ListSuspense } from "@/components/list/ListPage";
import type { ListColumn } from "@/components/list/ListTable";
import { useListState, type ListStateOptions } from "@/components/list/useListState";
import { useListCompaniesQuery, useRemoveCompanyMutation } from "@/rtk/endpoints/companyApi";
import type { CompanyListItemDto, CompanySortBy } from "@/types/company";
import CompanyAttachmentsDialog from "./CompanyAttachmentsDialog";
import CompanyFormDialog from "./CompanyFormDialog";

const LIST_OPTIONS: ListStateOptions<CompanySortBy> = {
  pageSize: 20,
  sortColumns: ["name", "createdAt", "updatedAt"],
  defaultSortBy: "createdAt",
  defaultSortDir: "desc",
  ascendingFirst: ["name"],
};

type DialogState = { mode: "create" } | { mode: "edit"; item: CompanyListItemDto } | null;
type CompanyFilterKey = "name" | "commercialRegister";
type CompanyFilters = Partial<Record<CompanyFilterKey, string[]>>;

function getCompanyFilterValue(item: CompanyListItemDto, key: CompanyFilterKey) {
  return key === "name" ? item.name : item.commercialRegister || "—";
}

function getCompanyFilterOptions(items: CompanyListItemDto[], key: CompanyFilterKey): ColumnFilterOption[] {
  return Array.from(new Set(items.map((item) => getCompanyFilterValue(item, key))))
    .sort((a, b) => a.localeCompare(b, "ar"))
    .map((value) => ({ value, label: value }));
}

/** Register / mobile: left-to-right so "91/413" and "01272611123" read correctly. */
function LtrValue({ value }: { value: string | null }) {
  if (!value) return "—";
  return (
    <span dir="ltr" className="tabular-nums">
      {value}
    </span>
  );
}

function CompaniesPageContent() {
  const canWrite = useCanWrite();
  const list = useListState(LIST_OPTIONS);
  const query = useListCompaniesQuery(list.params);
  const [removeCompany] = useRemoveCompanyMutation();
  const [dialog, setDialog] = useState<DialogState>(null);
  const [viewing, setViewing] = useState<CompanyListItemDto | null>(null);
  const pageItems = query.currentData?.items ?? [];
  const filterPageKey = `${list.page}:${list.search}:${list.sortBy}:${list.sortDir}`;
  const [pageFilterState, setPageFilterState] = useState<{ key: string; filters: CompanyFilters }>({
    key: filterPageKey,
    filters: {},
  });
  const localFilters: CompanyFilters =
    pageFilterState.key === filterPageKey ? pageFilterState.filters : {};
  const updateLocalFilter = useCallback(
    (key: CompanyFilterKey, values: string[]) => {
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
        (Object.keys(localFilters) as CompanyFilterKey[]).every((key) => {
          const selected = localFilters[key];
          return !selected?.length || selected.includes(getCompanyFilterValue(item, key));
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

  const columns = useMemo<ListColumn<CompanyListItemDto, CompanySortBy>[]>(
    () => {
      const filterControl = (key: CompanyFilterKey, label: string) => {
        const options = getCompanyFilterOptions(pageItems, key);
        return (
          <ColumnValueFilter
            label={label}
            options={options}
            selectedValues={localFilters[key] ?? []}
            onChange={(values) => updateLocalFilter(key, values)}
          />
        );
      };

      return [
        {
          key: "name",
          header: "الشركة",
          headerControl: filterControl("name", "الشركة"),
          sortKey: "name",
          className: "font-semibold text-foreground",
          cell: (item) => item.name,
        },
        {
          key: "commercialRegister",
          header: "السجل التجاري",
          headerControl: filterControl("commercialRegister", "السجل التجاري"),
          className: "whitespace-nowrap text-foreground",
          cell: (item) => <LtrValue value={item.commercialRegister} />,
        },
        {
          key: "mobile",
          header: "الموبايل",
          className: "whitespace-nowrap text-foreground",
          cell: (item) => <LtrValue value={item.mobile} />,
        },
        {
          key: "attachments",
          header: "المرفقات",
          className: "py-1.5 whitespace-nowrap text-muted-foreground",
          cell: (item) =>
            item.attachmentCount > 0 ? (
              <button
                type="button"
                onClick={() => setViewing(item)}
                aria-label={`عرض مرفقات ${item.name} (${item.attachmentCount})`}
                title="عرض المرفقات"
                className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 font-semibold text-foreground hover:border-primary/40 hover:bg-primary-soft hover:text-primary-text"
              >
                <Paperclip size={15} aria-hidden="true" />
                <span className="tabular-nums">{item.attachmentCount}</span>
              </button>
            ) : (
              "—"
            ),
        },
        ...auditColumns<CompanyListItemDto, CompanySortBy>({ createdAt: "createdAt", updatedAt: "updatedAt" }),
      ];
    },
    [localFilters, pageItems, setViewing, updateLocalFilter]
  );

  return (
    <ListPage
      title="الشركات"
      list={list}
      query={filteredQuery}
      columns={columns}
      itemLabel={(item) => item.name}
      minWidthClassName="min-w-[1080px]"
      canWrite={canWrite}
      showSearch={false}
      onAdd={() => setDialog({ mode: "create" })}
      onEdit={(item) => setDialog({ mode: "edit", item })}
      onDelete={(item) => removeCompany(item.id)}
      hasLocalFilters={hasLocalFilters}
      summary={
        hasLocalFilters ? (
          <span className="text-sm text-muted-foreground">
            المعروض في الصفحة: {filteredItems.length} من {pageItems.length}
          </span>
        ) : undefined
      }
    >
      {dialog && (
        <CompanyFormDialog
          key={dialog.mode === "edit" ? dialog.item.id : "create"}
          company={dialog.mode === "edit" ? dialog.item : undefined}
          onClose={() => setDialog(null)}
          onCreated={list.showNewest}
        />
      )}
      {viewing && (
        <CompanyAttachmentsDialog company={viewing} canWrite={canWrite} onClose={() => setViewing(null)} />
      )}
    </ListPage>
  );
}

/** الشركات (/data/companies): list, sort, paginate, add/edit/delete, attachments. */
export default function CompaniesPage() {
  return (
    <ListSuspense>
      <CompaniesPageContent />
    </ListSuspense>
  );
}
