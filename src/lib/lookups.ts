/**
 * The single list of name-only lookup screens.
 *
 * Each entry is served at `/data/{resource}` and talks to `/api/{resource}`. This list drives:
 * - the `LookupResource` type,
 * - the `/data` hub (a hub card whose title matches `title` becomes an active link),
 * - the breadcrumb label for the route.
 *
 * To add a lookup: add an entry here + add `src/app/(all)/data/{resource}/page.tsx`.
 */
export const LOOKUPS = [
  { resource: "agencies", title: "الجهات", fieldLabel: "الجهة" },
  { resource: "sectors", title: "القطاعات", fieldLabel: "القطاع" },
] as const;

export type LookupConfig = (typeof LOOKUPS)[number];
export type LookupResource = LookupConfig["resource"];

export function getLookup(resource: LookupResource): LookupConfig {
  return LOOKUPS.find((lookup) => lookup.resource === resource)!;
}

export function lookupHref(resource: LookupResource) {
  return `/data/${resource}/`;
}

/** Hub link for a card title, if a lookup with that title exists. */
export function lookupHrefByTitle(title: string): string | undefined {
  const lookup = LOOKUPS.find((item) => item.title === title);
  return lookup ? lookupHref(lookup.resource) : undefined;
}
