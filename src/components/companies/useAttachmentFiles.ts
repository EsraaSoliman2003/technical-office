"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { isImageType, isPdfType } from "@/lib/attachments";
import { fetchCompanyAttachment } from "@/rtk/endpoints/companyApi";
import type { AttachmentDto } from "@/types/company";
import { getFailureMessage, isApiFailure } from "@/utils/apiFailure";

export type AttachmentPreviewState = { attachment: AttachmentDto; url: string };
export type AttachmentBusy = { id: string; action: "view" | "download" } | null;

/** How long a PDF opened in a new tab keeps its object URL (the tab has loaded it by then). */
const TAB_URL_LIFETIME_MS = 60_000;

function saveBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName; // keeps the original (Arabic) name
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
}

/**
 * View / download a company's attachments. Files need the Bearer token, so they are fetched with
 * axios as a Blob and never linked to directly:
 * - image → preview inside the dialog (`preview`),
 * - PDF → new tab via an object URL (popup blocked → download),
 * - download → original file name.
 * Every object URL is revoked when it is no longer needed.
 */
export function useAttachmentFiles(companyId: string) {
  const [preview, setPreview] = useState<AttachmentPreviewState | null>(null);
  const [busy, setBusy] = useState<AttachmentBusy>(null);
  const busyRef = useRef(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Revoke the preview URL when it is replaced, closed, or the dialog unmounts.
  useEffect(() => {
    if (!preview) return;
    const { url } = preview;
    return () => URL.revokeObjectURL(url);
  }, [preview]);

  const load = useCallback(
    async (attachment: AttachmentDto, action: "view" | "download"): Promise<Blob | null> => {
      if (busyRef.current) return null;
      busyRef.current = true;
      setBusy({ id: attachment.id, action });
      try {
        const blob = await fetchCompanyAttachment(companyId, attachment.id);
        // Use the stored type so the browser shows PDFs/images correctly.
        return new Blob([blob], { type: attachment.contentType || blob.type });
      } catch (error) {
        toast.error(getFailureMessage(isApiFailure(error) ? error : undefined));
        return null;
      } finally {
        busyRef.current = false;
        if (mountedRef.current) setBusy(null);
      }
    },
    [companyId]
  );

  const download = useCallback(
    async (attachment: AttachmentDto) => {
      const blob = await load(attachment, "download");
      if (blob) saveBlob(blob, attachment.fileName);
    },
    [load]
  );

  const view = useCallback(
    async (attachment: AttachmentDto) => {
      if (busyRef.current) return;

      if (isImageType(attachment.contentType)) {
        const blob = await load(attachment, "view");
        if (!blob || !mountedRef.current) return;
        setPreview({ attachment, url: URL.createObjectURL(blob) });
        return;
      }

      if (isPdfType(attachment.contentType)) {
        // Open the tab now, inside the click, so the popup blocker allows it; fill it after the fetch.
        const tab = window.open("", "_blank");
        if (tab) tab.opener = null;
        const blob = await load(attachment, "view");
        if (!blob) {
          tab?.close();
          return;
        }
        if (tab && !tab.closed) {
          const url = URL.createObjectURL(blob);
          tab.location.href = url;
          window.setTimeout(() => URL.revokeObjectURL(url), TAB_URL_LIFETIME_MS);
        } else {
          saveBlob(blob, attachment.fileName); // fallback: download
        }
        return;
      }

      await download(attachment);
    },
    [load, download]
  );

  const closePreview = useCallback(() => setPreview(null), []);

  return { preview, busy, view, download, closePreview };
}
