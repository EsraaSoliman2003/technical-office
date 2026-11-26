"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fragment } from "react";
import { LOOKUPS } from "@/lib/lookups";

/** Arabic labels for route segments (static, so there is no flicker). Lookup labels come from `LOOKUPS`. */
const SEGMENT_LABELS: Record<string, string> = {
  data: "البيانات",
  ...Object.fromEntries(LOOKUPS.map((lookup) => [lookup.resource, lookup.title])),
  companies: "الشركات",
  projects: "المشاريع",
  "company-materials": "خامات الشركات",
  "project-materials": "خامات المشاريع",
  contracts: "العقود",
  "daily-summary": "التمام اليومي",
  "advances-statements": "سلفة + مستخلص",
  advances: "السلف",
  statements: "المستخلصات",
  "materials-hub": "الخامات",
  // UI drafts (not connected to the backend yet)
  "contract-report": "تقرير العقود",
  quotations: "المقايسات",
  deducted: "الخامات المخصومة",
};

/** Top-level pages reached through a hub page: the hub shows as their parent crumb. */
const HUB_PARENTS: Record<string, string> = {
  advances: "advances-statements",
  statements: "advances-statements",
};

type Crumb = { label: string; href: string };

function buildCrumbs(pathname: string): Crumb[] {
  const segments = pathname.split("/").filter(Boolean);
  const crumbs: Crumb[] = [{ label: "الرئيسية", href: "/" }];
  const hub = segments[0] ? HUB_PARENTS[segments[0]] : undefined;
  if (hub) crumbs.push({ label: SEGMENT_LABELS[hub], href: `/${hub}/` });
  let href = "";
  for (const segment of segments) {
    href += `/${segment}`;
    const label = SEGMENT_LABELS[segment];
    if (label) crumbs.push({ label, href: `${href}/` });
  }
  return crumbs;
}

/** Breadcrumb row for inner pages (hidden on the home page). */
export default function Breadcrumbs() {
  const pathname = usePathname() ?? "/";
  const crumbs = buildCrumbs(pathname);
  if (crumbs.length < 2) return null;

  return (
    <nav aria-label="مسار التنقل" className="border-b border-border bg-surface-muted/60">
      <ol className="mx-auto flex max-w-7xl flex-wrap items-center gap-2 px-4 py-2.5 text-sm md:px-6">
        {crumbs.map((crumb, index) => {
          const isLast = index === crumbs.length - 1;
          return (
            <Fragment key={crumb.href}>
              {index > 0 && (
                <li aria-hidden="true" className="text-muted-foreground/60">
                  /
                </li>
              )}
              <li>
                {isLast ? (
                  <span aria-current="page" className="font-semibold text-foreground">
                    {crumb.label}
                  </span>
                ) : (
                  <Link href={crumb.href} className="rounded text-muted-foreground hover:text-primary-text">
                    {crumb.label}
                  </Link>
                )}
              </li>
            </Fragment>
          );
        })}
      </ol>
    </nav>
  );
}
