"use client";

import { useId, useRef, useState, type DragEvent, type Ref } from "react";
import { FileText, Image as ImageIcon, Paperclip, X } from "lucide-react";
import { Button } from "@/components/ui";
import { ATTACHMENT_ACCEPT, formatFileSize } from "@/lib/attachments";
import { cn } from "@/lib/cn";
import type { PendingFiles } from "./usePendingFiles";

type AttachmentUploadFieldProps = {
  label: string;
  files: PendingFiles;
  disabled?: boolean;
  /** The "اختيار ملفات" button (focus target after a saved attachment is deleted). */
  pickButtonRef?: Ref<HTMLButtonElement>;
};

/**
 * Pick (button) or drag-and-drop new files, shown as chips with name, size and an X to remove,
 * plus validation / server errors and the upload progress. State lives in `usePendingFiles`.
 */
export function AttachmentUploadField({ label, files, disabled = false, pickButtonRef }: AttachmentUploadFieldProps) {
  const id = useId();
  const labelId = `${id}-label`;
  const hintId = `${id}-hint`;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { pending, existingCount, maxCount, progress } = files;

  // dragenter/dragleave also fire when moving over the zone's children; count them so the
  // highlight only goes off when the pointer really leaves the zone (no flicker).
  const [dragging, setDragging] = useState(false);
  const dragDepthRef = useRef(0);
  const handleDragEnter = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    dragDepthRef.current += 1;
    if (!disabled) setDragging(true);
  };
  const handleDragLeave = () => {
    dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
    if (dragDepthRef.current === 0) setDragging(false);
  };
  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    dragDepthRef.current = 0;
    setDragging(false);
    if (!disabled) files.add(event.dataTransfer.files);
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <span id={labelId} className="text-sm font-semibold text-foreground">
          {label}
        </span>
        <span className="text-xs text-muted-foreground tabular-nums">
          {existingCount + pending.length} من {maxCount}
        </span>
      </div>

      <div
        role="group"
        aria-labelledby={labelId}
        onDragEnter={handleDragEnter}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "flex flex-col items-center gap-2 rounded-xl border-2 border-dashed px-4 py-5 text-center transition-colors",
          dragging ? "border-primary bg-primary-soft" : "border-border bg-surface-muted/40"
        )}
      >
        <Paperclip size={22} aria-hidden="true" className="text-muted-foreground" />
        <p className="text-sm text-muted-foreground">اسحب الملفات وأفلتها هنا، أو</p>
        <Button
          ref={pickButtonRef}
          size="sm"
          variant="secondary"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
          aria-describedby={hintId}
        >
          <Paperclip size={14} aria-hidden="true" />
          اختيار ملفات
        </Button>
        <p id={hintId} className="text-xs text-muted-foreground">
          ملفات PDF أو صور، بحد أقصى 10 ميجابايت للملف
        </p>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={ATTACHMENT_ACCEPT}
          tabIndex={-1}
          aria-hidden="true"
          className="hidden"
          onChange={(event) => {
            files.add(event.target.files);
            event.target.value = ""; // allow picking the same file again
          }}
        />
      </div>

      {files.error && (
        <p role="alert" className="text-xs whitespace-pre-line text-danger">
          {files.error}
        </p>
      )}

      {pending.length > 0 && (
        <ul aria-label={`ملفات جديدة: ${label}`} className="flex flex-wrap gap-2">
          {pending.map(({ key, file }) => {
            const Icon = file.type.startsWith("image/") ? ImageIcon : FileText;
            return (
              <li
                key={key}
                className="flex max-w-full items-center gap-2 rounded-lg border border-border bg-surface py-1.5 ps-2.5 pe-1 text-sm"
              >
                <Icon size={16} aria-hidden="true" className="shrink-0 text-primary-text" />
                <span dir="auto" className="max-w-56 truncate font-semibold" title={file.name}>
                  {file.name}
                </span>
                <span dir="ltr" className="text-xs text-muted-foreground tabular-nums">
                  {formatFileSize(file.size)}
                </span>
                <button
                  type="button"
                  onClick={() => files.remove(key)}
                  disabled={disabled}
                  aria-label={`إزالة ${file.name}`}
                  title="إزالة"
                  className="rounded-md p-1 text-muted-foreground hover:bg-danger-soft hover:text-danger disabled:opacity-50"
                >
                  <X size={14} aria-hidden="true" />
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {progress !== undefined && (
        <div className="flex flex-col gap-1.5">
          <p className="text-xs text-muted-foreground" aria-live="polite">
            {progress === 100 ? (
              // All bytes sent; the server is still checking and storing the files.
              "جاري المعالجة…"
            ) : (
              <>
                جاري رفع المرفقات…{" "}
                {progress !== null && <span className="tabular-nums">{progress}%</span>}
              </>
            )}
          </p>
          <div
            role="progressbar"
            aria-label={`رفع المرفقات: ${label}`}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progress ?? undefined}
            className="h-2 overflow-hidden rounded-full bg-surface-muted"
          >
            <div
              className={cn(
                "h-full rounded-full bg-primary transition-[width]",
                (progress === null || progress === 100) && "animate-pulse"
              )}
              style={{ width: `${progress ?? 100}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
