"use client";

import { useMemo, useRef, useState } from "react";
import { AlertTriangle, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AttachmentsViewerDialog } from "@/components/attachments/AttachmentsViewerDialog";
import { AttachmentCountButton, DateOnlyText, NotesCell } from "@/components/list/cells";
import { useCanWrite, useFocusAfterRemoval } from "@/components/list/formHelpers";
import ListTable, { type ListColumn, type RowAction } from "@/components/list/ListTable";
import { Badge, Button, ConfirmDialog } from "@/components/ui";
import {
  contractApi,
  contractPaperAttachmentsUrl,
  contractPaperChangeTags,
  useListContractPapersQuery,
  useRemoveContractPaperAttachmentMutation,
  useRemoveContractPaperMutation,
} from "@/rtk/endpoints/contractApi";
import { useAppDispatch } from "@/rtk/hooks";
import type { ContractPaperDto } from "@/types/contract";
import { getFailureMessage, isApiFailure, NO_PERMISSION_MESSAGE } from "@/utils/apiFailure";
import ContractPaperFormDialog from "./ContractPaperFormDialog";

type PaperDialogState = { mode: "create" } | { mode: "edit"; paper: ContractPaperDto } | null;

const paperLabel = (paper: ContractPaperDto) => `الورقة "${paper.subject}"`;

/**
 * الأوراق المستلمة خاصة بالمشروع of a saved contract (inside the contract dialog): a compact table
 * with the pending badge and attachments viewer, plus إضافة / تعديل / حذف (Admin/Manager) in
 * nested dialogs. Render it outside the contract `<form>`.
 */
/**
 * `disabled`: the contract itself is saving — no new paper dialogs then, because the contract dialog
 * (and any paper dialog inside it) may close as soon as that save finishes.
 */
