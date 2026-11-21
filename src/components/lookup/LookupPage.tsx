"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AlertTriangle, Plus, Search, SearchX, X } from "lucide-react";
import { toast } from "sonner";
import Pagination from "@/components/Pagination";
import { Button, ConfirmDialog, EmptyState, Input, Spinner } from "@/components/ui";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { getLookup } from "@/lib/lookups";
import { useAppSelector } from "@/rtk/hooks";
import { useListLookupsQuery, useRemoveLookupMutation } from "@/rtk/endpoints/lookupApi";
import type { LookupDto, LookupResource, LookupSortBy, SortDir } from "@/types/lookup";
import { getFailureMessage, isApiFailure, NO_PERMISSION_MESSAGE } from "@/utils/apiFailure";
import LookupFormDialog from "./LookupFormDialog";
import LookupTable from "./LookupTable";

export type LookupPageProps = {
  /** Lookup from `LOOKUPS`, e.g. "agencies" → /api/agencies (title and field label come from the list). */
  resource: LookupResource;
};

const PAGE_SIZE = 20;
const DEFAULT_SORT_BY: LookupSortBy = "createdAt";
const DEFAULT_SORT_DIR: SortDir = "desc";
const SORT_COLUMNS: LookupSortBy[] = ["name", "createdAt", "updatedAt"];

type DialogState = { mode: "create" } | { mode: "edit"; item: LookupDto } | null;

function parsePage(value: string | null) {
  const page = Number(value);
  return Number.isInteger(page) && page > 0 ? page : 1;
}

