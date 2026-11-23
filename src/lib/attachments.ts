/**
 * Attachment rules (same as the API): PDF, JPEG, PNG, WEBP; max 10 MB per file; max 10 per company.
 * Keep the messages in line with the server's.
 */
export const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;
export const MAX_ATTACHMENTS = 10;
/** Total size of the new files sent in one upload request. */
export const MAX_UPLOAD_TOTAL_BYTES = 50 * 1024 * 1024;

/** Client-side only (no server equivalent): the files of one upload request together. */
export const UPLOAD_TOTAL_MESSAGE =
  "الحجم الإجمالي للملفات الجديدة يجب ألا يزيد عن 50 ميجابايت في المرة الواحدة. احفظ أولًا ثم أضف باقي الملفات.";

const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/jpg",
  "image/pjpeg",
  "image/png",
  "image/webp",
];
const ALLOWED_EXTENSIONS = [".pdf", ".jpg", ".jpeg", ".jfif", ".png", ".webp"];

/** `accept` attribute for the file input. */
export const ATTACHMENT_ACCEPT = [...ALLOWED_MIME_TYPES, ...ALLOWED_EXTENSIONS].join(",");

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

/**
 * Error message for a file the API would clearly reject, or null when it may be fine.
 * The type check is lenient (MIME type *or* extension allowed): browsers report types
 * inconsistently, and the server's content check has the final say.
 */
export function validateAttachment(file: File): string | null {
  const typeOk =
    ALLOWED_MIME_TYPES.includes(file.type.toLowerCase()) || ALLOWED_EXTENSIONS.includes(extensionOf(file.name));
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
