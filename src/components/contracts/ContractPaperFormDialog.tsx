"use client";

import { useId, useRef, useState, type RefObject } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { AttachmentUploadField } from "@/components/attachments/AttachmentUploadField";
import { SavedAttachments } from "@/components/attachments/SavedAttachments";
import { usePendingFiles } from "@/components/attachments/usePendingFiles";
import { DateField } from "@/components/form/fields";
import { applyServerFieldErrors, isInTopDialog, useSaveShortcut } from "@/components/list/formHelpers";
import { Button, Input, Modal, Textarea } from "@/components/ui";
import { uploadAttachments } from "@/lib/attachmentTransfer";
import {
  contractApi,
  contractPaperAttachmentsUrl,
  contractPaperAttachmentTags,
  contractPaperChangeTags,
  useCreateContractPaperMutation,
  useListContractPapersQuery,
  useRemoveContractPaperAttachmentMutation,
  useUpdateContractPaperMutation,
} from "@/rtk/endpoints/contractApi";
import { useAppDispatch } from "@/rtk/hooks";
import type { ContractPaperDto, SaveContractPaperRequest } from "@/types/contract";
import { getFailureMessage, isApiFailure, NO_PERMISSION_MESSAGE, type ApiFailure } from "@/utils/apiFailure";
import { MAX_NOTES_LENGTH } from "@/validation/codeText";
import {
  getContractPaperSchema,
  type ContractPaperFormValues,
  type ContractPaperSchemaType,
} from "@/validation/contractPaperSchema";

/** A paper has at most 5 attachments. */
export const MAX_PAPER_ATTACHMENTS = 5;

type ContractPaperFormDialogProps = {
  contractId: string;
  /** Paper to edit; omit to add a new one. */
  paper?: ContractPaperDto;
  /** Focus target on close if the opening button is gone (e.g. the paper was deleted meanwhile). */
  fallbackFocusRef?: RefObject<HTMLElement | null>;
  onClose: () => void;
};

const FORM_FIELDS = ["subject", "receivedDate", "exitDate", "notes"] as const;

function toRequest(values: ContractPaperSchemaType): SaveContractPaperRequest {
  return {
    subject: values.subject,
    receivedDate: values.receivedDate || null,
    exitDate: values.exitDate || null,
    notes: values.notes || null,
  };
}

function sameRequest(a: SaveContractPaperRequest, b: SaveContractPaperRequest | null) {
  return (
    b !== null &&
    a.subject === b.subject &&
    a.receivedDate === b.receivedDate &&
    a.exitDate === b.exitDate &&
    a.notes === b.notes
  );
}

/**
 * Add/edit a paper of a contract (opened over the contract dialog). Save (button, Enter outside
 * ملاحظات, or F2 while this is the top dialog): create/update the paper, then upload the new files
 * in one request. If the upload fails, the dialog stays open in edit mode so it can be retried
 * without adding the paper twice. Esc closes. Mount it only while open.
 */