function LookupPageContent({ resource }: LookupPageProps) {
  const { title, fieldLabel } = getLookup(resource);
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const role = useAppSelector((state) => state.auth.role);
  const canWrite = role === "Admin" || role === "Manager";

  // ---- URL state (?search=&page=&sortBy=&sortDir=) ----
  const urlSearch = searchParams.get("search") ?? "";
  const page = parsePage(searchParams.get("page"));
  const sortByParam = searchParams.get("sortBy") as LookupSortBy | null;
  const sortBy = sortByParam && SORT_COLUMNS.includes(sortByParam) ? sortByParam : DEFAULT_SORT_BY;
  const sortDirParam = searchParams.get("sortDir");
  const sortDir: SortDir = sortDirParam === "asc" || sortDirParam === "desc" ? sortDirParam : DEFAULT_SORT_DIR;

  const updateQuery = useCallback(
    (changes: Record<string, string | number | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(changes)) {
        if (value === null || value === "") params.delete(key);
        else params.set(key, String(value));
      }
      if (params.get("page") === "1") params.delete("page");
      const base = pathname.endsWith("/") ? pathname : `${pathname}/`;
      const query = params.toString();
      router.replace(query ? `${base}?${query}` : base, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  // ---- Search (debounced, resets to page 1) ----
  const [searchText, setSearchText] = useState(urlSearch);
  const debouncedSearch = useDebouncedValue(searchText.trim(), 400);
  const lastDebounced = useRef(debouncedSearch);

  useEffect(() => {
    if (lastDebounced.current === debouncedSearch) return;
    lastDebounced.current = debouncedSearch;
    if (debouncedSearch !== urlSearch) updateQuery({ search: debouncedSearch, page: null });
  }, [debouncedSearch, urlSearch, updateQuery]);

  const clearSearch = () => {
    setSearchText("");
    if (urlSearch) updateQuery({ search: null, page: null });
  };

  // ---- Data ----
  const { currentData, isFetching, isError, error, refetch } = useListLookupsQuery({
    resource,
    search: urlSearch || undefined,
    page,
    pageSize: PAGE_SIZE,
    sortBy,
    sortDir,
  });
  const items = currentData?.items ?? [];
  const totalCount = currentData?.totalCount ?? 0;
  const totalPages = currentData?.totalPages ?? 0;

  // Page past the end (old bookmark, rows deleted here or by someone else) → last valid page.
  // (With no rows at all, page 1 is the last valid page.)
  const lastValidPage = Math.max(totalPages, 1);
  const pageOutOfRange = currentData !== undefined && page > lastValidPage;
  useEffect(() => {
    if (pageOutOfRange) updateQuery({ page: lastValidPage });
  }, [pageOutOfRange, lastValidPage, updateQuery]);

  const handleSort = (column: LookupSortBy) => {
    const nextDir: SortDir = column === sortBy ? (sortDir === "asc" ? "desc" : "asc") : column === "name" ? "asc" : "desc";
    updateQuery({ sortBy: column, sortDir: nextDir, page: null });
  };

  // ---- Add / edit ----
  const [dialog, setDialog] = useState<DialogState>(null);

  // ---- Delete ----
  const [deleting, setDeleting] = useState<LookupDto | null>(null);
  const [removeLookup, { isLoading: removing }] = useRemoveLookupMutation();

  const deletingRef = useRef(false); // prevents a double delete (double click / Enter before re-render)

  const confirmDelete = async () => {
    if (!deleting || deletingRef.current) return;
    deletingRef.current = true;
    let result;
    try {
      result = await removeLookup({ resource, id: deleting.id });
    } finally {
      deletingRef.current = false;
    }
    setDeleting(null);

    if ("error" in result) {
      const failure = isApiFailure(result.error) ? result.error : undefined;
      toast.error(failure?.status === 403 ? NO_PERMISSION_MESSAGE : getFailureMessage(failure));
      return;
    }

    toast.success("تم الحذف بنجاح");
    // If this page is now empty, the out-of-range check above moves back a page.
  };

  // ---- Render ----
  // While redirecting from an out-of-range page, show the skeleton instead of "no data".
  const showSkeleton = (!currentData && isFetching) || pageOutOfRange;
  const showError = !currentData && !isFetching && isError;

  let body;
  if (showError) {
    body = (
      <EmptyState
        icon={AlertTriangle}
        title="تعذر تحميل البيانات"
        description={getFailureMessage(isApiFailure(error) ? error : undefined)}
        action={
          <Button variant="secondary" onClick={() => refetch()}>
            إعادة المحاولة
          </Button>
        }
      />
    );
  } else if (!showSkeleton && items.length === 0) {
    body = urlSearch ? (
      <EmptyState icon={SearchX} title="لا توجد نتائج للبحث" />
    ) : (
      <EmptyState title="لا توجد بيانات" />
    );
  } else {
    body = (
      <LookupTable
        items={items}
        fieldLabel={fieldLabel}
        sortBy={sortBy}
        sortDir={sortDir}
        onSort={handleSort}
        canWrite={canWrite}
        onEdit={(item) => setDialog({ mode: "edit", item })}
        onDelete={setDeleting}
        loading={showSkeleton}
        refreshing={isFetching && !showSkeleton}
      />
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="flex items-center gap-3 text-2xl font-bold text-foreground">
          <span className="h-7 w-1.5 rounded-full bg-primary" aria-hidden="true" />
          {title}
        </h1>
        {canWrite && (
          <Button onClick={() => setDialog({ mode: "create" })}>
            <Plus size={18} aria-hidden="true" />
            إضافة
          </Button>
        )}
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
        <div className="border-b border-border p-4">
          <div className="relative max-w-md">
            <Search
              size={18}
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              type="search"
              aria-label={`بحث في ${title}`}
              placeholder="بحث..."
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Escape" && searchText) {
                  event.preventDefault();
                  clearSearch();
                }
              }}
              className="ps-10 pe-10 [&::-webkit-search-cancel-button]:hidden"
            />
            {searchText && (
              <button
                type="button"
                onClick={clearSearch}
                aria-label="مسح البحث"
                title="مسح البحث"
                className="absolute top-1/2 left-2 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground hover:bg-surface-muted hover:text-foreground"
              >
                <X size={16} aria-hidden="true" />
              </button>
            )}
          </div>
        </div>

        {body}

        {currentData && totalCount > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3">
            <p className="text-sm text-muted-foreground">
              عدد النتائج: <span className="font-semibold text-foreground tabular-nums">{totalCount}</span>
            </p>
            <Pagination
              page={page}
              totalPages={totalPages}
              onPageChange={(next) => updateQuery({ page: next })}
              disabled={isFetching}
            />
          </div>
        )}
      </div>

      {dialog && (
        <LookupFormDialog
          key={dialog.mode === "edit" ? dialog.item.id : "create"}
          resource={resource}
          fieldLabel={fieldLabel}
          item={dialog.mode === "edit" ? dialog.item : undefined}
          onClose={() => setDialog(null)}
        />
      )}

      <ConfirmDialog
        open={deleting !== null}
        loading={removing}
        message={deleting ? `هل أنت متأكد من حذف "${deleting.name}"؟` : undefined}
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}

/**
 * Reusable screen for name-only lookups (list, search, sort, paginate, add, edit, delete).
 * A new lookup: add it to `LOOKUPS` (src/lib/lookups.ts) and add a route file with `<LookupPage resource="..." />`.
 */
export default function LookupPage(props: LookupPageProps) {
  // useSearchParams needs a Suspense boundary in a static export.
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-20 text-primary-text">
          <Spinner size={32} />
        </div>
      }
    >
      <LookupPageContent {...props} />
    </Suspense>
  );
}
