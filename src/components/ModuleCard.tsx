import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui";
import { cn } from "@/lib/cn";

type ModuleCardProps = {
  title: string;
  icon: LucideIcon;
  /** Active cards link here. Without `href` the card is shown disabled with a "قريبًا" badge. */
  href?: string;
  size?: "lg" | "md";
  /** UI draft that isn't connected to the backend yet: clickable, with a "مسودة" badge. */
  draft?: boolean;
};

/** Clickable module/list card used on the home page and the data hub. */
export default function ModuleCard({ title, icon: Icon, href, size = "lg", draft = false }: ModuleCardProps) {
  const isLarge = size === "lg";
  const base = cn(
    "group relative flex h-full flex-col items-center justify-center rounded-2xl border text-center",
    isLarge ? "min-h-44 gap-4 p-6" : "min-h-32 gap-3 p-4"
  );

  const iconWrapper = cn(
    "flex items-center justify-center rounded-2xl transition-colors duration-300",
    isLarge ? "h-16 w-16" : "h-12 w-12"
  );
  const iconSize = isLarge ? 32 : 24;
  const titleClass = cn("font-bold", isLarge ? "text-base md:text-lg" : "text-sm md:text-base");

  if (!href) {
    return (
      <div aria-disabled="true" className={cn(base, "cursor-not-allowed border-dashed border-border bg-surface/60")}>
        <Badge variant="accent" className="absolute top-3 left-3">
          قريبًا
        </Badge>
        <span className={cn(iconWrapper, "bg-surface-muted text-muted-foreground/70")}>
          <Icon size={iconSize} strokeWidth={1.5} aria-hidden="true" />
        </span>
        <span className={cn(titleClass, "text-muted-foreground")}>{title}</span>
        <span className="sr-only">غير متاح حاليًا</span>
      </div>
    );
  }

  return (
    <Link
      href={href}
      className={cn(
        base,
        "border-border bg-surface shadow-sm transition-all duration-300",
        "hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg",
        "focus-visible:-translate-y-1 focus-visible:border-primary/40 focus-visible:shadow-lg"
      )}
    >
      {draft && (
        <Badge variant="accent" className="absolute top-3 left-3">
          مسودة
        </Badge>
      )}
      <span
        className={cn(
          iconWrapper,
          "bg-primary-soft text-primary-text group-hover:bg-primary group-hover:text-primary-foreground",
          "group-focus-visible:bg-primary group-focus-visible:text-primary-foreground"
        )}
      >
        <Icon size={iconSize} strokeWidth={1.5} aria-hidden="true" />
      </span>
      <span className={cn(titleClass, "text-foreground group-hover:text-primary-text")}>{title}</span>
      <span
        aria-hidden="true"
        className="absolute inset-x-6 bottom-0 h-0.5 scale-x-0 rounded-full bg-accent transition-transform duration-300 group-hover:scale-x-100 group-focus-visible:scale-x-100"
      />
    </Link>
  );
}
