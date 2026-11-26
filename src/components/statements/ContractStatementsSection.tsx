"use client";

import { useMemo, useRef, useState } from "react";
import { AlertTriangle, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AmountText, AttachmentCountButton, DateOnlyText } from "@/components/list/cells";
import { useCanWrite, useFocusAfterRemoval } from "@/components/list/formHelpers";
import ListTable, { type ListColumn, type RowAction } from "@/components/list/ListTable";
import { Badge, Button, ConfirmDialog } from "@/components/ui";
import {
  statementApi,
  statementAttachmentTags,
  useListContractStatementsQuery,
  useRemoveStatementMutation,
} from "@/rtk/endpoints/statementApi";
import { useAppDispatch } from "@/rtk/hooks";
import type { StatementItem } from "@/types/statement";
import { getFailureMessage, isApiFailure, NO_PERMISSION_MESSAGE } from "@/utils/apiFailure";
import { statementLabel } from "./labels";
import StatementAttachmentsDialog from "./StatementAttachmentsDialog";
import StatementFormDialog from "./StatementFormDialog";
import { useStatementLists } from "./useStatementLists";

type StatementDialogState = { mode: "create" } | { mode: "edit"; statement: StatementItem } | null;

/**
 * المستخلصات المستلمة خاصة بالمشروع of a saved contract (inside the contract dialog): a compact
 * table with the attachments viewer, plus إضافة / تعديل / حذف (Admin/Manager) in nested dialogs
 * with the contract fixed. Render it outside the contract `<form>`. `disabled`: the contract itself
 * is saving (no new statement dialogs then, like the papers).
 */
export default function ContractStatementsSection({
  contractId,
  disabled = false,
}: {
  contractId: string;
  disabled?: boolean;
}) {
  const canWrite = useCanWrite();
  const dispatch = useAppDispatch();
  const addButtonRef = useRef<HTMLButtonElement>(null);
  const { statuses, installments } = useStatementLists(undefined, { contracts: false });
  const { currentData: statements, isFetching, isError, error, refetch } = useListContractStatementsQuery(contractId);
  const [removeStatement] = useRemoveStatementMutation();

  const [dialog, setDialog] = useState<StatementDialogState>(null);
  const [viewing, setViewing] = useState<StatementItem | null>(null);
  const [confirming, setConfirming] = useState<StatementItem | null>(null);
  const [removing, setRemoving] = useState(false);
  const removingRef = useRef(false);

  const ids = useMemo(() => statements?.map((statement) => statement.id), [statements]);
  const markRemoved = useFocusAfterRemoval(ids, addButtonRef);

  const confirmRemove = async () => {
    if (!confirming || removingRef.current) return;
    removingRef.current = true;
    setRemoving(true);
    let result;
    try {
      result = await removeStatement(confirming.id);
    } finally {
      removingRef.current = false;
      setRemoving(false);
    }
    const removed = confirming;
    setConfirming(null);

    if ("error" in result) {
      const failure = isApiFailure(result.error) ? result.error : undefined;
      // 404: already deleted; refresh the table.
      if (failure?.status === 404) dispatch(statementApi.util.invalidateTags(statementAttachmentTags(removed.id)));
      toast.error(failure?.status === 403 ? NO_PERMISSION_MESSAGE : getFailureMessage(failure));
      return;
    }
    toast.success("تم حذف المستخلص");
    markRemoved(removed.id);
  };

  const columns = useMemo<ListColumn<StatementItem>[]>(
    () => [
      {
        key: "amount",
        header: "قيمة المستخلص",
        className: "whitespace-nowrap font-semibold text-foreground",
        cell: (item) => <AmountText value={item.amount} />,
      },
      {
        key: "netPayment",
        header: "صافي الصرف",
        className: "whitespace-nowrap text-foreground",
        cell: (item) => <AmountText value={item.netPayment} />,
      },
      {
        key: "status",
        header: "موقف المستخلص",
        className: "whitespace-nowrap",
        cell: (item) => <Badge variant="primary">{statuses.nameOf(item.status) ?? item.status}</Badge>,
      },
      {
        key: "installment",
        header: "دفعة",
        className: "whitespace-nowrap text-muted-foreground",
        cell: (item) => (item.installment ? (installments.nameOf(item.installment) ?? item.installment) : "—"),
      },
      {
        key: "paymentDate",
        header: "تاريخ الصرف",
        className: "whitespace-nowrap text-muted-foreground",
        cell: (item) => <DateOnlyText value={item.paymentDate} />,
      },
      {
        key: "materialsTotal",
        header: "اجمالي الخامات",
        className: "whitespace-nowrap text-foreground",
        cell: (item) => <AmountText value={item.materialsTotal} />,
      },
      {
        key: "attachments",
        header: "المرفقات",
        className: "py-1.5 whitespace-nowrap",
        cell: (item) => (
          <AttachmentCountButton
            count={item.attachmentCount}
            label={`عرض مرفقات ${statementLabel(item)}`}
            onClick={() => setViewing(item)}
          />
        ),
      },
    ],
    [statuses, installments, setViewing]
  );

  const actions: RowAction<StatementItem>[] = canWrite
    ? [
        {
          key: "edit",
          label: "تعديل",
          icon: Pencil,
          onClick: (statement) => setDialog({ mode: "edit", statement }),
          disabled,
        },
        { key: "delete", label: "حذف", icon: Trash2, tone: "danger", onClick: setConfirming, disabled },
      ]
    : [];

  let body;
  if (!statements && isError) {
    body = (
      <div role="alert" className="flex flex-wrap items-center gap-3 text-sm text-danger">
        <AlertTriangle size={18} aria-hidden="true" />
        <span>تعذر تحميل المستخلصات: {getFailureMessage(isApiFailure(error) ? error : undefined)}</span>
        <Button size="sm" variant="secondary" onClick={() => refetch()}>
          إعادة المحاولة
        </Button>
      </div>
    );
  } else if (statements && statements.length === 0) {
    body = (
      <p className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
        لا توجد مستخلصات
      </p>
    );
  } else {
    body = (
      <div className="overflow-hidden rounded-lg border border-border">
        <ListTable
          items={statements ?? []}
          columns={columns}
          actions={actions}
          itemLabel={statementLabel}
          minWidthClassName="min-w-[820px]"
          loading={!statements}
          refreshing={Boolean(statements) && isFetching}
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
            إضافة مستخلص
          </Button>
        </div>
      )}
      {body}

      {dialog && (
        <StatementFormDialog
          key={dialog.mode === "edit" ? dialog.statement.id : "create"}
          contractId={contractId}
          statement={dialog.mode === "edit" ? dialog.statement : undefined}
          fallbackFocusRef={addButtonRef}
          onClose={() => setDialog(null)}
        />
      )}
      {viewing && (
        <StatementAttachmentsDialog statement={viewing} canWrite={canWrite} onClose={() => setViewing(null)} />
      )}
      <ConfirmDialog
        open={confirming !== null}
        loading={removing}
        message={confirming ? `هل أنت متأكد من حذف ${statementLabel(confirming)}؟` : undefined}
        onConfirm={confirmRemove}
        onCancel={() => setConfirming(null)}
        fallbackFocusRef={addButtonRef}
      />
    </div>
  );
}
