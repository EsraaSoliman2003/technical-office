import type { UploadedImage } from "@/types/UploadedImage";

export type CompanyForm = {
  name: string;
  mobile: string;
  commercialRegister: string;
  attachments: UploadedImage[];
};

export type CompanyFormField = Exclude<keyof CompanyForm, "attachments">;

export type Company = CompanyForm & {
  id: number;
  editTime: string;
  lastEdit: string;
  addTime: string;
  enteredBy: string;
};
