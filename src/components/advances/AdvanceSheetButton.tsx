"use client";

import type { Ref } from "react";
import { Calculator } from "lucide-react";
import { Button } from "@/components/ui";
import { useGetContractAdvanceSheetQuery } from "@/rtk/endpoints/advanceSheetApi";
import type { AdvanceSheetItem } from "@/types/advanceSheet";

/**
 * "حساب قيمة السلفة" for a saved contract (in the contract dialog): looks up the contract's sheet and
 * calls `onOpen` with it (edit), or with undefined when it has none yet (add, contract fixed).
 * Render the sheet dialog outside the contract `<form>`.
 */
export function AdvanceSheetButton({
  contractId,
  disabled,
  onOpen,
  buttonRef,
}: {
  contractId: string;
  disabled?: boolean;
  onOpen: (sheet: AdvanceSheetItem | undefined) => void;
  buttonRef?: Ref<HTMLButtonElement>;
}) {
  // 404 (an error) = no sheet yet.
  const { currentData: sheet, isFetching } = useGetContractAdvanceSheetQuery(contractId);
  return (
    <Button
      ref={buttonRef}
      size="sm"
      variant="secondary"
      loading={isFetching}
      disabled={disabled}
      onClick={() => onOpen(sheet)}
      className="w-fit"
    >
      {!isFetching && <Calculator size={16} aria-hidden="true" />}
      حساب قيمة السلفة
    </Button>
  );
}
