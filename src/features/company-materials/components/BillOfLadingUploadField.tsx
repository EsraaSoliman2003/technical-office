"use client";

import { FileText, ImagePlus, X } from "lucide-react";
import { useState, type ChangeEvent } from "react";
import type { UploadedFile } from "@/types/UploadedFile";

type BillOfLadingUploadFieldProps = {
  file: UploadedFile | null;
  onChange: (file: UploadedFile | null) => void;
  onPendingChange: (isPending: boolean) => void;
};

const readBillOfLading = (file: File): Promise<UploadedFile> =>
  new Promise((resolve, reject) => {
    const isPdf =
      file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    const mimeType = file.type || (isPdf ? "application/pdf" : "");

    if (!mimeType.startsWith("image/") && !isPdf) {
      reject(new Error("يرجى اختيار صورة أو ملف PDF للبوليصة."));
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== "string") {
        reject(new Error(`تعذر قراءة الملف "${file.name}".`));
        return;
      }

      resolve({
        id: `${file.name}-${file.lastModified}-${Math.random().toString(36).slice(2)}`,
        name: file.name,
        src: reader.result,
        mimeType,
      });
    };
    reader.onerror = () => reject(new Error(`تعذر قراءة الملف "${file.name}".`));
    reader.onabort = () => reject(new Error(`تم إلغاء قراءة الملف "${file.name}".`));
    reader.readAsDataURL(file);
  });

export default function BillOfLadingUploadField({
  file,
  onChange,
  onPendingChange,
}: BillOfLadingUploadFieldProps) {
  const [error, setError] = useState("");
  const [isReading, setIsReading] = useState(false);

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    const selectedFile = input.files?.[0];
    input.value = "";

    if (!selectedFile) return;

    setIsReading(true);
    onPendingChange(true);
    try {
      onChange(await readBillOfLading(selectedFile));
      setError("");
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "تعذر تحميل ملف البوليصة.",
      );
    } finally {
      setIsReading(false);
      onPendingChange(false);
    }
  };

  return (
    <div className="entity-edit__label sm:col-span-2">
      <label className="block">البوليصة</label>
      <label className="mt-1 flex min-h-10 cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 transition hover:border-[#103462] hover:bg-slate-50">
        <ImagePlus size={16} aria-hidden="true" />
        <span>{file ? "استبدال البوليصة" : "رفع صورة أو PDF"}</span>
        <input
          type="file"
          accept="image/*,.pdf,application/pdf"
          disabled={isReading}
          className="sr-only"
          onChange={handleFileChange}
        />
      </label>

      {error && (
        <p role="alert" className="mt-1 text-xs text-red-600">
          {error}
        </p>
      )}

      {file && (
        <div className="relative mt-3 overflow-hidden rounded-lg border border-slate-200 bg-slate-50 p-2">
          {file.mimeType.startsWith("image/") ? (
            <img
              src={file.src}
              alt={file.name}
              className="h-40 w-full rounded-md object-contain"
            />
          ) : (
            <div className="flex items-center gap-2 py-4 text-sm text-slate-700">
              <FileText size={20} aria-hidden="true" />
              <span className="truncate">{file.name}</span>
            </div>
          )}
          <button
            type="button"
            title="إزالة البوليصة"
            aria-label="إزالة البوليصة"
            onClick={() => onChange(null)}
            className="absolute left-3 top-3 rounded-full bg-white/90 p-1 text-red-600 shadow transition hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600"
          >
            <X size={14} aria-hidden="true" />
          </button>
        </div>
      )}
    </div>
  );
}
