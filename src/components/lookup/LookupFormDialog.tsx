"use client";

import { useEffect, useId, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button, Input, Modal } from "@/components/ui";
import { useCreateLookupMutation, useUpdateLookupMutation } from "@/rtk/endpoints/lookupApi";
import type { LookupDto, LookupResource } from "@/types/lookup";
import { getFailureMessage, isApiFailure, NO_PERMISSION_MESSAGE } from "@/utils/apiFailure";
import { getLookupSchema, type LookupSchemaType } from "@/validation/lookupSchema";

type LookupFormDialogProps = {
  resource: LookupResource;
  fieldLabel: string;
  /** Item to edit; omit to add a new one. */
  item?: LookupDto;
  onClose: () => void;
  /** Called after a successful create (not after an edit). */
  onCreated?: () => void;
};

/** Add/edit dialog with one name field. Save: button, Enter or F2. Esc closes. Mount it only while open. */
export default function LookupFormDialog({ resource, fieldLabel, item, onClose, onCreated }: LookupFormDialogProps) {
  const formId = useId();
  const formRef = useRef<HTMLFormElement>(null);
  const savingRef = useRef(false);

  const [createLookup, createState] = useCreateLookupMutation();
  const [updateLookup, updateState] = useUpdateLookupMutation();

  const form = useForm<LookupSchemaType>({
    resolver: zodResolver(getLookupSchema()),
    defaultValues: { name: item?.name ?? "" },
  });
  const { errors, isSubmitting } = form.formState;
  const saving = isSubmitting || createState.isLoading || updateState.isLoading;

  const onSubmit = async ({ name }: LookupSchemaType) => {
    if (savingRef.current) return;
    savingRef.current = true;
    try {
      const result = item
        ? await updateLookup({ resource, id: item.id, body: { name } })
        : await createLookup({ resource, body: { name } });

      if ("error" in result) {
        const failure = isApiFailure(result.error) ? result.error : undefined;
        if (failure && (failure.status === 400 || failure.status === 409)) {
          const nameKey = Object.keys(failure.fieldErrors).find((key) => key.toLowerCase() === "name");
          const messages = nameKey ? failure.fieldErrors[nameKey] : Object.values(failure.fieldErrors).flat();
          const message = messages.join(" ") || getFailureMessage(failure);
          form.setError("name", { type: "server", message }, { shouldFocus: true });
        } else if (failure?.status === 403) {
          toast.error(NO_PERMISSION_MESSAGE);
        } else {
          toast.error(getFailureMessage(failure));
        }
        return;
      }

      toast.success("تم الحفظ بنجاح");
      onClose();
      if (!item) onCreated?.();
    } finally {
      savingRef.current = false;
    }
  };

  // F2 = save (like the old system).
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "F2") return;
      event.preventDefault();
      if (!savingRef.current) formRef.current?.requestSubmit();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <Modal
      open
      onClose={onClose}
      title={item ? `تعديل ${fieldLabel}` : `إضافة ${fieldLabel}`}
      size="sm"
      preventClose={saving}
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
      >
        <Input
          label={fieldLabel}
          autoComplete="off"
          data-autofocus
          readOnly={saving}
          error={errors.name?.message}
          {...form.register("name")}
        />
      </form>
    </Modal>
  );
}
