"use client";

import { AttachmentsViewerDialog } from "@/components/attachments/AttachmentsViewerDialog";
import {
  materialDeliveryAttachmentsUrl,
  useGetMaterialDeliveryQuery,
  useRemoveMaterialDeliveryAttachmentMutation,
} from "@/rtk/endpoints/materialDeliveryApi";
import type { MaterialDeliveryItem } from "@/types/materialDelivery";
import { materialDeliveryLabel } from "./labels";

type MaterialDeliveryAttachmentsDialogProps = {
  item: MaterialDeliveryItem;
  canWrite: boolean;
  onClose: () => void;
};

/** A delivery's البوليصة files (from GET /api/material-deliveries/{id}): عرض / تحميل, and حذف for Admin/Manager. */
export default function MaterialDeliveryAttachmentsDialog({
  item,
  canWrite,
  onClose,
}: MaterialDeliveryAttachmentsDialogProps) {
  const { currentData, isFetching, isError, error, refetch } = useGetMaterialDeliveryQuery(item.id);
  const [removeAttachment] = useRemoveMaterialDeliveryAttachmentMutation();

  return (
    <AttachmentsViewerDialog
      title="البوليصة"
      description={materialDeliveryLabel(item)}
      attachments={currentData?.attachments}
      isFetching={isFetching}
      isError={isError}
      error={error}
      refetch={refetch}
      baseUrl={materialDeliveryAttachmentsUrl(item.id)}
      onRemove={canWrite ? (attachment) => removeAttachment({ id: item.id, attachmentId: attachment.id }) : undefined}
      onClose={onClose}
    />
  );
}
