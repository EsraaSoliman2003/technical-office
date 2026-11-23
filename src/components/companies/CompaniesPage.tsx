"use client";

import { useMemo, useState } from "react";
import { Paperclip } from "lucide-react";
import { auditColumns } from "@/components/list/columns";
import { useCanWrite } from "@/components/list/formHelpers";
import ListPage, { ListSuspense } from "@/components/list/ListPage";
import type { ListColumn } from "@/components/list/ListTable";
import { useListState, type ListStateOptions } from "@/components/list/useListState";
import { useListCompaniesQuery, useRemoveCompanyMutation } from "@/rtk/endpoints/companyApi";
import type { CompanyListItemDto, CompanySortBy } from "@/types/company";
import CompanyAttachmentsDialog from "./CompanyAttachmentsDialog";
import CompanyFormDialog from "./CompanyFormDialog";

const LIST_OPTIONS: ListStateOptions<CompanySortBy> = {
  pageSize: 20,
  sortColumns: ["name", "createdAt", "updatedAt"],
  defaultSortBy: "createdAt",
  defaultSortDir: "desc",
  ascendingFirst: ["name"],
};

type DialogState = { mode: "create" } | { mode: "edit"; item: CompanyListItemDto } | null;

/** Register / mobile: left-to-right so "91/413" and "01272611123" read correctly. */
function LtrValue({ value }: { value: string | null }) {
  if (!value) return "—";
  return (
    <span dir="ltr" className="tabular-nums">
      {value}
    </span>
  );
}

function CompaniesPageContent() {
  const canWrite = useCanWrite();
  const list = useListState(LIST_OPTIONS);
  const query = useListCompaniesQuery(list.params);
  const [removeCompany] = useRemoveCompanyMutation();
  const [dialog, setDialog] = useState<DialogState>(null);
  const [viewing, setViewing] = useState<CompanyListItemDto | null>(null);

  const columns = useMemo<ListColumn<CompanyListItemDto, CompanySortBy>[]>(
    () => [
      {
        key: "name",
        header: "الشركة",
        sortKey: "name",
        className: "font-semibold text-foreground",
        cell: (item) => item.name,
      },
      {
        key: "commercialRegister",
        header: "السجل التجاري",
        className: "whitespace-nowrap text-foreground",
        cell: (item) => <LtrValue value={item.commercialRegister} />,
      },
      {
        key: "mobile",
        header: "الموبايل",
        className: "whitespace-nowrap text-foreground",
        cell: (item) => <LtrValue value={item.mobile} />,
      },
      {
        key: "attachments",
        header: "المرفقات",
        className: "py-2 whitespace-nowrap text-muted-foreground",
        cell: (item) =>
          item.attachmentCount > 0 ? (
            <button
              type="button"
              onClick={() => setViewing(item)}
              aria-label={`عرض مرفقات ${item.name} (${item.attachmentCount})`}
              title="عرض المرفقات"
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 font-semibold text-foreground hover:border-primary/40 hover:bg-primary-soft hover:text-primary-text"
            >
              <Paperclip size={15} aria-hidden="true" />
              <span className="tabular-nums">{item.attachmentCount}</span>
            </button>
          ) : (
            "—"
          ),
      },
      ...auditColumns<CompanyListItemDto, CompanySortBy>({ createdAt: "createdAt", updatedAt: "updatedAt" }),
    ],
    []
  );

  return (
    <ListPage
      title="الشركات"
      list={list}
      query={query}
      columns={columns}
      itemLabel={(item) => item.name}
      minWidthClassName="min-w-[1080px]"
      canWrite={canWrite}
      onAdd={() => setDialog({ mode: "create" })}
      onEdit={(item) => setDialog({ mode: "edit", item })}
      onDelete={(item) => removeCompany(item.id)}
    >
      {dialog && (
        <CompanyFormDialog
          key={dialog.mode === "edit" ? dialog.item.id : "create"}
          company={dialog.mode === "edit" ? dialog.item : undefined}
          onClose={() => setDialog(null)}
          onCreated={list.showNewest}
        />
      )}
      {viewing && (
        <CompanyAttachmentsDialog company={viewing} canWrite={canWrite} onClose={() => setViewing(null)} />
      )}
    </ListPage>
  );
}

/** الشركات (/data/companies): list, search, sort, paginate, add/edit/delete, attachments. */
export default function CompaniesPage() {
  return (
    <ListSuspense>
      <CompaniesPageContent />
    </ListSuspense>
  );
}
