import type { CompanyMaterialForm } from "./types";

export const companyMaterialProjects = ["test"] as const;
export const companyMaterialMaterials = ["أسمنت"] as const;
export const executingCompanies = ["شركه 1"] as const;

export const emptyCompanyMaterialForm: CompanyMaterialForm = {
  notes: "",
  receivingEngineer: "",
  quantity: "",
  executingCompany: "",
  material: "",
  projectName: "",
  loadingPermitNumber: "",
  billOfLading: null,
};
