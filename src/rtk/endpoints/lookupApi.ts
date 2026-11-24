import type { LookupDto, LookupInput, LookupListParams, LookupResource } from "@/types/lookup";
import type { NamedOption } from "@/types/options";
import type { PagedResult } from "@/types/paged";
import { api } from "../api";

const listTag = (resource: LookupResource) => ({ type: "Lookup" as const, id: `${resource}:LIST` });
const itemTag = (resource: LookupResource, id: string) => ({ type: "Lookup" as const, id: `${resource}:${id}` });
/**
 * Invalidated when a lookup row is renamed or deleted (not on create), for other features that
 * show lookup names in their own data (e.g. a project's materials).
 */
export const lookupChangedTag = (resource: LookupResource) => ({
  type: "Lookup" as const,
  id: `${resource}:CHANGED`,
});

/** Generic endpoints for name-only lookups (`/api/{resource}`). Cache tags are scoped per resource. */
export const lookupApi = api.enhanceEndpoints({ addTagTypes: ["Lookup"] }).injectEndpoints({
  endpoints: (build) => ({
    listLookups: build.query<PagedResult<LookupDto>, { resource: LookupResource } & LookupListParams>({
      query: ({ resource, search, ...params }) => ({
        url: resource,
        params: { ...params, ...(search ? { search } : {}) },
      }),
      providesTags: (result, _error, { resource }) => [
        listTag(resource),
        ...(result?.items ?? []).map((item) => itemTag(resource, item.id)),
      ],
    }),

    getLookup: build.query<LookupDto, { resource: LookupResource; id: string }>({
      query: ({ resource, id }) => ({ url: `${resource}/${id}` }),
      providesTags: (_result, _error, { resource, id }) => [itemTag(resource, id)],
    }),

    createLookup: build.mutation<LookupDto, { resource: LookupResource; body: LookupInput }>({
      query: ({ resource, body }) => ({ url: resource, method: "POST", data: body }),
      invalidatesTags: (_result, error, { resource }) => (error ? [] : [listTag(resource)]),
    }),

    updateLookup: build.mutation<LookupDto, { resource: LookupResource; id: string; body: LookupInput }>({
      query: ({ resource, id, body }) => ({ url: `${resource}/${id}`, method: "PUT", data: body }),
      invalidatesTags: (_result, error, { resource, id }) =>
        error ? [] : [listTag(resource), itemTag(resource, id), lookupChangedTag(resource)],
    }),

    removeLookup: build.mutation<void, { resource: LookupResource; id: string }>({
      query: ({ resource, id }) => ({ url: `${resource}/${id}`, method: "DELETE" }),
      invalidatesTags: (_result, error, { resource, id }) =>
        error ? [] : [listTag(resource), itemTag(resource, id), lookupChangedTag(resource)],
    }),

    /** `{ id, name }` of all rows (`/api/{resource}/options`), for dropdowns elsewhere. */
    lookupOptions: build.query<NamedOption[], LookupResource>({
      query: (resource) => ({ url: `${resource}/options` }),
      providesTags: (_result, _error, resource) => [listTag(resource)],
    }),
  }),
});

export const {
  useListLookupsQuery,
  useGetLookupQuery,
  useCreateLookupMutation,
  useUpdateLookupMutation,
  useRemoveLookupMutation,
  useLookupOptionsQuery,
} = lookupApi;
