import type { BadgeVariant } from "@/components/ui";
import type { ProjectStatus } from "@/types/project";

/** Order used by the filter and the select. */
export const PROJECT_STATUSES = ["Study", "InProgress", "Completed"] as const satisfies readonly ProjectStatus[];

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  Study: "دراسة",
  InProgress: "جاري التنفيذ",
  Completed: "منتهي",
};

/** دراسة neutral, جاري التنفيذ accent (gold/amber), منتهي green — theme tokens, so dark mode works. */
export const PROJECT_STATUS_BADGES: Record<ProjectStatus, BadgeVariant> = {
  Study: "neutral",
  InProgress: "accent",
  Completed: "success",
};

export function isProjectStatus(value: string | null | undefined): value is ProjectStatus {
  return (PROJECT_STATUSES as readonly string[]).includes(value ?? "");
}
