"use client";

import Link from "next/link";
import { Badge } from "@/components/ui";
import { cn } from "@/lib/cn";

export type SummaryTileData = {
  key: string;
  label: string;
  /** undefined while loading. */
  count: number | undefined;
  /** The matching filtered list. */
  href: string;
  /** "الكل" tiles: no 0 / > 0 colour. */
  neutral?: boolean;
};

const base =
  "flex min-h-24 flex-col items-center justify-center gap-1.5 rounded-xl border px-3 py-3 text-center transition-colors";

/** Tone like the old screen: 0 → green (nothing waiting), > 0 → amber (needs attention), الكل → neutral. */
function toneOf(tile: SummaryTileData) {
  if (tile.neutral || tile.count === undefined)
    return "border-border bg-surface text-foreground hover:bg-surface-muted";
  return tile.count === 0
    ? "border-success/30 bg-success-soft text-success hover:border-success/60"
    : "border-accent/40 bg-accent-soft text-accent-text hover:border-accent/70";
}

/** One counter: its label and the big count, a link to the matching filtered list. */
export function SummaryTile({ tile }: { tile: SummaryTileData }) {
  return (
    <Link
      href={tile.href}
      aria-label={`${tile.label}: ${tile.count ?? "جاري التحميل"}`}
      className={cn(
        base,
        toneOf(tile),
        "focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:outline-none"
      )}
    >
      <span className="text-sm font-semibold">{tile.label}</span>
      {tile.count === undefined ? (
        <span aria-hidden="true" className="h-7 w-12 animate-pulse rounded bg-surface-muted" />
      ) : (
        <span dir="ltr" className="text-2xl font-bold tabular-nums">
          {tile.count}
        </span>
      )}
    </Link>
  );
}

/** A tile of a section that is not built yet (موقف الجوابات): disabled, with "قريبًا". */
export function ComingSoonTile({ label }: { label: string }) {
  return (
    <div
      aria-disabled="true"
      className={cn(
        base,
        "relative cursor-not-allowed border-dashed border-border bg-surface/60 text-muted-foreground"
      )}
    >
      <Badge variant="accent" className="absolute top-2 left-2">
        قريبًا
      </Badge>
      <span className="text-sm font-semibold">{label}</span>
      <span className="text-2xl font-bold">—</span>
    </div>
  );
}

/** Skeleton tiles while the labels (meta) load. */
export function SkeletonTiles({ count }: { count: number }) {
  return Array.from({ length: count }, (_, index) => (
    <div key={index} aria-hidden="true" className={cn(base, "border-border bg-surface")}>
      <span className="h-4 w-16 animate-pulse rounded bg-surface-muted" />
      <span className="h-7 w-12 animate-pulse rounded bg-surface-muted" />
    </div>
  ));
}
