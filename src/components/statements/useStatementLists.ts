"use client";

import { useLabeledList, useOptionList } from "@/components/options/useOptionList";
import { useContractOptionsQuery } from "@/rtk/endpoints/contractApi";
import { useStatementMetaQuery } from "@/rtk/endpoints/statementApi";
import type { StatementItem } from "@/types/statement";

/**
 * Lists for statements: contracts (`/api/contracts/options`) and the statuses / دفعة values from
 * `/api/statements/meta`. `record`: the statement being edited, so its contract shows before the
 * list loads. `contracts: false` skips the contracts list (e.g. the contracts page's counters).
 */
export function useStatementLists(record?: StatementItem, { contracts = true }: { contracts?: boolean } = {}) {
  const meta = useStatementMetaQuery();
  return {
    contracts: useOptionList(
      useContractOptionsQuery(undefined, { skip: !contracts }),
      record?.contractId,
      record ? `${record.contractNumber} — ${record.contractName}` : undefined
    ),
    statuses: useLabeledList(meta.currentData?.statuses, meta.isLoading, meta.isError),
    installments: useLabeledList(meta.currentData?.installments, meta.isLoading, meta.isError),
  };
}
