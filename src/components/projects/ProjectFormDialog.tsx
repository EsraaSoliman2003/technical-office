"use client";

import { useId, useMemo, useRef, useState, type RefObject } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { skipToken } from "@reduxjs/toolkit/query";
import { AlertTriangle, X } from "lucide-react";
import { toast } from "sonner";
import { AttachmentUploadField } from "@/components/attachments/AttachmentUploadField";
import { SavedAttachments } from "@/components/attachments/SavedAttachments";
import {
  usePendingFiles,
  useWindowFileDropGuard,
  type PendingFiles,
} from "@/components/attachments/usePendingFiles";
import { applyServerFieldErrors, isInTopDialog, useSaveShortcut } from "@/components/list/formHelpers";
import { useListFallbackFocus } from "@/components/list/ListPage";
import { Button, Input, Modal } from "@/components/ui";
import { uploadAttachments } from "@/lib/attachmentTransfer";
import { cn } from "@/lib/cn";
import { checkDecimal, formatAmount, parseDecimal } from "@/lib/numbers";
import { PROJECT_STATUS_LABELS, PROJECT_STATUSES } from "@/lib/projectStatus";
import {
  projectApi,
  projectAttachmentsUrl,
  projectAttachmentTags,
  useCreateProjectMutation,
  useGetProjectQuery,
  useMaterialOptionsQuery,
  useRemoveProjectAttachmentMutation,
  useUpdateProjectMutation,
} from "@/rtk/endpoints/projectApi";
import { useAppDispatch } from "@/rtk/hooks";
import type {
  MaterialOption,
  ProjectAttachmentCategory,
  ProjectListItemDto,
  SaveProjectRequest,
} from "@/types/project";
import { getFailureMessage, isApiFailure, NO_PERMISSION_MESSAGE, type ApiFailure } from "@/utils/apiFailure";
import { getProjectSchema, type ProjectSchemaType } from "@/validation/projectSchema";
import { PROJECT_ATTACHMENT_LABELS } from "./attachmentCategories";
import { ProjectMaterialsField } from "./ProjectMaterialsField";

type ProjectFormDialogProps = {
  /** Project to edit; omit to add a new one. */
  project?: ProjectListItemDto;
  onClose: () => void;
  /** Called after the project was created (also when an upload then failed). */
  onCreated?: () => void;
};

const FORM_FIELDS = ["name", "allocatedAmount", "status", "progressPercent", "completionDate"] as const;
const CATEGORIES: ProjectAttachmentCategory[] = ["materials", "offers"];

function toRequest(values: ProjectSchemaType): SaveProjectRequest {
  return {
    name: values.name,
    allocatedAmount: parseDecimal(values.allocatedAmount) ?? 0,
    status: values.status,
    progressPercent: parseDecimal(values.progressPercent) ?? 0,
    completionDate: values.completionDate || null,
    materials: values.materials.map((row) => ({ materialId: row.materialId, value: parseDecimal(row.value) ?? 0 })),
  };
}

function savedRequestOf(project: ProjectListItemDto): SaveProjectRequest {
  return {
    name: project.name,
    allocatedAmount: project.allocatedAmount,
    status: project.status,
    progressPercent: project.progressPercent,
    completionDate: project.completionDate,
    materials: project.materials.map(({ materialId, value }) => ({ materialId, value })),
  };
}

/** On blur: "220000000" → "220,000,000.00" (only when the value is valid). */
function formatOnBlur(form: ReturnType<typeof useForm<ProjectSchemaType>>, name: "allocatedAmount" | "progressPercent") {
  const value = form.getValues(name);
  if (checkDecimal(value) === "ok") form.setValue(name, formatAmount(parseDecimal(value) ?? 0));
}

/**
 * Add/edit a project: fields, الخامات rows, and attachments in two categories (خامات / العروض).
 * Save (button, Enter or F2): create/update the project, then upload each category's new files
 * (one request per category). If an upload fails, the dialog stays open in edit mode so it can be
 * retried; the project is never created twice. Esc closes. Mount it only while open.
 */
