"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  attachmentCountMessage,
  MAX_ATTACHMENTS,
  MAX_UPLOAD_TOTAL_BYTES,
  UPLOAD_TOTAL_MESSAGE,
  validateAttachment,
} from "@/lib/attachments";
import type { ApiFailure } from "@/utils/apiFailure";

export type PendingFile = { key: string; file: File };

export type PendingFiles = {
  pending: PendingFile[];
  /** Files to upload, in the order they are sent. */
  files: File[];
  existingCount: number;
  maxCount: number;
  add: (fileList: FileList | null) => void;
  remove: (key: string) => void;
  clear: () => void;
  /** Validation / server messages for these files (one per line). */
  error: string | null;
  /** Upload progress in %; null = size unknown; undefined = not uploading. */
  progress: number | null | undefined;
  setProgress: (progress: number | null | undefined) => void;
  /**
   * Shows the server's `files` / `files[i]` errors of a failed upload ("<file name>: <message>").
   * `sent`: the files of that request, in order. Returns true when there were such errors.
   */
  showServerErrors: (failure: ApiFailure | undefined, sent: File[]) => boolean;
};

type Options = {
  /** Saved attachments already counting toward `maxCount`. */
  existingCount: number;
  maxCount?: number;
  /** While true (e.g. saving), new files are ignored. */
  disabled?: boolean;
};

/**
 * New files picked for upload, checked like the server does (type, size, count) plus the 50 MB
 * total per upload request. Duplicates (same name, size and date) are skipped.
 */
export function usePendingFiles({ existingCount, maxCount = MAX_ATTACHMENTS, disabled = false }: Options): PendingFiles {
  const [pending, setPending] = useState<PendingFile[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<number | null | undefined>(undefined);
  const nextKeyRef = useRef(0);
  const disabledRef = useRef(disabled);
  useEffect(() => {
    disabledRef.current = disabled;
  });

  const add = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0 || disabledRef.current) return;
    const messages: string[] = [];
    const accepted: PendingFile[] = [];
    let available = maxCount - existingCount - pending.length;
    let totalBytes = pending.reduce((sum, { file }) => sum + file.size, 0);
    let overLimit = false;
    let overTotal = false;

    for (const file of Array.from(fileList)) {
      const duplicate = [...pending, ...accepted].some(
        ({ file: other }) =>
          other.name === file.name && other.size === file.size && other.lastModified === file.lastModified
      );
      if (duplicate) continue;
      const fileError = validateAttachment(file);
      if (fileError) {
        messages.push(`${file.name}: ${fileError}`);
      } else if (available <= 0) {
        overLimit = true;
      } else if (totalBytes + file.size > MAX_UPLOAD_TOTAL_BYTES) {
        overTotal = true;
      } else {
        accepted.push({ key: `file-${nextKeyRef.current++}`, file });
        available--;
        totalBytes += file.size;
      }
    }
    if (overLimit) messages.push(attachmentCountMessage(maxCount));
    if (overTotal) messages.push(UPLOAD_TOTAL_MESSAGE);

    setPending((current) => [...current, ...accepted]);
    setError(messages.length > 0 ? messages.join("\n") : null);
  };

  const remove = (key: string) => {
    setPending((current) => current.filter((item) => item.key !== key));
    setError(null);
  };

  const clear = useCallback(() => {
    setPending([]);
    setError(null);
  }, []);

  const showServerErrors = (failure: ApiFailure | undefined, sent: File[]) => {
    const messages: string[] = [];
    for (const [key, values] of Object.entries(failure?.fieldErrors ?? {})) {
      // "files" (whole request) or "files[i]" / "files[i].…" (one file)
      const match = /^files(?:\[(\d+)\])?(?:$|\.)/i.exec(key);
      if (!match) continue;
      const file = match[1] !== undefined ? sent[Number(match[1])] : undefined;
      for (const message of values) messages.push(file ? `${file.name}: ${message}` : message);
    }
    if (messages.length > 0) setError(messages.join("\n"));
    return messages.length > 0;
  };

  return {
    pending,
    files: pending.map(({ file }) => file),
    existingCount,
    maxCount,
    add,
    remove,
    clear,
    error,
    progress,
    setProgress,
    showServerErrors,
  };
}

/**
 * While a dialog with a drop zone is open, a file dropped outside the zone must not make the
 * browser open it (leaving the app). Drop zones handle their own drops.
 */
export function useWindowFileDropGuard() {
  useEffect(() => {
    const preventFileDrop = (event: DragEvent) => {
      if (event.dataTransfer?.types.includes("Files")) event.preventDefault();
    };
    window.addEventListener("dragover", preventFileDrop);
    window.addEventListener("drop", preventFileDrop);
    return () => {
      window.removeEventListener("dragover", preventFileDrop);
      window.removeEventListener("drop", preventFileDrop);
    };
  }, []);
}
