"use client";

import { useCallback, useEffect, useRef, type RefObject } from "react";
import { useAppSelector } from "@/rtk/hooks";
import { getFailureMessage, type ApiFailure } from "@/utils/apiFailure";

/** Admin and Manager can add/edit/delete; Employee is read-only. */
export function useCanWrite() {
  const role = useAppSelector((state) => state.auth.role);
  return role === "Admin" || role === "Manager";
}

/** F2 = save (like the old system). Calls the latest `onSave` while the component is mounted. */
export function useSaveShortcut(onSave: () => void) {
  const onSaveRef = useRef(onSave);
  useEffect(() => {
    onSaveRef.current = onSave;
  });

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "F2") return;
      event.preventDefault();
      onSaveRef.current();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);
}

/**
 * True when `element` is inside the top-most open dialog (dialogs are portaled to <body> in
 * opening order). Use it to ignore F2 while a confirmation is open over a form dialog.
 */
export function isInTopDialog(element: Element | null) {
  const dialogs = document.querySelectorAll('[role="dialog"][aria-modal="true"]');
  const top = dialogs[dialogs.length - 1];
  return element !== null && top !== undefined && top.contains(element);
}

/**
 * After deleting a row: a dialog returns focus to the row's delete button, which is removed once
 * the data refreshes. When that happens (focus fell to <body>), focus `fallbackRef` instead.
 * `currentIds` must be memoized. Returns `markRemoved(id)` to call after a successful delete.
 */
export function useFocusAfterRemoval(
  currentIds: readonly string[] | undefined,
  fallbackRef: RefObject<HTMLElement | null> | undefined
) {
  const removedIdRef = useRef<string | null>(null);
  useEffect(() => {
    const removedId = removedIdRef.current;
    if (!removedId || !currentIds || currentIds.includes(removedId)) return;
    removedIdRef.current = null;
    const active = document.activeElement;
    if (!active || active === document.body) fallbackRef?.current?.focus();
  }, [currentIds, fallbackRef]);

  return useCallback((id: string) => {
    removedIdRef.current = id;
  }, []);
}

/**
 * Puts ProblemDetails `errors` (400/409) under the matching form fields (keys compared case-insensitively).
 * When no key matches a field, all messages go under `fallbackField` (if given).
 * Returns false when nothing was shown (the caller should show a toast instead).
 */
export function applyServerFieldErrors<TField extends string>(
  failure: ApiFailure,
  fields: readonly TField[],
  setError: (field: TField, message: string, focus: boolean) => void,
  fallbackField?: TField
): boolean {
  const entries = Object.entries(failure.fieldErrors);
  let shown = 0;
  for (const field of fields) {
    const messages = entries
      .filter(([key]) => key.toLowerCase() === field.toLowerCase())
      .flatMap(([, value]) => value);
    if (messages.length > 0) setError(field, messages.join(" "), shown++ === 0);
  }
  if (shown > 0) return true;
  if (fallbackField === undefined) return false;

  const message = entries.flatMap(([, value]) => value).join(" ") || getFailureMessage(failure);
  setError(fallbackField, message, true);
  return true;
}
