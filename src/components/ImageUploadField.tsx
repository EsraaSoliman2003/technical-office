"use client";

import { ImagePlus, X } from "lucide-react";
import { useState, type ChangeEvent } from "react";
import type { UploadedImage } from "@/types/UploadedImage";

type ImageUploadFieldProps = {
  label: string;
  images: UploadedImage[];
  onAdd: (images: UploadedImage[]) => void;
  onRemove: (id: string) => void;
  onPendingChange: (isPending: boolean) => void;
};

const readImage = (file: File): Promise<UploadedImage> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result !== "string") {
        reject(new Error(`تعذر قراءة الصورة "${file.name}".`));
        return;
      }

      resolve({
        id: `${file.name}-${file.lastModified}-${Math.random().toString(36).slice(2)}`,
        name: file.name,
        src: reader.result,
      });
    };
    reader.onerror = () => reject(new Error(`تعذر قراءة الصورة "${file.name}".`));
    reader.onabort = () => reject(new Error(`تم إلغاء قراءة الصورة "${file.name}".`));
    reader.readAsDataURL(file);
  });

export default function ImageUploadField({
  label,
  images,
  onAdd,
  onRemove,
  onPendingChange,
}: ImageUploadFieldProps) {
  const [error, setError] = useState("");
  const [isReading, setIsReading] = useState(false);

  const handleFilesChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    const files = Array.from(input.files ?? []);
    input.value = "";

    if (files.length === 0) return;
    if (files.some((file) => !file.type.startsWith("image/"))) {
      setError("يرجى اختيار ملفات صور فقط.");
      return;
    }

    setIsReading(true);
    onPendingChange(true);
    try {
      const newImages = await Promise.all(files.map(readImage));
      onAdd(newImages);
      setError("");
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "تعذر تحميل الصور المختارة.",
      );
    } finally {
      setIsReading(false);
      onPendingChange(false);
    }
  };

  return (
    <div className="entity-edit__label">
      <label className="block">{label}</label>
      <label className="mt-1 flex min-h-10 cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 transition hover:border-[#103462] hover:bg-slate-50">
        <ImagePlus size={16} aria-hidden="true" />
        <span>اختيار صور</span>
        <input
          type="file"
          accept="image/*"
          multiple
          disabled={isReading}
          className="sr-only"
          onChange={handleFilesChange}
        />
      </label>

      {error && (
        <p role="alert" className="mt-1 text-xs text-red-600">
          {error}
        </p>
      )}

      {images.length > 0 && (
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {images.map((image) => (
            <div
              key={image.id}
              className="relative overflow-hidden rounded-lg border border-slate-200 bg-slate-50"
            >
              <img
                src={image.src}
                alt={image.name}
                className="h-28 w-full object-cover"
              />
              <button
                type="button"
                title="إزالة الصورة"
                aria-label={`إزالة الصورة ${image.name}`}
                onClick={() => onRemove(image.id)}
                className="absolute left-1 top-1 rounded-full bg-white/90 p-1 text-red-600 shadow transition hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600"
              >
                <X size={14} aria-hidden="true" />
              </button>
              <p className="truncate px-2 py-1 text-[11px] text-slate-600">
                {image.name}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
