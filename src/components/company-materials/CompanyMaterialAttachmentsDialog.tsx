"use client";

import { AttachmentsViewerDialog } from "@/components/attachments/AttachmentsViewerDialog";
import {
  companyMaterialAttachmentsUrl,
  useGetCompanyMaterialQuery,
  useRemoveCompanyMaterialAttachmentMutation,
} from "@/rtk/endpoints/companyMaterialApi";
import type { CompanyMaterialItem } from "@/types/companyMaterial";
import { companyMaterialLabel } from "./labels";

type CompanyMaterialAttachmentsDialogProps = {
  item: CompanyMaterialItem;
  canWrite: boolean;
  onClose: () => void;
};

/** A row's البوليصة files (from GET /api/company-materials/{id}): عرض / تحميل, and حذف for Admin/Manager. */
export default function CompanyMaterialAttachmentsDialog({ item, canWrite, onClose }: CompanyMaterialAttachmentsDialogProps) {
  const { currentData, isFetching, isError, error, refetch } = useGetCompanyMaterialQuery(item.id);
  const [removeAttachment] = useRemoveCompanyMaterialAttachmentMutation();

  return (
    <AttachmentsViewerDialog
      title="البوليصة"
      description={companyMaterialLabel(item)}
      attachments={currentData?.attachments}
      isFetching={isFetching}
      isError={isError}
      error={error}
      refetch={refetch}
      baseUrl={companyMaterialAttachmentsUrl(item.id)}
      onRemove={canWrite ? (attachment) => removeAttachment({ id: item.id, attachmentId: attachment.id }) : undefined}
      onClose={onClose}
    />
  );
}
