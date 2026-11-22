import type { ProjectMaterialForm } from "./types";

export const projectTypes = ["سكني"] as const;
export const projects = ["test"] as const;
export const materials = ["أسمنت"] as const;
export const factories = ["مصنع 1"] as const;
export const mixers = ["خلاطه 1"] as const;
export const transportCompanies = ["شركة الاسراء"] as const;

export const emptyProjectMaterialForm: ProjectMaterialForm = {
  authorizationNumber: "",
  projectType: "",
  projectName: "",
  billOfLadingNumber: "",
  billDate: "",
  quantity: "",
  material: "",
  loadingPermitNumber: "",
  salesOrderNumber: "",
  vehicleNumber: "",
  driverName: "",
  factory: "",
  mixer: "",
  transportCompany: "",
  receivedDate: "",
  exitDate: "",
  notes: "",
  billAttachment: null,
};

export const currentDataEntryUser = "إسراء سليمان";