export default function ContractPaperFormDialog({
  contractId,
  paper,
  fallbackFocusRef,
  onClose,
}: ContractPaperFormDialogProps) {
  const formId = useId();
  const formRef = useRef<HTMLFormElement>(null);
  const pickButtonRef = useRef<HTMLButtonElement>(null);
  const savingRef = useRef(false);
  const dispatch = useAppDispatch();

  // The paper being edited; set after a create (ref: read synchronously by onSubmit).
  const [paperId, setPaperId] = useState<string | null>(paper?.id ?? null);
  const paperIdRef = useRef<string | null>(paper?.id ?? null);
  // Last values saved on the server (skip the PUT when only files are added).
  const savedRequestRef = useRef<SaveContractPaperRequest | null>(
    paper
      ? { subject: paper.subject, receivedDate: paper.receivedDate, exitDate: paper.exitDate, notes: paper.notes }
      : null
  );

  // The saved attachments come with the contract's papers (no single-paper endpoint).
  const { currentData: papers } = useListContractPapersQuery(contractId);
  const existing = paperId ? papers?.find((item) => item.id === paperId)?.attachments : undefined;
  const [removeAttachment] = useRemoveContractPaperAttachmentMutation();
  const [createPaper] = useCreateContractPaperMutation();
  const [updatePaper] = useUpdateContractPaperMutation();

  const form = useForm<ContractPaperFormValues, unknown, ContractPaperSchemaType>({
    resolver: zodResolver(getContractPaperSchema()),
    defaultValues: {
      subject: paper?.subject ?? "",
      receivedDate: paper?.receivedDate ?? "",
      exitDate: paper?.exitDate ?? "",
      notes: paper?.notes ?? "",
    },
  });
  const { errors } = form.formState;
  const notes = useWatch({ control: form.control, name: "notes" });

  const [saving, setSaving] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const newFiles = usePendingFiles({
    existingCount: existing?.length ?? paper?.attachments.length ?? 0,
    maxCount: MAX_PAPER_ATTACHMENTS,
    disabled: saving,
  });

  // ---- Save ----
  const showSaveError = (failure: ApiFailure | undefined) => {
    if (failure?.status === 400) {
      // e.g. "تاريخ الخروج يجب ألا يسبق تاريخ الاستلام" under تاريخ الخروج.
      const shown = applyServerFieldErrors(failure, FORM_FIELDS, (field, message, focus) =>
        form.setError(field, { type: "server", message }, { shouldFocus: focus })
      );
      if (shown) return;
    }
    // 404: the contract or the paper was deleted meanwhile; refresh the table.
    if (failure?.status === 404) dispatch(contractApi.util.invalidateTags(contractPaperChangeTags(contractId)));
    toast.error(failure?.status === 403 ? NO_PERMISSION_MESSAGE : getFailureMessage(failure));
  };

  const showUploadError = (failure: ApiFailure | undefined, sent: File[]) => {
    const hasFileErrors = newFiles.showServerErrors(failure, sent);
    const reason = failure?.status === 403 ? NO_PERMISSION_MESSAGE : hasFileErrors ? null : getFailureMessage(failure);
    setUploadError(
      `تم حفظ بيانات الورقة، لكن تعذر رفع المرفقات${reason ? `: ${reason}` : "."} يمكنك إعادة المحاولة بالضغط على «حفظ».`
    );
  };

  const onSubmit = async (values: ContractPaperSchemaType) => {
    if (savingRef.current) return;
    savingRef.current = true;
    setSaving(true);
    setUploadError(null);
    try {
      const request = toRequest(values);
      let id = paperIdRef.current;

      if (!id || !sameRequest(request, savedRequestRef.current)) {
        const result = id
          ? await updatePaper({ contractId, paperId: id, body: request })
          : await createPaper({ contractId, body: request });
        if ("error" in result) {
          showSaveError(isApiFailure(result.error) ? result.error : undefined);
          return;
        }
        savedRequestRef.current = request;
        if (!id) {
          id = result.data.id;
          paperIdRef.current = id;
          setPaperId(id);
        }
      }

      if (newFiles.files.length > 0) {
        newFiles.setProgress(0);
        const sent = newFiles.files;
        try {
          await uploadAttachments(contractPaperAttachmentsUrl(contractId, id), sent, {
            onProgress: newFiles.setProgress,
          });
        } catch (error) {
          showUploadError(isApiFailure(error) ? error : undefined, sent);
          return;
        } finally {
          newFiles.setProgress(undefined);
          dispatch(contractApi.util.invalidateTags(contractPaperAttachmentTags(contractId)));
        }
        newFiles.clear();
      }

      toast.success("تم الحفظ بنجاح");
      onClose();
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  // Only while this is the top dialog (not under a confirmation); the contract dialog below ignores F2 meanwhile.
  useSaveShortcut(() => {
    if (!savingRef.current && isInTopDialog(formRef.current)) formRef.current?.requestSubmit();
  });

  const isEdit = paperId !== null;

  return (
    <Modal
      open
      onClose={onClose}
      title={isEdit ? "تعديل ورقة" : "إضافة ورقة"}
      description="الأوراق المستلمة خاصة بالمشروع"
      size="lg"
      preventClose={saving}
      fallbackFocusRef={fallbackFocusRef}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            إلغاء
          </Button>
          <Button type="submit" form={formId} loading={saving}>
            حفظ (F2)
          </Button>
        </>
      }
    >
      <form
        id={formId}
        ref={formRef}
        noValidate
        onSubmit={(event) => {
          if (savingRef.current) {
            event.preventDefault(); // prevent double submit
            return;
          }
          void form.handleSubmit(onSubmit)(event);
        }}
        className="space-y-4"
      >
        {uploadError && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-lg border border-danger/30 bg-danger-soft px-3 py-2.5 text-sm text-danger"
          >
            <AlertTriangle size={18} aria-hidden="true" className="mt-0.5 shrink-0" />
            <p>{uploadError}</p>
          </div>
        )}

        <Input
          label="بخصوص"
          required
          autoComplete="off"
          data-autofocus
          readOnly={saving}
          error={errors.subject?.message}
          {...form.register("subject")}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <DateField
            control={form.control}
            name="receivedDate"
            label="تاريخ الاستلام"
            disabled={saving}
            error={errors.receivedDate?.message}
          />
          <DateField
            control={form.control}
            name="exitDate"
            label="تاريخ الخروج"
            disabled={saving}
            error={errors.exitDate?.message}
          />
        </div>

        <Textarea
          label="ملاحظات"
          rows={3}
          readOnly={saving}
          error={errors.notes?.message}
          length={notes?.length ?? 0}
          maxChars={MAX_NOTES_LENGTH}
          {...form.register("notes")}
        />

        <div className="flex flex-col gap-2">
          <AttachmentUploadField label="المرفقات" files={newFiles} disabled={saving} pickButtonRef={pickButtonRef} />
          {paperId && existing && (
            <SavedAttachments
              attachments={existing}
              baseUrl={contractPaperAttachmentsUrl(contractId, paperId)}
              onRemove={(attachment) => removeAttachment({ contractId, paperId, attachmentId: attachment.id })}
              disabled={saving}
              fallbackFocusRef={pickButtonRef}
              heading={<p className="text-xs font-semibold text-muted-foreground">المرفقات المحفوظة</p>}
            />
          )}
        </div>
      </form>
    </Modal>
  );
}
