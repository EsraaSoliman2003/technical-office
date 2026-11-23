"use client";

import { useMemo, useRef, useState } from "react";
import { AlertTriangle, Paperclip } from "lucide-react";
import { toast } from "sonner";
import { useFocusAfterRemoval } from "@/components/list/formHelpers";
import { useListFallbackFocus } from "@/components/list/ListPage";
import { Button, ConfirmDialog, EmptyState, Modal, Spinner } from "@/components/ui";
import { useGetCompanyQuery, useRemoveCompanyAttachmentMutation } from "@/rtk/endpoints/companyApi";
import type { AttachmentDto, CompanyListItemDto } from "@/types/company";
import { getFailureMessage, isApiFailure, NO_PERMISSION_MESSAGE } from "@/utils/apiFailure";
import { AttachmentList, AttachmentPreview } from "./AttachmentList";
import { useAttachmentFiles } from "./useAttachmentFiles";

type CompanyAttachmentsDialogProps = {
  company: CompanyListItemDto;
  canWrite: boolean;
  onClose: () => void;
};

/** A company's attachments (from GET /api/companies/{id}): عرض / تحميل, and حذف for Admin/Manager. */
export default function CompanyAttachmentsDialog({ company, canWrite, onClose }: CompanyAttachmentsDialogProps) {
  const listFallbackFocusRef = useListFallbackFocus();
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const { currentData, isFetching, isError, error, refetch } = useGetCompanyQuery(company.id);
  const attachments = currentData?.attachments;
  const files = useAttachmentFiles(company.id);

  const [confirming, setConfirming] = useState<AttachmentDto | null>(null);
  const [removeAttachment, { isLoading: removing }] = useRemoveCompanyAttachmentMutation();
  const removingRef = useRef(false);
  const attachmentIds = useMemo(() => attachments?.map((attachment) => attachment.id), [attachments]);
  const markRemoved = useFocusAfterRemoval(attachmentIds, closeButtonRef);

  const confirmRemove = async () => {
    if (!confirming || removingRef.current) return;
    removingRef.current = true;
    let result;
    try {
      result = await removeAttachment({ companyId: company.id, attachmentId: confirming.id });
    } finally {
      removingRef.current = false;
    }
    const removed = confirming;
    setConfirming(null);

    if ("error" in result) {
      const failure = isApiFailure(result.error) ? result.error : undefined;
      toast.error(failure?.status === 403 ? NO_PERMISSION_MESSAGE : getFailureMessage(failure));
      return;
    }
    toast.success("تم حذف المرفق");
    if (files.preview?.attachment.id === removed.id) files.closePreview();
    markRemoved(removed.id);
  };

  let body;
  if (!currentData && isFetching) {
    body = (
      <div className="flex justify-center py-10 text-primary-text">
        <Spinner size={28} />
      </div>
    );
  } else if (!currentData && isError) {
    body = (
      <EmptyState
        icon={AlertTriangle}
        title="تعذر تحميل المرفقات"
        description={getFailureMessage(isApiFailure(error) ? error : undefined)}
        action={
          <Button variant="secondary" onClick={() => refetch()}>
            إعادة المحاولة
          </Button>
        }
      />
    );
  } else if (!attachments || attachments.length === 0) {
    body = <EmptyState icon={Paperclip} title="لا توجد مرفقات" />;
  } else {
    body = (
      <>
        <AttachmentList
          attachments={attachments}
          busy={files.busy}
          onView={files.view}
          onDownload={files.download}
          onDelete={canWrite ? setConfirming : undefined}
        />
        {files.preview && <AttachmentPreview preview={files.preview} onClose={files.closePreview} />}
      </>
    );
  }

  return (
    <>
      <Modal
        open
        onClose={onClose}
        title="مرفقات الشركة"
        description={company.name}
        size="lg"
        fallbackFocusRef={listFallbackFocusRef}
        footer={
          <Button ref={closeButtonRef} variant="secondary" onClick={onClose}>
            إغلاق
          </Button>
        }
      >
        {body}
      </Modal>

      <ConfirmDialog
        open={confirming !== null}
        loading={removing}
        message={confirming ? `هل أنت متأكد من حذف المرفق "${confirming.fileName}"؟` : undefined}
        onConfirm={confirmRemove}
        onCancel={() => setConfirming(null)}
        fallbackFocusRef={closeButtonRef}
      />
    </>
  );
}
