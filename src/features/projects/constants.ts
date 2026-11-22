import type { ProjectForm } from "./types";

export const emptyProjectForm: ProjectForm = {
  name: "",
  allocation: "",
  projectStatus: "",
  iron: "",
  cement: "",
  marble: "",
  curbstones: "",
  executionPercentage: "",
  completionDate: "",
  materials: [],
  offers: [],
};

export const projectStatuses = ["جاري التنفيذ", "دراسة", "منتهي"] as const;

export const currentDataEntryUser = "إسراء سليمان";
