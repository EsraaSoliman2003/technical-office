/**
 * Attachment rules (same as the API): PDF, JPEG, PNG, WEBP; max 10 MB per file; max 10 per company.
 * Keep the messages in line with the server's.
 */
export const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;
export const MAX_ATTACHMENTS = 10;

const ALLOWED_TYPES: Record<string, string[]> = {
  "application/pdf": [".pdf"],
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "image/webp": [".webp"],
};

/** `accept` attribute for the file input. */
export const ATTACHMENT_ACCEPT = Object.entries(ALLOWED_TYPES)
  .flatMap(([type, extensions]) => [type, ...extensions])
  .join(",");

export const ATTACHMENT_MESSAGES = {
  type: "نوع الملف غير مسموح. المسموح: ملفات PDF والصور (JPEG وPNG وWEBP)",
  size: "حجم الملف يجب ألا يزيد عن 10 ميجابايت",
  empty: "الملف فارغ",
  count: `لا يمكن أن يزيد عدد المرفقات عن ${MAX_ATTACHMENTS}`,
};

function extensionOf(name: string) {
  const dot = name.lastIndexOf(".");
  return dot >= 0 ? name.slice(dot).toLowerCase() : "";
}

/** Error message for a file the API would reject, or null when it is fine. */
export function validateAttachment(file: File): string | null {
  const extension = extensionOf(file.name);
  const typeOk = file.type
    ? ALLOWED_TYPES[file.type]?.includes(extension) ?? false
    : Object.values(ALLOWED_TYPES).some((extensions) => extensions.includes(extension));
  if (!typeOk) return ATTACHMENT_MESSAGES.type;
  if (file.size === 0) return ATTACHMENT_MESSAGES.empty;
  if (file.size > MAX_ATTACHMENT_BYTES) return ATTACHMENT_MESSAGES.size;
  return null;
}

export function isImageType(contentType: string) {
  return contentType.startsWith("image/");
}

export function isPdfType(contentType: string) {
  return contentType === "application/pdf";
}

/** "350 بايت" / "12.4 كيلوبايت" / "1.2 ميجابايت" (Latin digits). */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} بايت`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(kb < 10 ? 1 : 0)} كيلوبايت`;
  const mb = kb / 1024;
  return `${mb.toFixed(1)} ميجابايت`;
}
