"use client";

import { useMemo } from "react";
import { AttachmentsViewerDialog } from "@/components/attachments/AttachmentsViewerDialog";
import {
  projectAttachmentsUrl,
  useGetProjectQuery,
  useRemoveProjectAttachmentMutation,
} from "@/rtk/endpoints/projectApi";
import type { ProjectAttachmentCategory, ProjectListItemDto } from "@/types/project";
import { PROJECT_ATTACHMENT_LABELS } from "./attachmentCategories";

type ProjectAttachmentsDialogProps = {
  project: ProjectListItemDto;
  category: ProjectAttachmentCategory;
  canWrite: boolean;
  onClose: () => void;
};

/** One category of a project's attachments (from GET /api/projects/{id}). */
export default function ProjectAttachmentsDialog({ project, category, canWrite, onClose }: ProjectAttachmentsDialogProps) {
  const { currentData, isFetching, isError, error, refetch } = useGetProjectQuery(project.id);
  const [removeAttachment] = useRemoveProjectAttachmentMutation();
  const attachments = useMemo(
    () => currentData?.attachments.filter((attachment) => attachment.category === category),
    [currentData, category]
  );

  return (
    <AttachmentsViewerDialog
      title={`مرفقات ${PROJECT_ATTACHMENT_LABELS[category]}`}
      description={project.name}
      attachments={attachments}
      isFetching={isFetching}
      isError={isError}
      error={error}
      refetch={refetch}
      baseUrl={projectAttachmentsUrl(project.id)}
      onRemove={
        canWrite
          ? (attachment) => removeAttachment({ projectId: project.id, attachmentId: attachment.id })
          : undefined
      }
      onClose={onClose}
    />
  );
}
