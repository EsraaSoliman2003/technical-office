import type { CompanyMaterialItem } from "@/types/companyMaterial";

/** Name of a row in aria-labels and confirmations: "حديد - شركة النور (اذن 1234)". */
export function companyMaterialLabel(item: CompanyMaterialItem) {
  const permit = item.loadingPermitNumber ? ` (اذن ${item.loadingPermitNumber})` : "";
  return `${item.materialName} - ${item.companyName}${permit}`;
}
