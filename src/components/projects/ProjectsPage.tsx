"use client";

import { useMemo, useState } from "react";
import { CategoryAttachmentButtons } from "@/components/attachments/categories";
import { auditColumns } from "@/components/list/columns";
import { useCanWrite } from "@/components/list/formHelpers";
import ListPage, { ListSuspense } from "@/components/list/ListPage";
import type { ListColumn } from "@/components/list/ListTable";
import { SegmentedFilter } from "@/components/list/SegmentedFilter";
import { useListState, type ListStateOptions } from "@/components/list/useListState";
import { Badge } from "@/components/ui";
import { formatAmount, formatDateOnly } from "@/lib/numbers";
import {
  isProjectStatus,
  PROJECT_STATUS_BADGES,
  PROJECT_STATUS_LABELS,
  PROJECT_STATUSES,
} from "@/lib/projectStatus";
import { useListProjectsQuery, useRemoveProjectMutation } from "@/rtk/endpoints/projectApi";
import type {
  ProjectAttachmentCategory,
  ProjectListItemDto,
  ProjectMaterialDto,
  ProjectSortBy,
} from "@/types/project";
import { PROJECT_ATTACHMENT_CATEGORIES, PROJECT_ATTACHMENT_LABELS } from "./attachmentCategories";
import ProjectAttachmentsDialog from "./ProjectAttachmentsDialog";
import ProjectFormDialog from "./ProjectFormDialog";

const LIST_OPTIONS: ListStateOptions<ProjectSortBy> = {
  pageSize: 20,
  sortColumns: ["name", "allocatedAmount", "progressPercent", "completionDate", "createdAt", "updatedAt"],
  defaultSortBy: "createdAt",
  defaultSortDir: "desc",
  ascendingFirst: ["name"],
  filterValues: { status: PROJECT_STATUSES },
};

const MAX_VISIBLE_MATERIALS = 3;

type DialogState = { mode: "create" } | { mode: "edit"; item: ProjectListItemDto } | null;
type ViewingState = { project: ProjectListItemDto; category: ProjectAttachmentCategory } | null;

const materialText = (material: ProjectMaterialDto) => `${material.materialName}: ${formatAmount(material.value)}`;

/** Up to 3 chips "حديد: 500.00", then "+N" with all materials in its tooltip. */
function MaterialChips({ materials }: { materials: ProjectMaterialDto[] }) {
  if (materials.length === 0) return "—";
  const visible = materials.slice(0, MAX_VISIBLE_MATERIALS);
  const hidden = materials.length - visible.length;
  const all = materials.map(materialText).join("، ");
  return (
    <div className="flex max-w-80 flex-wrap gap-1">
      {visible.map((material) => (
        <span
          key={material.materialId}
          className="inline-flex items-center gap-1 rounded-md border border-border bg-surface-muted px-2 py-0.5 text-xs whitespace-nowrap text-foreground"
        >
          {material.materialName}:
          <span dir="ltr" className="tabular-nums">
            {formatAmount(material.value)}
          </span>
        </span>
      ))}
      {hidden > 0 && (
        <span
          tabIndex={0}
          title={all}
          aria-label={`كل الخامات: ${all}`}
          className="inline-flex cursor-help items-center rounded-md border border-primary/30 bg-primary-soft px-2 py-0.5 text-xs font-semibold text-primary-text tabular-nums"
        >
          +{hidden}
        </span>
      )}
    </div>
  );
}

function ProgressCell({ value }: { value: number }) {
  const width = Math.min(Math.max(value, 0), 100);
  return (
    <div className="flex items-center gap-2">
      <div aria-hidden="true" className="h-1.5 w-20 overflow-hidden rounded-full bg-surface-muted">
        <div className="h-full rounded-full bg-primary" style={{ width: `${width}%` }} />
      </div>
      <span dir="ltr" className="tabular-nums">
        {formatAmount(value)}%
      </span>
    </div>
  );
}

/** الكل · دراسة · جاري التنفيذ · منتهي (synced to ?status=). */
function StatusFilter({ value, onChange }: { value: string | undefined; onChange: (value: string | null) => void }) {
  const items = [
    { value: null, label: "الكل" },
    ...PROJECT_STATUSES.map((status) => ({ value: status, label: PROJECT_STATUS_LABELS[status] })),
  ];
  return (
    <SegmentedFilter
      label="تصفية حسب موقف المشروع"
      items={items}
      value={isProjectStatus(value) ? value : null}
      onChange={onChange}
    />
  );
}

