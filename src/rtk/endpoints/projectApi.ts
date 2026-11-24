import type { PagedResult } from "@/types/paged";
import type {
  MaterialOption,
  ProjectDto,
  ProjectListItemDto,
  ProjectListParams,
  SaveProjectRequest,
} from "@/types/project";
import { api } from "../api";

const RESOURCE = "projects";
const listTag = { type: "Project" as const, id: "LIST" };
const itemTag = (id: string) => ({ type: "Project" as const, id });
/** Same tag as the الخامات lookup list, so adding/renaming a material refreshes the options. */
const materialsLookupTag = { type: "Lookup" as const, id: "materials:LIST" };

/** Projects (`/api/projects`), their attachments, and the material options for the form. */
export const projectApi = api.enhanceEndpoints({ addTagTypes: ["Project", "Lookup"] }).injectEndpoints({
  endpoints: (build) => ({
    listProjects: build.query<PagedResult<ProjectListItemDto>, ProjectListParams>({
      query: ({ search, status, ...params }) => ({
        url: RESOURCE,
        params: { ...params, ...(search ? { search } : {}), ...(status ? { status } : {}) },
      }),
      providesTags: (result) => [listTag, ...(result?.items ?? []).map((item) => itemTag(item.id))],
    }),

    getProject: build.query<ProjectDto, string>({
      query: (id) => ({ url: `${RESOURCE}/${id}` }),
      providesTags: (_result, _error, id) => [itemTag(id)],
    }),

    createProject: build.mutation<ProjectDto, SaveProjectRequest>({
      query: (body) => ({ url: RESOURCE, method: "POST", data: body }),
      invalidatesTags: (_result, error) => (error ? [] : [listTag]),
    }),

    updateProject: build.mutation<ProjectDto, { id: string; body: SaveProjectRequest }>({
      query: ({ id, body }) => ({ url: `${RESOURCE}/${id}`, method: "PUT", data: body }),
      invalidatesTags: (_result, error, { id }) => (error ? [] : [listTag, itemTag(id)]),
    }),

    removeProject: build.mutation<void, string>({
      query: (id) => ({ url: `${RESOURCE}/${id}`, method: "DELETE" }),
      invalidatesTags: (_result, error, id) => (error ? [] : [listTag, itemTag(id)]),
    }),

    removeProjectAttachment: build.mutation<void, { projectId: string; attachmentId: string }>({
      query: ({ projectId, attachmentId }) => ({
        url: `${RESOURCE}/${projectId}/attachments/${attachmentId}`,
        method: "DELETE",
      }),
      // The list shows the counts per category, the project holds the attachments.
      invalidatesTags: (_result, error, { projectId }) => (error ? [] : [listTag, itemTag(projectId)]),
    }),

    materialOptions: build.query<MaterialOption[], void>({
      query: () => ({ url: "materials/options" }),
      providesTags: [materialsLookupTag],
    }),
  }),
});

export const {
  useListProjectsQuery,
  useGetProjectQuery,
  useCreateProjectMutation,
  useUpdateProjectMutation,
  useRemoveProjectMutation,
  useRemoveProjectAttachmentMutation,
  useMaterialOptionsQuery,
} = projectApi;

/** Cache tags to invalidate after uploading attachments to a project. */
export const projectAttachmentTags = (projectId: string) => [listTag, itemTag(projectId)];

/** Attachments endpoint of a project (upload: POST with `?category=`; one file: `${url}/{attachmentId}`). */
export const projectAttachmentsUrl = (projectId: string) => `${RESOURCE}/${projectId}/attachments`;
