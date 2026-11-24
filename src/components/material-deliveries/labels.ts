import type { MaterialDeliveryItem } from "@/types/materialDelivery";

/** Name of a delivery in aria-labels and confirmations: "حديد - مشروع النور (بوليصة 1234)". */
export function materialDeliveryLabel(item: MaterialDeliveryItem) {
  const bill = item.billOfLadingNumber ? ` (بوليصة ${item.billOfLadingNumber})` : "";
  return `${item.materialName} - ${item.projectName}${bill}`;
}