export default function ProjectFormDialog({ project, onClose, onCreated }: ProjectFormDialogProps) {
  const formId = useId();
  const statusId = useId();
  const formRef = useRef<HTMLFormElement>(null);
  const savingRef = useRef(false);
  const dispatch = useAppDispatch();
  const listFallbackFocusRef = useListFallbackFocus();
  useWindowFileDropGuard();

  // The project being edited; set after a create (ref: read synchronously by onSubmit).
  const [projectId, setProjectId] = useState<string | null>(project?.id ?? null);
  const projectIdRef = useRef<string | null>(project?.id ?? null);
  const savedRequestRef = useRef<SaveProjectRequest | null>(project ? savedRequestOf(project) : null);

  const { currentData: details } = useGetProjectQuery(projectId ?? skipToken);
  const [removeAttachment] = useRemoveProjectAttachmentMutation();
  const [createProject] = useCreateProjectMutation();
  const [updateProject] = useUpdateProjectMutation();

  // Options + the project's own materials (so names show before the options have loaded).
  const optionsQuery = useMaterialOptionsQuery();
  const materialOptions = useMemo<MaterialOption[]>(() => {
    const list = [...(optionsQuery.currentData ?? [])];
    for (const material of project?.materials ?? []) {
      if (!list.some((option) => option.id === material.materialId)) {
        list.push({ id: material.materialId, name: material.materialName });
      }
    }
    return list;
  }, [optionsQuery.currentData, project]);

  const form = useForm<ProjectSchemaType>({
    resolver: zodResolver(getProjectSchema()),
    defaultValues: {
      name: project?.name ?? "",
      allocatedAmount: project ? formatAmount(project.allocatedAmount) : "",
      status: project?.status ?? "Study",
      progressPercent: project ? formatAmount(project.progressPercent) : "0",
      completionDate: project?.completionDate ?? "",
      materials: (project?.materials ?? []).map((material) => ({
        materialId: material.materialId,
        value: formatAmount(material.value),
      })),
    },
  });
  const { errors } = form.formState;
  const completionDate = useWatch({ control: form.control, name: "completionDate" });

  const [saving, setSaving] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const existingOf = (category: ProjectAttachmentCategory) =>
    details?.attachments.filter((attachment) => attachment.category === category);
  const materialsFiles = usePendingFiles({
    existingCount: existingOf("materials")?.length ?? project?.attachmentCounts.materials ?? 0,
    disabled: saving,
  });
  const offersFiles = usePendingFiles({
    existingCount: existingOf("offers")?.length ?? project?.attachmentCounts.offers ?? 0,
    disabled: saving,
  });
  const filesOf: Record<ProjectAttachmentCategory, PendingFiles> = { materials: materialsFiles, offers: offersFiles };
  const materialsPickRef = useRef<HTMLButtonElement>(null);
  const offersPickRef = useRef<HTMLButtonElement>(null);
  const pickRefOf: Record<ProjectAttachmentCategory, RefObject<HTMLButtonElement | null>> = {
    materials: materialsPickRef,
    offers: offersPickRef,
  };

  // ---- Save ----
  /** 400/409: under the fields and the الخامات rows; returns false if nothing could be shown. */
  const showFieldErrors = (failure: ApiFailure) => {
    const topLevelShown = applyServerFieldErrors(failure, FORM_FIELDS, (field, message, focus) =>
      form.setError(field, { type: "server", message }, { shouldFocus: focus })
    );
    let shown = topLevelShown;
    const entries = Object.entries(failure.fieldErrors);
    // The list-level error first: setting "materials" replaces the whole entry, row errors are added after.
    const listMessages = entries.filter(([key]) => /^materials$/i.test(key)).flatMap(([, messages]) => messages);
    if (listMessages.length > 0) {
      form.setError("materials", { type: "server", message: listMessages.join(" ") });
      shown = true;
    }
    // Row errors in screen order (row, then material before value); the first one gets focus
    // unless a field above the materials already has it.
    const rowErrors = entries
      .flatMap(([key, messages]) => {
        const row = /^materials\[(\d+)\]\.(materialId|value)$/i.exec(key);
        if (!row) return [];
        const field = row[2].toLowerCase() === "value" ? ("value" as const) : ("materialId" as const);
        return [{ index: Number(row[1]), field, message: messages.join(" ") }];
      })
      .sort((a, b) => a.index - b.index || (a.field === b.field ? 0 : a.field === "materialId" ? -1 : 1));
    rowErrors.forEach(({ index, field, message }, order) => {
      form.setError(
        `materials.${index}.${field}`,
        { type: "server", message },
        { shouldFocus: !topLevelShown && order === 0 }
      );
      shown = true;
    });
    return shown;
  };

  const showSaveError = (failure: ApiFailure | undefined) => {
    if (failure && (failure.status === 400 || failure.status === 409) && showFieldErrors(failure)) return;
    toast.error(failure?.status === 403 ? NO_PERMISSION_MESSAGE : getFailureMessage(failure));
  };

  /** Uploads each category's new files; returns the Arabic reasons of the categories that failed. */
  const uploadPending = async (id: string) => {
    const failures: string[] = [];
    for (const category of CATEGORIES) {
      const files = filesOf[category];
      const sent = files.files;
      if (sent.length === 0) continue;
      files.setProgress(0);
      try {
        await uploadAttachments(projectAttachmentsUrl(id), sent, {
          params: { category },
          onProgress: files.setProgress,
        });
        files.clear();
      } catch (error) {
        const failure = isApiFailure(error) ? error : undefined;
        const hasFileErrors = files.showServerErrors(failure, sent);
        const reason =
          failure?.status === 403 ? NO_PERMISSION_MESSAGE : hasFileErrors ? null : getFailureMessage(failure);
        failures.push(`${PROJECT_ATTACHMENT_LABELS[category]}${reason ? ` (${reason})` : ""}`);
      } finally {
        files.setProgress(undefined);
      }
    }
    dispatch(projectApi.util.invalidateTags(projectAttachmentTags(id)));
    return failures;
  };

  const onSubmit = async (values: ProjectSchemaType) => {
    if (savingRef.current) return;
    savingRef.current = true;
    setSaving(true);
    setUploadError(null);
    try {
      const request = toRequest(values);
      let id = projectIdRef.current;

      if (!id || JSON.stringify(request) !== JSON.stringify(savedRequestRef.current)) {
        const result = id ? await updateProject({ id, body: request }) : await createProject(request);
        if ("error" in result) {
          showSaveError(isApiFailure(result.error) ? result.error : undefined);
          return;
        }
        savedRequestRef.current = request;
        if (!id) {
          id = result.data.id;
          projectIdRef.current = id;
          setProjectId(id);
          onCreated?.();
        }
      }

      const failures = await uploadPending(id);
      if (failures.length > 0) {
        setUploadError(
          `تم حفظ بيانات المشروع، لكن تعذر رفع مرفقات: ${failures.join("، ")}. يمكنك إعادة المحاولة بالضغط على «حفظ».`
        );
        return;
      }

      toast.success("تم الحفظ بنجاح");
      onClose();
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  // Not while a confirmation (deleting a saved attachment) is open over this dialog.
  useSaveShortcut(() => {
    if (!savingRef.current && isInTopDialog(formRef.current)) formRef.current?.requestSubmit();
  });

  const amountField = form.register("allocatedAmount");
  const percentField = form.register("progressPercent");
  const isEdit = projectId !== null;

  return (
    <Modal
      open
      onClose={onClose}
      title={isEdit ? "تعديل مشروع" : "إضافة مشروع"}
      size="lg"
      preventClose={saving}
      fallbackFocusRef={listFallbackFocusRef}
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
        className="space-y-5"
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
          label="المشروع"
          required
          autoComplete="off"
          data-autofocus
          readOnly={saving}
          error={errors.name?.message}
          {...form.register("name")}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="المخصص"
            required
            dir="ltr"
            inputMode="decimal"
            autoComplete="off"
            readOnly={saving}
            error={errors.allocatedAmount?.message}
            {...amountField}
            onBlur={(event) => {
              void amountField.onBlur(event);
              formatOnBlur(form, "allocatedAmount");
            }}
          />

          <div className="flex flex-col gap-1.5">
            <label htmlFor={statusId} className="text-sm font-semibold text-foreground">
              موقف المشروع
              <span className="ms-1 text-danger" aria-hidden="true">
                *
              </span>
            </label>
            <select
              id={statusId}
              disabled={saving}
              aria-invalid={errors.status ? true : undefined}
              className={cn(
                "h-11 w-full rounded-lg border bg-surface px-3 text-sm text-foreground shadow-sm",
                "focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-60",
                errors.status ? "border-danger" : "border-border"
              )}
              {...form.register("status")}
            >
              {PROJECT_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {PROJECT_STATUS_LABELS[status]}
                </option>
              ))}
            </select>
            {errors.status && <p className="text-xs text-danger">{errors.status.message}</p>}
          </div>

          <Input
            label="نسبة التنفيذ %"
            required
            dir="ltr"
            inputMode="decimal"
            autoComplete="off"
            readOnly={saving}
            error={errors.progressPercent?.message}
            {...percentField}
            onBlur={(event) => {
              void percentField.onBlur(event);
              formatOnBlur(form, "progressPercent");
            }}
          />

          <div className="flex items-end gap-2">
            <Input
              label="تاريخ النهو"
              type="date"
              dir="ltr"
              readOnly={saving}
              error={errors.completionDate?.message}
              containerClassName="min-w-0 flex-1"
              {...form.register("completionDate")}
            />
            {completionDate && (
              <Button
                variant="ghost"
                onClick={() => form.setValue("completionDate", "", { shouldDirty: true })}
                disabled={saving}
                aria-label="مسح تاريخ النهو"
                title="مسح التاريخ"
                className={cn("h-11 px-3", errors.completionDate && "mb-6")}
              >
                <X size={16} aria-hidden="true" />
              </Button>
            )}
          </div>
        </div>

        <ProjectMaterialsField
          form={form}
          options={materialOptions}
          loading={optionsQuery.isLoading}
          loadError={optionsQuery.isError ? "تعذر تحميل قائمة الخامات" : undefined}
          disabled={saving}
        />

        {CATEGORIES.map((category) => {
          const existing = existingOf(category);
          return (
            <div key={category} className="flex flex-col gap-2">
              <AttachmentUploadField
                label={PROJECT_ATTACHMENT_LABELS[category]}
                files={filesOf[category]}
                disabled={saving}
                pickButtonRef={pickRefOf[category]}
              />
              {projectId && existing && (
                <SavedAttachments
                  attachments={existing}
                  baseUrl={projectAttachmentsUrl(projectId)}
                  onRemove={(attachment) => removeAttachment({ projectId, attachmentId: attachment.id })}
                  disabled={saving}
                  fallbackFocusRef={pickRefOf[category]}
                  heading={
                    <p className="text-xs font-semibold text-muted-foreground">
                      المرفقات المحفوظة: {PROJECT_ATTACHMENT_LABELS[category]}
                    </p>
                  }
                />
              )}
            </div>
          );
        })}
      </form>
    </Modal>
  );
}
