"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import type { ListParams, SortDir } from "@/types/paged";

export type ListStateOptions<TSortBy extends string> = {
  pageSize: number;
  /** Columns the API can sort by; other `?sortBy=` values fall back to the default. */
  sortColumns: readonly TSortBy[];
  defaultSortBy: TSortBy;
  defaultSortDir: SortDir;
  /** Columns whose first click sorts A→Z (text); the others start newest first. */
  ascendingFirst?: readonly TSortBy[];
};

export type ListState<TSortBy extends string> = {
  /** Params for the list query (from the URL). */
  params: ListParams<TSortBy>;
  /** Search applied to the list (`?search=`); `searchText` is what is typed in the box. */
  search: string;
  page: number;
  sortBy: TSortBy;
  sortDir: SortDir;
  searchText: string;
  setSearchText: (value: string) => void;
  clearSearch: () => void;
  setPage: (page: number) => void;
  /** Header click: same column flips the direction, a new column starts with its default direction. */
  toggleSort: (column: TSortBy) => void;
  /** After a create: clear search, page 1, default sort (createdAt desc) → the new row is on top. */
  showNewest: () => void;
};

function parsePage(value: string | null) {
  const page = Number(value);
  return Number.isInteger(page) && page > 0 ? page : 1;
}

/**
 * List state kept in the URL query string (`?search=&page=&sortBy=&sortDir=`), so refresh and
 * back/forward keep it. Search is debounced (400 ms) and resets to page 1.
 * Uses `useSearchParams`, so render it under a Suspense boundary (`ListSuspense`).
 */
export function useListState<TSortBy extends string>({
  pageSize,
  sortColumns,
  defaultSortBy,
  defaultSortDir,
  ascendingFirst = [],
}: ListStateOptions<TSortBy>): ListState<TSortBy> {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();

  // ---- URL state ----
  const urlSearch = searchParams.get("search") ?? "";
  const page = parsePage(searchParams.get("page"));
  const sortByParam = searchParams.get("sortBy") as TSortBy | null;
  const sortBy = sortByParam && sortColumns.includes(sortByParam) ? sortByParam : defaultSortBy;
  const sortDirParam = searchParams.get("sortDir");
  const sortDir: SortDir = sortDirParam === "asc" || sortDirParam === "desc" ? sortDirParam : defaultSortDir;

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

  // Follow ?search= when it changes from outside (back/forward, a link to this route).
  // Our own updates set the URL to the debounced value, so those are skipped and typing
  // that continued after the debounce is not overwritten. (State adjusted during render,
  // not in an effect, so there is no extra render pass or loop.)
  const [prevUrlSearch, setPrevUrlSearch] = useState(urlSearch);
  if (urlSearch !== prevUrlSearch) {
    setPrevUrlSearch(urlSearch);
    if (urlSearch !== debouncedSearch) setSearchText(urlSearch);
  }

  useEffect(() => {
    if (lastDebounced.current === debouncedSearch) return;
    lastDebounced.current = debouncedSearch;
    if (debouncedSearch !== urlSearch) updateQuery({ search: debouncedSearch, page: null });
  }, [debouncedSearch, urlSearch, updateQuery]);

  const clearSearch = useCallback(() => {
    setSearchText("");
    if (urlSearch) updateQuery({ search: null, page: null });
  }, [urlSearch, updateQuery]);

  const setPage = useCallback((next: number) => updateQuery({ page: next }), [updateQuery]);

  const toggleSort = useCallback(
    (column: TSortBy) => {
      const nextDir: SortDir =
        column === sortBy ? (sortDir === "asc" ? "desc" : "asc") : ascendingFirst.includes(column) ? "asc" : "desc";
      updateQuery({ sortBy: column, sortDir: nextDir, page: null });
    },
    [sortBy, sortDir, ascendingFirst, updateQuery]
  );

  const showNewest = useCallback(() => {
    setSearchText("");
    updateQuery({ search: null, page: null, sortBy: null, sortDir: null });
  }, [updateQuery]);

  const params = useMemo<ListParams<TSortBy>>(
    () => ({ search: urlSearch || undefined, page, pageSize, sortBy, sortDir }),
    [urlSearch, page, pageSize, sortBy, sortDir]
  );

  return {
    params,
    search: urlSearch,
    page,
    sortBy,
    sortDir,
    searchText,
    setSearchText,
    clearSearch,
    setPage,
    toggleSort,
    showNewest,
  };
}
