"use client";

import { AttachmentsViewerDialog } from "@/components/attachments/AttachmentsViewerDialog";
import {
  companyAttachmentsUrl,
  useGetCompanyQuery,
  useRemoveCompanyAttachmentMutation,
} from "@/rtk/endpoints/companyApi";
import type { CompanyListItemDto } from "@/types/company";

type CompanyAttachmentsDialogProps = {
  company: CompanyListItemDto;
  canWrite: boolean;
  onClose: () => void;
};

/** A company's attachments (from GET /api/companies/{id}): عرض / تحميل, and حذف for Admin/Manager. */
export default function CompanyAttachmentsDialog({ company, canWrite, onClose }: CompanyAttachmentsDialogProps) {
  const { currentData, isFetching, isError, error, refetch } = useGetCompanyQuery(company.id);
  const [removeAttachment] = useRemoveCompanyAttachmentMutation();

  return (
    <AttachmentsViewerDialog
      title="مرفقات الشركة"
      description={company.name}
      attachments={currentData?.attachments}
      isFetching={isFetching}
      isError={isError}
      error={error}
      refetch={refetch}
      baseUrl={companyAttachmentsUrl(company.id)}
      onRemove={
        canWrite
          ? (attachment) => removeAttachment({ companyId: company.id, attachmentId: attachment.id })
          : undefined
      }
      onClose={onClose}
    />
  );
}
