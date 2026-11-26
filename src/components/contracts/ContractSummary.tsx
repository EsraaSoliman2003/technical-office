"use client";

import type { ReactNode } from "react";
import { skipToken } from "@reduxjs/toolkit/query";
import { ReadOnlyField } from "@/components/form/FormSection";
import { AmountText } from "@/components/list/cells";
import { useGetCompanyQuery } from "@/rtk/endpoints/companyApi";
import { useGetContractQuery } from "@/rtk/endpoints/contractApi";

/** A record's own copy of its contract's details (e.g. a statement or an advance sheet from the API). */
export type ContractSummarySource = {
  contractId: string;
  contractNumber: string;
  contractName: string;
  projectName: string;
  companyName: string;
  companyCommercialRegister: string | null;
  contractValue: number | null;
};

/**
 * بيانات العقد of a chosen contract: loads `/api/contracts/{id}` (and its company for السجل التجاري)
 * whenever `contractId` changes. Until they load, `saved` (the edited record's own copy, used only
 * while it is the same contract) fills in. `text(value)`: the value, "جاري التحميل…" or "—".
 */
export function useContractSummary(contractId: string, saved?: ContractSummarySource) {
  const { currentData: contract, isFetching: contractLoading } = useGetContractQuery(contractId || skipToken);
  const { currentData: company, isFetching: companyLoading } = useGetCompanyQuery(contract?.companyId ?? skipToken);
  const own = saved && saved.contractId === contractId ? saved : undefined;
  const loading = Boolean(contractId) && (contractLoading || companyLoading);
  return {
    /** The loaded contract (e.g. for its statementsTotal). */
    contract,
    number: contract?.contractNumber ?? own?.contractNumber,
    name: contract?.name ?? own?.contractName,
    projectName: contract?.projectName ?? own?.projectName,
    companyName: contract?.companyName ?? own?.companyName,
    commercialRegister: company ? company.commercialRegister : own?.companyCommercialRegister,
    /** قيمة العقد (null = none; undefined = not known yet). */
    value: contract ? contract.contractValue : own?.contractValue,
    text: (value: string | null | undefined) => (value ? value : loading ? "جاري التحميل…" : "—"),
  };
}

export type ContractSummary = ReturnType<typeof useContractSummary>;

/** رقم العقد as read-only text (a fixed contract, or an edited record whose contract can't change). */
export function ContractNumberField({ summary }: { summary: ContractSummary }) {
  return (
    <ReadOnlyField label="رقم العقد">
      <span dir="ltr" className="font-semibold text-foreground">
        {summary.text(summary.number)}
      </span>
    </ReadOnlyField>
  );
}

/**
 * The بيانات العقد grid: `contractField` (the رقم العقد dropdown or `ContractNumberField`), the
 * contract value (`valueLabel`, e.g. القيمة التعاقدية), السجل التجاري, بيان العقد, اسم المشروع and
 * اسم الشركة طبقا للموافقة الامنية — all read-only.
 */
export function ContractSummaryFields({
  summary,
  contractField,
  valueLabel = "القيمة التعاقدية",
}: {
  summary: ContractSummary;
  contractField: ReactNode;
  valueLabel?: string;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {contractField}
      <ReadOnlyField label={valueLabel}>
        {summary.value === null || summary.value === undefined ? (
          summary.text(null)
        ) : (
          <span className="font-semibold text-foreground">
            <AmountText value={summary.value} />
          </span>
        )}
      </ReadOnlyField>
      <ReadOnlyField label="السجل التجاري">
        <span dir="ltr">{summary.text(summary.commercialRegister)}</span>
      </ReadOnlyField>
      <div className="sm:col-span-2 lg:col-span-3">
        <ReadOnlyField label="بيان العقد">
          <span className="whitespace-pre-line">{summary.text(summary.name)}</span>
        </ReadOnlyField>
      </div>
      <ReadOnlyField label="اسم المشروع">{summary.text(summary.projectName)}</ReadOnlyField>
      <div className="lg:col-span-2">
        <ReadOnlyField label="اسم الشركة طبقا للموافقة الامنية">{summary.text(summary.companyName)}</ReadOnlyField>
      </div>
    </div>
  );
}