function ProjectsPageContent() {
  const canWrite = useCanWrite();
  const list = useListState(LIST_OPTIONS);
  const status = isProjectStatus(list.filters.status) ? list.filters.status : undefined;
  const query = useListProjectsQuery({ ...list.params, status });
  const [removeProject] = useRemoveProjectMutation();
  const [dialog, setDialog] = useState<DialogState>(null);
  const [viewing, setViewing] = useState<ViewingState>(null);

  const columns = useMemo<ListColumn<ProjectListItemDto, ProjectSortBy>[]>(
    () => [
      {
        key: "name",
        header: "المشروع",
        sortKey: "name",
        className: "font-semibold text-foreground",
        cell: (item) => item.name,
      },
      {
        key: "allocatedAmount",
        header: "المخصص",
        sortKey: "allocatedAmount",
        className: "whitespace-nowrap text-foreground",
        cell: (item) => (
          <span dir="ltr" className="tabular-nums">
            {formatAmount(item.allocatedAmount)}
          </span>
        ),
      },
      {
        key: "status",
        header: "موقف المشروع",
        className: "whitespace-nowrap",
        cell: (item) => (
          <Badge variant={PROJECT_STATUS_BADGES[item.status] ?? "neutral"}>
            {PROJECT_STATUS_LABELS[item.status] ?? item.status}
          </Badge>
        ),
      },
      {
        key: "materials",
        header: "الخامات",
        className: "text-muted-foreground",
        cell: (item) => <MaterialChips materials={item.materials} />,
      },
      {
        key: "progressPercent",
        header: "نسبة التنفيذ",
        sortKey: "progressPercent",
        className: "whitespace-nowrap text-foreground",
        cell: (item) => <ProgressCell value={item.progressPercent} />,
      },
      {
        key: "completionDate",
        header: "تاريخ النهو",
        sortKey: "completionDate",
        className: "whitespace-nowrap text-muted-foreground",
        cell: (item) => (
          <span dir="ltr" className="tabular-nums">
            {formatDateOnly(item.completionDate)}
          </span>
        ),
      },
      {
        key: "attachments",
        header: "المرفقات",
        className: "py-2 whitespace-nowrap",
        cell: (item) => (
          <CategoryAttachmentButtons
            categories={PROJECT_ATTACHMENT_CATEGORIES}
            labels={PROJECT_ATTACHMENT_LABELS}
            counts={item.attachmentCounts}
            itemName={`المشروع ${item.name}`}
            onOpen={(category) => setViewing({ project: item, category })}
          />
        ),
      },
      ...auditColumns<ProjectListItemDto, ProjectSortBy>({ createdAt: "createdAt", updatedAt: "updatedAt" }),
    ],
    []
  );

  return (
    <ListPage
      title="المشاريع"
      list={list}
      query={query}
      columns={columns}
      itemLabel={(item) => item.name}
      minWidthClassName="min-w-[1600px]"
      canWrite={canWrite}
      onAdd={() => setDialog({ mode: "create" })}
      onEdit={(item) => setDialog({ mode: "edit", item })}
      onDelete={(item) => removeProject(item.id)}
      toolbar={<StatusFilter value={list.filters.status} onChange={(value) => list.setFilter("status", value)} />}
    >
      {dialog && (
        <ProjectFormDialog
          key={dialog.mode === "edit" ? dialog.item.id : "create"}
          project={dialog.mode === "edit" ? dialog.item : undefined}
          onClose={() => setDialog(null)}
          onCreated={list.showNewest}
        />
      )}
      {viewing && (
        <ProjectAttachmentsDialog
          project={viewing.project}
          category={viewing.category}
          canWrite={canWrite}
          onClose={() => setViewing(null)}
        />
      )}
    </ListPage>
  );
}

/** المشاريع (/data/projects): list with status filter, add/edit with materials, attachments per category. */
export default function ProjectsPage() {
  return (
    <ListSuspense>
      <ProjectsPageContent />
    </ListSuspense>
  );
}
