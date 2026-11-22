import type { UploadedFile } from "@/types/UploadedFile";

export type CompanyMaterialForm = {
  notes: string;
  receivingEngineer: string;
  quantity: string;
  executingCompany: string;
  material: string;
  projectName: string;
  loadingPermitNumber: string;
  billOfLading: UploadedFile | null;
};

export type CompanyMaterialFormField = Exclude<
  keyof CompanyMaterialForm,
  "billOfLading"
>;

export type CompanyMaterial = CompanyMaterialForm & {
  id: number;
  editTime: string;
  lastEdit: string;
  addTime: string;
};
