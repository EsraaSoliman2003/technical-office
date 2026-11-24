"use client";

import {
  createContext,
  Suspense,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import { AlertTriangle, Pencil, Plus, Search, SearchX, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import Pagination from "@/components/Pagination";
import { Button, ConfirmDialog, EmptyState, Input, Spinner } from "@/components/ui";
import type { PagedResult } from "@/types/paged";
import { getFailureMessage, isApiFailure, NO_PERMISSION_MESSAGE } from "@/utils/apiFailure";
import { useFocusAfterRemoval } from "./formHelpers";
import ListTable, { type ListColumn, type RowAction } from "./ListTable";
import type { ListState } from "./useListState";

/** The parts of an RTK Query list result the page needs. */
export type ListQueryResult<T> = {
  currentData?: PagedResult<T>;
  isFetching: boolean;
  isError: boolean;
  error?: unknown;
  refetch: () => unknown;
};

const FallbackFocusContext = createContext<RefObject<HTMLElement | null> | undefined>(undefined);

/**
 * For dialogs rendered inside `ListPage`: where focus goes when a dialog closes and its opener
 * was removed (e.g. a row's button) — the "إضافة" button or the table card. Pass it to `Modal`.
 */
export function useListFallbackFocus() {
  return useContext(FallbackFocusContext);
}

type ListPageProps<T extends { id: string }, TSortBy extends string> = {
  title: string;
  list: ListState<TSortBy>;
  query: ListQueryResult<T>;
  columns: ListColumn<T, TSortBy>[];
  /** Name of a row, used in aria-labels and the delete confirmation. */
  itemLabel: (item: T) => string;
  minWidthClassName?: string;
  /** Admin/Manager: show "إضافة" and the edit/delete actions. */
  canWrite: boolean;
  onAdd?: () => void;
  onEdit?: (item: T) => void;
  /** Runs after the user confirms (an RTK mutation trigger). The page shows the toasts and moves focus. */
  onDelete?: (item: T) => PromiseLike<{ error?: unknown }>;
  /** Extra controls next to the search box (e.g. a status filter). */
  toolbar?: ReactNode;
  /** Search box placeholder (default "بحث..."). */
  searchPlaceholder?: string;
  /** Extra buttons next to "إضافة" (e.g. print). */
  headerActions?: ReactNode;
  /** Shown under the table next to "عدد النتائج" (e.g. a total). */
  summary?: ReactNode;
  /** Dialogs of the page (they can read the focus fallback with `useListFallbackFocus`). */
  children?: ReactNode;
};

/**
 * Shell of a paged list screen: title + "إضافة", search box, table (or skeleton / empty / error state),
 * "عدد النتائج" + pagination, delete confirmation. List state comes from `useListState` (URL).
 */
export default function ListPage<T extends { id: string }, TSortBy extends string>({
  title,
  list,
  query,
  columns,
  itemLabel,
  minWidthClassName,
  canWrite,
  onAdd,
  onEdit,
  onDelete,
  toolbar,
  searchPlaceholder = "بحث...",
  headerActions,
  summary,
  children,
}: ListPageProps<T, TSortBy>) {
  const { currentData, isFetching, isError, error, refetch } = query;
  const items = currentData?.items ?? [];
  const totalCount = currentData?.totalCount ?? 0;
  const totalPages = currentData?.totalPages ?? 0;
  const { page, setPage } = list;

  // Page past the end (old bookmark, rows deleted here or by someone else) → last valid page.
  // (With no rows at all, page 1 is the last valid page.)
  const lastValidPage = Math.max(totalPages, 1);
  const pageOutOfRange = currentData !== undefined && page > lastValidPage;
  useEffect(() => {
    if (pageOutOfRange) setPage(lastValidPage);
  }, [pageOutOfRange, lastValidPage, setPage]);

  // ---- Delete ----
  const [deleting, setDeleting] = useState<T | null>(null);
  const [removing, setRemoving] = useState(false);
  const deletingRef = useRef(false); // prevents a double delete (double click / Enter before re-render)

  const confirmDelete = async () => {
    if (!deleting || !onDelete || deletingRef.current) return;
    deletingRef.current = true;
    setRemoving(true);
    let result;
    try {
      result = await onDelete(deleting);
    } finally {
      deletingRef.current = false;
      setRemoving(false);
    }
    setDeleting(null);

    if (result.error) {
      const failure = isApiFailure(result.error) ? result.error : undefined;
      toast.error(failure?.status === 403 ? NO_PERMISSION_MESSAGE : getFailureMessage(failure));
      return;
    }

    toast.success("تم الحذف بنجاح");
    markRemoved(deleting.id);
    // If this page is now empty, the out-of-range check above moves back a page.
  };

  // Focus target when the focused element disappears: the "إضافة" button, else the table card.
  const addButtonRef = useRef<HTMLButtonElement>(null);
  const tableCardRef = useRef<HTMLDivElement>(null);
  const showAdd = canWrite && onAdd !== undefined;
  const fallbackFocusRef = showAdd ? addButtonRef : tableCardRef;

  // The confirmation returns focus to the row's delete button, which is removed once the list refreshes.
  const currentIds = useMemo(() => currentData?.items.map((item) => item.id), [currentData]);
  const markRemoved = useFocusAfterRemoval(currentIds, fallbackFocusRef);

  // ---- Row actions ----
  const actions: RowAction<T>[] = [];
  if (canWrite && onEdit) actions.push({ key: "edit", label: "تعديل", icon: Pencil, onClick: onEdit });
  if (canWrite && onDelete) {
    actions.push({ key: "delete", label: "حذف", icon: Trash2, tone: "danger", onClick: setDeleting });
  }

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
    const filtered = list.search !== "" || Object.values(list.filters).some(Boolean);
    body = filtered ? (
      <EmptyState icon={SearchX} title="لا توجد نتائج للبحث" />
    ) : (
      <EmptyState title="لا توجد بيانات" />
    );
  } else {
    body = (
      <ListTable
        items={items}
        columns={columns}
        actions={actions}
        itemLabel={itemLabel}
        sortBy={list.sortBy}
        sortDir={list.sortDir}
        onSort={list.toggleSort}
        minWidthClassName={minWidthClassName}
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
        {(showAdd || headerActions) && (
          <div className="flex flex-wrap items-center gap-2">
            {headerActions}
            {showAdd && (
              <Button ref={addButtonRef} onClick={onAdd}>
                <Plus size={18} aria-hidden="true" />
                إضافة
              </Button>
            )}
          </div>
        )}
      </div>

      <div
        ref={tableCardRef}
        role="region"
        tabIndex={-1}
        aria-label={title}
        className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm"
      >
        <div className="flex flex-wrap items-center gap-3 border-b border-border p-4">
          <div className="relative w-full max-w-md">
            <Search
              size={18}
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              type="search"
              aria-label={`بحث في ${title}`}
              placeholder={searchPlaceholder}
              value={list.searchText}
              onChange={(event) => list.setSearchText(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Escape" && list.searchText) {
                  event.preventDefault();
                  list.clearSearch();
                }
              }}
              className="ps-10 pe-10 [&::-webkit-search-cancel-button]:hidden"
            />
            {list.searchText && (
              <button
                type="button"
                onClick={list.clearSearch}
                aria-label="مسح البحث"
                title="مسح البحث"
                className="absolute top-1/2 left-2 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground hover:bg-surface-muted hover:text-foreground"
              >
                <X size={16} aria-hidden="true" />
              </button>
            )}
          </div>
          {toolbar}
        </div>

        {body}

        {currentData && totalCount > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-1">
              <p className="text-sm text-muted-foreground">
                عدد النتائج: <span className="font-semibold text-foreground tabular-nums">{totalCount}</span>
              </p>
              {summary}
            </div>
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} disabled={isFetching} />
          </div>
        )}
      </div>

      <FallbackFocusContext value={fallbackFocusRef}>{children}</FallbackFocusContext>

      <ConfirmDialog
        open={deleting !== null}
        loading={removing}
        message={deleting ? `هل أنت متأكد من حذف "${itemLabel(deleting)}"؟` : undefined}
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
        fallbackFocusRef={fallbackFocusRef}
      />
    </div>
  );
}

/** Suspense boundary for list screens (`useSearchParams` needs one in a static export). */
export function ListSuspense({ children }: { children: ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-20 text-primary-text">
          <Spinner size={32} />
        </div>
      }
    >
      {children}
    </Suspense>
  );
}