export default function ContractPapersSection({ contractId, disabled = false }: { contractId: string; disabled?: boolean }) {
  const canWrite = useCanWrite();
  const dispatch = useAppDispatch();
  const addButtonRef = useRef<HTMLButtonElement>(null);
  const { currentData: papers, isFetching, isError, error, refetch } = useListContractPapersQuery(contractId);
  const [removePaper] = useRemoveContractPaperMutation();
  const [removeAttachment] = useRemoveContractPaperAttachmentMutation();

  const [dialog, setDialog] = useState<PaperDialogState>(null);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<ContractPaperDto | null>(null);
  const [removing, setRemoving] = useState(false);
  const removingRef = useRef(false);

  const ids = useMemo(() => papers?.map((paper) => paper.id), [papers]);
  const markRemoved = useFocusAfterRemoval(ids, addButtonRef);
  // The viewer follows the list (an attachment deleted there disappears).
  const viewing = viewingId ? papers?.find((paper) => paper.id === viewingId) : undefined;

  const confirmRemove = async () => {
    if (!confirming || removingRef.current) return;
    removingRef.current = true;
    setRemoving(true);
    let result;
    try {
      result = await removePaper({ contractId, paperId: confirming.id });
    } finally {
      removingRef.current = false;
      setRemoving(false);
    }
    const removed = confirming;
    setConfirming(null);

    if ("error" in result) {
      const failure = isApiFailure(result.error) ? result.error : undefined;
      // 404: already deleted (or the contract is gone); refresh the table.
      if (failure?.status === 404) dispatch(contractApi.util.invalidateTags(contractPaperChangeTags(contractId)));
      toast.error(failure?.status === 403 ? NO_PERMISSION_MESSAGE : getFailureMessage(failure));
      return;
    }
    toast.success("تم حذف الورقة");
    markRemoved(removed.id);
  };

  const columns = useMemo<ListColumn<ContractPaperDto>[]>(
    () => [
      {
        key: "subject",
        header: "بخصوص",
        className: "text-foreground",
        cell: (paper) => (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-semibold">{paper.subject}</span>
            {paper.isPending && <Badge variant="accent">معلقة</Badge>}
          </div>
        ),
      },
      {
        key: "receivedDate",
        header: "تاريخ الاستلام",
        className: "whitespace-nowrap text-muted-foreground",
        cell: (paper) => <DateOnlyText value={paper.receivedDate} />,
      },
      {
        key: "exitDate",
        header: "تاريخ الخروج",
        className: "whitespace-nowrap text-muted-foreground",
        cell: (paper) => <DateOnlyText value={paper.exitDate} />,
      },
      {
        key: "notes",
        header: "ملاحظات",
        className: "text-muted-foreground",
        cell: (paper) => <NotesCell value={paper.notes} />,
      },
      {
        key: "attachments",
        header: "المرفقات",
        className: "py-1.5 whitespace-nowrap",
        cell: (paper) => (
          <AttachmentCountButton
            count={paper.attachments.length}
            label={`عرض مرفقات ${paperLabel(paper)}`}
            onClick={() => setViewingId(paper.id)}
          />
        ),
      },
    ],
    [setViewingId]
  );

  const actions: RowAction<ContractPaperDto>[] = canWrite
    ? [
        { key: "edit", label: "تعديل", icon: Pencil, onClick: (paper) => setDialog({ mode: "edit", paper }), disabled },
        { key: "delete", label: "حذف", icon: Trash2, tone: "danger", onClick: setConfirming, disabled },
      ]
    : [];

  let body;
  if (!papers && isError) {
    body = (
      <div role="alert" className="flex flex-wrap items-center gap-3 text-sm text-danger">
        <AlertTriangle size={18} aria-hidden="true" />
        <span>تعذر تحميل الأوراق: {getFailureMessage(isApiFailure(error) ? error : undefined)}</span>
        <Button size="sm" variant="secondary" onClick={() => refetch()}>
          إعادة المحاولة
        </Button>
      </div>
    );
  } else if (papers && papers.length === 0) {
    body = (
      <p className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
        لا توجد أوراق مستلمة
      </p>
    );
  } else {
    body = (
      <div className="overflow-hidden rounded-lg border border-border">
        <ListTable
          items={papers ?? []}
          columns={columns}
          actions={actions}
          itemLabel={paperLabel}
          minWidthClassName="min-w-[720px]"
          loading={!papers}
          refreshing={Boolean(papers) && isFetching}
        />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {canWrite && (
        <div className="flex justify-end">
          <Button
            ref={addButtonRef}
            size="sm"
            variant="secondary"
            disabled={disabled}
            onClick={() => setDialog({ mode: "create" })}
          >
            <Plus size={16} aria-hidden="true" />
            إضافة ورقة
          </Button>
        </div>
      )}
      {body}

      {dialog && (
        <ContractPaperFormDialog
          key={dialog.mode === "edit" ? dialog.paper.id : "create"}
          contractId={contractId}
          paper={dialog.mode === "edit" ? dialog.paper : undefined}
          fallbackFocusRef={addButtonRef}
          onClose={() => setDialog(null)}
        />
      )}
      {viewingId && (
        <AttachmentsViewerDialog
          title="مرفقات الورقة"
          description={viewing?.subject}
          attachments={viewing?.attachments}
          isFetching={isFetching}
          isError={isError}
          error={error}
          refetch={refetch}
          baseUrl={contractPaperAttachmentsUrl(contractId, viewingId)}
          onRemove={
            canWrite
              ? (attachment) => removeAttachment({ contractId, paperId: viewingId, attachmentId: attachment.id })
              : undefined
          }
          onClose={() => setViewingId(null)}
        />
      )}
      <ConfirmDialog
        open={confirming !== null}
        loading={removing}
        message={confirming ? `هل أنت متأكد من حذف الورقة "${confirming.subject}"؟` : undefined}
        onConfirm={confirmRemove}
        onCancel={() => setConfirming(null)}
        fallbackFocusRef={addButtonRef}
      />
    </div>
  );
}
