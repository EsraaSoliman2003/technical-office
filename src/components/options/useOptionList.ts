"use client";

import { useMemo } from "react";
import type { ComboboxOption } from "@/components/ui";
import type { NamedOption } from "@/types/options";

export type OptionList = {
  options: ComboboxOption[];
  /** Known ids; undefined until loaded (or when loading failed). */
  ids: string[] | undefined;
  loading: boolean;
  loadError: boolean;
  /** Name of an id, if it is in the list. */
  nameOf: (id: string | undefined | null) => string | undefined;
};

/**
 * An `{ id, name }` options query (`/api/{…}/options`) as Combobox options. `extraId`/`extraName`:
 * the edited record's own value, so its name shows before the list loads (or if it is missing).
 */
export function useOptionList(
  result: { currentData?: NamedOption[]; isLoading: boolean; isError: boolean },
  extraId?: string | null,
  extraName?: string | null
): OptionList {
  const { currentData, isLoading, isError } = result;
  return useMemo(() => {
    const list = [...(currentData ?? [])];
    if (extraId && extraName && !list.some((option) => option.id === extraId)) {
      list.push({ id: extraId, name: extraName });
    }
    const names = new Map(list.map((option) => [option.id, option.name]));
    return {
      options: list.map((option) => ({ value: option.id, label: option.name })),
      ids: currentData?.map((option) => option.id),
      loading: isLoading,
      loadError: isError,
      nameOf: (id) => (id ? names.get(id) : undefined),
    };
  }, [currentData, isLoading, isError, extraId, extraName]);
}

/**
 * True while a filter has a value whose option list is still loading: skip the list query until
 * then, so an unknown (deleted) id is dropped from the URL first. A list that failed doesn't block.
 */
export function waitingForOptions(entries: [value: string | undefined, list: OptionList][]) {
  return entries.some(([value, list]) => Boolean(value) && list.loading);
}

/** A filtered id's name for labels: from its option list, else from a row (all rows match the filter). */
export function filterName<T>(
  id: string | undefined,
  list: OptionList,
  rows: readonly T[] | undefined,
  nameOfRow: (row: T) => string | null | undefined
): string | undefined {
  if (!id) return undefined;
  return list.nameOf(id) ?? (rows?.[0] ? (nameOfRow(rows[0]) ?? undefined) : undefined);
}
