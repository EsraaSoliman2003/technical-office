import type {
  MaterialDeliveryDto,
  MaterialDeliveryExportParams,
  MaterialDeliveryItem,
  MaterialDeliveryListParams,
  MaterialDeliveryPage,
  MaterialDeliveryTotals,
  MaterialDeliveryTotalsParams,
  SaveMaterialDeliveryRequest,
} from "@/types/materialDelivery";
import { api } from "../api";
import { cleanParams } from "../queryParams";
import { lookupChangedTag } from "./lookupApi";
import { projectItemTag, projectListTag } from "./projectApi";

const RESOURCE = "material-deliveries";
const listTag = { type: "MaterialDelivery" as const, id: "LIST" };
const itemTag = (id: string) => ({ type: "MaterialDelivery" as const, id });
/** Rows show project and lookup names: refetch when one of those is renamed. */
const nameTags = [
  projectListTag,
  lookupChangedTag("materials"),
  lookupChangedTag("project-types"),
  lookupChangedTag("factories"),
  lookupChangedTag("mixers"),
  lookupChangedTag("transport-companies"),
];

/** خامات المشاريع (`/api/material-deliveries`): list with total quantity, export, totals, CRUD, attachments. */
export const materialDeliveryApi = api
  .enhanceEndpoints({ addTagTypes: ["MaterialDelivery", "Project", "Lookup"] })
  .injectEndpoints({
    endpoints: (build) => ({
      listMaterialDeliveries: build.query<MaterialDeliveryPage, MaterialDeliveryListParams>({
        query: (params) => ({ url: RESOURCE, params: cleanParams(params) }),
        providesTags: (result) => [listTag, ...nameTags, ...(result?.items ?? []).map((item) => itemTag(item.id))],
      }),

      /** All rows for the current filters and sort (max 5000, else 400). Fetch it unsubscribed. */
      exportMaterialDeliveries: build.query<MaterialDeliveryItem[], MaterialDeliveryExportParams>({
        query: (params) => ({ url: `${RESOURCE}/export`, params: cleanParams(params) }),
        keepUnusedDataFor: 0,
      }),

      /** Approved (from the project's materials) and dispensed (all deliveries but `excludeId`). */
      materialDeliveryTotals: build.query<MaterialDeliveryTotals, MaterialDeliveryTotalsParams>({
        query: (params) => ({ url: `${RESOURCE}/totals`, params: cleanParams(params) }),
        providesTags: (_result, _error, { projectId }) => [listTag, projectItemTag(projectId)],
        keepUnusedDataFor: 30,
      }),

      getMaterialDelivery: build.query<MaterialDeliveryDto, string>({
        query: (id) => ({ url: `${RESOURCE}/${id}` }),
        providesTags: (_result, _error, id) => [itemTag(id), ...nameTags],
      }),

      createMaterialDelivery: build.mutation<MaterialDeliveryDto, SaveMaterialDeliveryRequest>({
        query: (body) => ({ url: RESOURCE, method: "POST", data: body }),
        invalidatesTags: (_result, error) => (error ? [] : [listTag]),
      }),

      updateMaterialDelivery: build.mutation<MaterialDeliveryDto, { id: string; body: SaveMaterialDeliveryRequest }>({
        query: ({ id, body }) => ({ url: `${RESOURCE}/${id}`, method: "PUT", data: body }),
        invalidatesTags: (_result, error, { id }) => (error ? [] : [listTag, itemTag(id)]),
      }),

      removeMaterialDelivery: build.mutation<void, string>({
        query: (id) => ({ url: `${RESOURCE}/${id}`, method: "DELETE" }),
        invalidatesTags: (_result, error, id) => (error ? [] : [listTag, itemTag(id)]),
      }),

      removeMaterialDeliveryAttachment: build.mutation<void, { id: string; attachmentId: string }>({
        query: ({ id, attachmentId }) => ({ url: `${RESOURCE}/${id}/attachments/${attachmentId}`, method: "DELETE" }),
        // The list shows the attachment count, the record holds the attachments.
        invalidatesTags: (_result, error, { id }) => (error ? [] : [listTag, itemTag(id)]),
      }),
    }),
  });

export const {
  useListMaterialDeliveriesQuery,
  useMaterialDeliveryTotalsQuery,
  useGetMaterialDeliveryQuery,
  useCreateMaterialDeliveryMutation,
  useUpdateMaterialDeliveryMutation,
  useRemoveMaterialDeliveryMutation,
  useRemoveMaterialDeliveryAttachmentMutation,
} = materialDeliveryApi;

/** Cache tags to invalidate after uploading attachments to a delivery. */
export const materialDeliveryAttachmentTags = (id: string) => [listTag, itemTag(id)];

/** Attachments endpoint of a delivery (upload: POST; one file: `${url}/{attachmentId}`). */
export const materialDeliveryAttachmentsUrl = (id: string) => `${RESOURCE}/${id}/attachments`;

/** Up to 5 files per delivery (البوليصة). */
export const MAX_MATERIAL_DELIVERY_ATTACHMENTS = 5;
