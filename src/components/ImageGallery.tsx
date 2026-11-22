"use client";

import type { UploadedFile } from "@/types/UploadedFile";

type ImageGalleryProps = {
  title: string;
  images: UploadedFile[];
};

export default function ImageGallery({ title, images }: ImageGalleryProps) {
  return (
    <section className="rounded-lg bg-slate-50 p-3">
      <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
      {images.length > 0 ? (
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {images.map((image) => (
            <div
              key={image.id}
              className="overflow-hidden rounded-lg border border-slate-200 bg-white"
            >
              <img
                src={image.src}
                alt={image.name}
                className="h-36 w-full object-cover"
              />
              <span className="block truncate px-2 py-1 text-[11px] text-slate-600">
                {image.name}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-2 text-xs text-slate-500">لا توجد صور مضافة</p>
      )}
    </section>
  );
}
