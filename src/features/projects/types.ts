import type { UploadedFile } from "@/types/UploadedFile";

export type ProjectImage = UploadedFile;

export type ProjectForm = {
  name: string;
  allocation: string;
  projectStatus: string;
  iron: string;
  cement: string;
  marble: string;
  curbstones: string;
  executionPercentage: string;
  completionDate: string;
  materials: ProjectImage[];
  offers: ProjectImage[];
};

export type ProjectFormField = Exclude<
  keyof ProjectForm,
  "materials" | "offers"
>;

export type Project = ProjectForm & {
  id: number;
  editTime: string;
  lastEdit: string;
  addTime: string;
  enteredBy: string;
};
