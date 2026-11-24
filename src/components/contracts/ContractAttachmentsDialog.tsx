"use client";

import { useMemo } from "react";
import { AttachmentsViewerDialog } from "@/components/attachments/AttachmentsViewerDialog";
import {
  contractAttachmentsUrl,
  useGetContractQuery,
  useRemoveContractAttachmentMutation,
} from "@/rtk/endpoints/contractApi";
import type { ContractAttachmentCategory, ContractItem } from "@/types/contract";
import { CONTRACT_ATTACHMENT_LABELS, contractLabel } from "./labels";

type ContractAttachmentsDialogProps = {
  contract: ContractItem;
  category: ContractAttachmentCategory;
  canWrite: boolean;
  onClose: () => void;
};

/** One category of a contract's attachments (from GET /api/contracts/{id}). */
export default function ContractAttachmentsDialog({
  contract,
  category,
  canWrite,
  onClose,
}: ContractAttachmentsDialogProps) {
  const { currentData, isFetching, isError, error, refetch } = useGetContractQuery(contract.id);
  const [removeAttachment] = useRemoveContractAttachmentMutation();
  const attachments = useMemo(
    () => currentData?.attachments.filter((attachment) => attachment.category === category),
    [currentData, category]
  );

  return (
    <AttachmentsViewerDialog
      title={`مرفقات ${CONTRACT_ATTACHMENT_LABELS[category]}`}
      description={contractLabel(contract)}
      attachments={attachments}
      isFetching={isFetching}
      isError={isError}
      error={error}
      refetch={refetch}
      baseUrl={contractAttachmentsUrl(contract.id)}
      onRemove={
        canWrite ? (attachment) => removeAttachment({ id: contract.id, attachmentId: attachment.id }) : undefined
      }
      onClose={onClose}
    />
  );
}
