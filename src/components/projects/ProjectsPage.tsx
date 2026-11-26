"use client";

import { useCallback, useMemo, useState } from "react";
import { CategoryAttachmentButtons } from "@/components/attachments/categories";
import { auditColumns } from "@/components/list/columns";
import ColumnValueFilter, { type ColumnFilterOption } from "@/components/list/ColumnValueFilter";
import { useCanWrite } from "@/components/list/formHelpers";
import ListPage, { ListSuspense } from "@/components/list/ListPage";
import type { ListColumn } from "@/components/list/ListTable";
import { useListState, type ListStateOptions } from "@/components/list/useListState";
import { Badge } from "@/components/ui";
import { formatAmount, formatDateOnly } from "@/lib/numbers";
import {
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
};

const MAX_VISIBLE_MATERIALS = 3;

type DialogState = { mode: "create" } | { mode: "edit"; item: ProjectListItemDto } | null;
type ViewingState = { project: ProjectListItemDto; category: ProjectAttachmentCategory } | null;
type ProjectLocalFilterKey = "name" | "allocatedAmount" | "status" | "progressPercent" | "completionDate";
type ProjectLocalFilters = Partial<Record<ProjectLocalFilterKey, string[]>>;

const materialText = (material: ProjectMaterialDto) => `${material.materialName}: ${formatAmount(material.value)}`;

function getProjectFilterValue(item: ProjectListItemDto, key: ProjectLocalFilterKey) {
  switch (key) {
    case "name":
      return item.name;
    case "allocatedAmount":
      return formatAmount(item.allocatedAmount);
    case "status":
      return item.status;
    case "progressPercent":
      return `${formatAmount(item.progressPercent)}%`;
    case "completionDate":
      return formatDateOnly(item.completionDate) ?? "—";
  }
}

function getProjectFilterOptions(
  items: ProjectListItemDto[],
  key: ProjectLocalFilterKey
): ColumnFilterOption[] {
  return Array.from(new Set(items.map((item) => getProjectFilterValue(item, key))))
    .sort((a, b) => a.localeCompare(b, "ar"))
    .map((value) => ({ value, label: value }));
}

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

function ProjectsPageContent() {
  const canWrite = useCanWrite();
  const list = useListState(LIST_OPTIONS);
  const query = useListProjectsQuery(list.params);
  const [removeProject] = useRemoveProjectMutation();
  const [dialog, setDialog] = useState<DialogState>(null);
  const [viewing, setViewing] = useState<ViewingState>(null);
  const pageItems = query.currentData?.items ?? [];
  const filterPageKey = `${list.page}:${list.search}:${list.sortBy}:${list.sortDir}`;
  const [pageFilterState, setPageFilterState] = useState<{ key: string; filters: ProjectLocalFilters }>({
    key: filterPageKey,
    filters: {},
  });
  const localFilters: ProjectLocalFilters =
    pageFilterState.key === filterPageKey ? pageFilterState.filters : {};
  const updateLocalFilter = useCallback(
    (key: ProjectLocalFilterKey, values: string[]) => {
      setPageFilterState((current) => ({
        key: filterPageKey,
        filters: {
          ...(current.key === filterPageKey ? current.filters : {}),
          [key]: values,
        },
      }));
    },
    [filterPageKey]
  );

  const filteredItems = useMemo(
    () =>
      pageItems.filter((item) =>
        (Object.keys(localFilters) as ProjectLocalFilterKey[]).every((key) => {
          const selected = localFilters[key];
          return !selected?.length || selected.includes(getProjectFilterValue(item, key));
        })
      ),
    [localFilters, pageItems]
  );
  const hasLocalFilters = Object.values(localFilters).some((values) => values?.length);
  const filteredQuery = useMemo(
    () => ({
      ...query,
      currentData: query.currentData ? { ...query.currentData, items: filteredItems } : undefined,
    }),
    [filteredItems, query]
  );

  const columns = useMemo<ListColumn<ProjectListItemDto, ProjectSortBy>[]>(
    () => {
      const statusOptions = PROJECT_STATUSES.map((value) => ({
        value,
        label: PROJECT_STATUS_LABELS[value],
      }));

      return [
        {
          key: "name",
          header: "المشروع",
          headerControl: (
            <ColumnValueFilter
              label="المشروع"
              options={getProjectFilterOptions(pageItems, "name")}
              selectedValues={localFilters.name ?? []}
              onChange={(values) => updateLocalFilter("name", values)}
            />
          ),
          sortKey: "name",
          className: "font-semibold text-foreground",
          cell: (item) => item.name,
        },
        {
          key: "allocatedAmount",
          header: "المخصص",
          headerControl: (
            <ColumnValueFilter
              label="المخصص"
              options={getProjectFilterOptions(pageItems, "allocatedAmount")}
              selectedValues={localFilters.allocatedAmount ?? []}
              onChange={(values) => updateLocalFilter("allocatedAmount", values)}
            />
          ),
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
          headerControl: (
            <ColumnValueFilter
              label="موقف المشروع"
              options={statusOptions}
              selectedValues={localFilters.status ?? []}
              onChange={(values) => updateLocalFilter("status", values)}
            />
          ),
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
          headerControl: (
            <ColumnValueFilter
              label="نسبة التنفيذ"
              options={getProjectFilterOptions(pageItems, "progressPercent")}
              selectedValues={localFilters.progressPercent ?? []}
              onChange={(values) => updateLocalFilter("progressPercent", values)}
            />
          ),
          sortKey: "progressPercent",
          className: "whitespace-nowrap text-foreground",
          cell: (item) => <ProgressCell value={item.progressPercent} />,
        },
        {
          key: "completionDate",
          header: "تاريخ النهو",
          headerControl: (
            <ColumnValueFilter
              label="تاريخ النهو"
              options={getProjectFilterOptions(pageItems, "completionDate")}
              selectedValues={localFilters.completionDate ?? []}
              onChange={(values) => updateLocalFilter("completionDate", values)}
            />
          ),
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
          className: "py-1.5 whitespace-nowrap",
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
      ];
    },
    [list, localFilters, pageItems, updateLocalFilter]
  );

  return (
    <ListPage
      title="المشاريع"
      list={list}
      query={filteredQuery}
      columns={columns}
      itemLabel={(item) => item.name}
      minWidthClassName="min-w-[1600px]"
      canWrite={canWrite}
      showSearch={false}
      onAdd={() => setDialog({ mode: "create" })}
      onEdit={(item) => setDialog({ mode: "edit", item })}
      onDelete={(item) => removeProject(item.id)}
      hasLocalFilters={hasLocalFilters}
      summary={
        hasLocalFilters ? (
          <span className="text-sm text-muted-foreground">
            المعروض في الصفحة: {filteredItems.length} من {pageItems.length}
          </span>
        ) : undefined
      }
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
