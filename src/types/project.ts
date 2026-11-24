import type { AttachmentDto } from "./attachment";
import type { AuditFields, ListParams } from "./paged";

/** دراسة / جاري التنفيذ / منتهي */
export type ProjectStatus = "Study" | "InProgress" | "Completed";

export type ProjectAttachmentCategory = "materials" | "offers";

export type ProjectMaterialDto = { materialId: string; materialName: string; value: number };

export type ProjectListItemDto = AuditFields & {
  id: string;
  name: string;
  allocatedAmount: number;
  status: ProjectStatus;
  progressPercent: number;
  /** "yyyy-MM-dd" (date only) */
  completionDate: string | null;
  materials: ProjectMaterialDto[];
  attachmentCounts: Record<ProjectAttachmentCategory, number>;
};

export type ProjectAttachmentDto = AttachmentDto & { category: ProjectAttachmentCategory };

export type ProjectDto = ProjectListItemDto & { attachments: ProjectAttachmentDto[] };

export type ProjectSortBy =
  | "name"
  | "allocatedAmount"
  | "progressPercent"
  | "completionDate"
  | "createdAt"
  | "updatedAt";

export type ProjectListParams = ListParams<ProjectSortBy> & { status?: ProjectStatus };

export type SaveProjectRequest = {
  name: string;
  allocatedAmount: number;
  status: ProjectStatus;
  progressPercent: number;
  completionDate: string | null;
  /** PUT replaces the list. */
  materials: { materialId: string; value: number }[];
};

export type MaterialOption = { id: string; name: string };
