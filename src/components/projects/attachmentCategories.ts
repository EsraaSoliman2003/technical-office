import type { ProjectAttachmentCategory } from "@/types/project";

/** Labels of the two project attachment categories. */
export const PROJECT_ATTACHMENT_LABELS: Record<ProjectAttachmentCategory, string> = {
  materials: "خامات",
  offers: "العروض",
};

/** The categories in display order. */
export const PROJECT_ATTACHMENT_CATEGORIES: readonly ProjectAttachmentCategory[] = ["materials", "offers"];
