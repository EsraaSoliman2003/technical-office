import type { UploadedFile } from "@/types/UploadedFile";

export type ProjectMaterialForm = {
  authorizationNumber: string;
  projectType: string;
  projectName: string;
  billOfLadingNumber: string;
  billDate: string;
  quantity: string;
  material: string;
  loadingPermitNumber: string;
  salesOrderNumber: string;
  vehicleNumber: string;
  driverName: string;
  factory: string;
  mixer: string;
  transportCompany: string;
  receivedDate: string;
  exitDate: string;
  notes: string;
  billAttachment: UploadedFile | null;
};

export type ProjectMaterialFormField = Exclude<
  keyof ProjectMaterialForm,
  "billAttachment"
>;

export type ProjectMaterial = ProjectMaterialForm & {
  id: number;
  editTime: string;
  lastEdit: string;
  addTime: string;
};
