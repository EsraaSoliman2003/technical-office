/**
 * The single list of name-only lookup screens.
 *
 * Each entry is served at `/data/{resource}` and talks to `/api/{resource}`. This list drives:
 * - the `LookupResource` type,
 * - the `/data` hub cards that reference it by `resource` (`{ lookup: "agencies", ... }`),
 * - the breadcrumb label for the route.
 *
 * To add a lookup: add an entry here, add `src/app/(all)/data/{resource}/page.tsx`, and point its
 * `/data` hub card at it (`{ lookup: "{resource}", icon }` in `src/app/(all)/data/page.tsx`).
 */
export const LOOKUPS = [
  { resource: "agencies", title: "الجهات", fieldLabel: "الجهة" },
  { resource: "sectors", title: "القطاعات", fieldLabel: "القطاع" },
  { resource: "materials", title: "الخامات", fieldLabel: "الخامة" },
  { resource: "factories", title: "المصانع", fieldLabel: "المصنع" },
  { resource: "mixers", title: "الخلاطات", fieldLabel: "الخلاطة" },
  { resource: "transport-companies", title: "شركات النقل", fieldLabel: "شركة النقل" },
] as const;

export type LookupConfig = (typeof LOOKUPS)[number];
export type LookupResource = LookupConfig["resource"];

export function getLookup(resource: LookupResource): LookupConfig {
  return LOOKUPS.find((lookup) => lookup.resource === resource)!;
}

export function lookupHref(resource: LookupResource) {
  return `/data/${resource}/`;
}
