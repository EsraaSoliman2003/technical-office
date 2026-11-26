"use client";

import type { Ref } from "react";
import { Calculator } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui";
import { useGetContractAdvanceSheetQuery } from "@/rtk/endpoints/advanceSheetApi";
import type { AdvanceSheetItem } from "@/types/advanceSheet";
import { getFailureMessage, isApiFailure } from "@/utils/apiFailure";

/**
 * "حساب قيمة السلفة" for a saved contract (in the contract dialog): looks up the contract's sheet and
 * calls `onOpen` with it (edit), or with undefined only when the server says it has none (404 → add,
 * contract fixed). Any other failure (network, 403, 500…) is a toast, so a sheet that exists but
 * failed to load is never "added" a second time. Render the sheet dialog outside the contract `<form>`.
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
  const { currentData: sheet, isFetching, error, refetch } = useGetContractAdvanceSheetQuery(contractId);
  const failure = isApiFailure(error) ? error : undefined;

  const open = () => {
    if (sheet) {
      onOpen(sheet);
    } else if (failure?.status === 404) {
      onOpen(undefined);
    } else {
      toast.error(`تعذر التحقق من سلفة العقد: ${getFailureMessage(failure)}`);
      void refetch(); // the next click uses a fresh answer
    }
  };

  return (
    <Button
      ref={buttonRef}
      size="sm"
      variant="secondary"
      loading={isFetching}
      disabled={disabled}
      onClick={open}
      className="w-fit"
    >
      {!isFetching && <Calculator size={16} aria-hidden="true" />}
      حساب قيمة السلفة
    </Button>
  );
}
