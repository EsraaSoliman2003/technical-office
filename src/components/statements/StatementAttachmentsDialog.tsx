"use client";

import { AttachmentsViewerDialog } from "@/components/attachments/AttachmentsViewerDialog";
import {
  statementAttachmentsUrl,
  useGetStatementQuery,
  useRemoveStatementAttachmentMutation,
} from "@/rtk/endpoints/statementApi";
import type { StatementItem } from "@/types/statement";
import { statementLabel } from "./labels";

type StatementAttachmentsDialogProps = {
  statement: StatementItem;
  canWrite: boolean;
  onClose: () => void;
};

/** A statement's attachments (from GET /api/statements/{id}); delete for Admin/Manager. */
export default function StatementAttachmentsDialog({ statement, canWrite, onClose }: StatementAttachmentsDialogProps) {
  const { currentData, isFetching, isError, error, refetch } = useGetStatementQuery(statement.id);
  const [removeAttachment] = useRemoveStatementAttachmentMutation();

  return (
    <AttachmentsViewerDialog
      title="مرفقات المستخلص"
      description={statementLabel(statement)}
      attachments={currentData?.attachments}
      isFetching={isFetching}
      isError={isError}
      error={error}
      refetch={refetch}
      baseUrl={statementAttachmentsUrl(statement.id)}
      onRemove={
        canWrite ? (attachment) => removeAttachment({ id: statement.id, attachmentId: attachment.id }) : undefined
      }
      onClose={onClose}
    />
  );
}
