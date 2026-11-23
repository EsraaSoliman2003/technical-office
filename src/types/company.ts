import type { AuditFields, ListParams } from "./paged";

export type AttachmentDto = {
  id: string;
  fileName: string;
  contentType: string;
  sizeBytes: number;
  /** ISO UTC */
  createdAt: string;
  createdByName: string | null;
};

export type CompanyListItemDto = AuditFields & {
  id: string;
  name: string;
  commercialRegister: string | null;
  mobile: string | null;
  attachmentCount: number;
};

export type CompanyDto = Omit<CompanyListItemDto, "attachmentCount"> & {
  attachments: AttachmentDto[];
};

export type CompanySortBy = "name" | "createdAt" | "updatedAt";

export type CompanyListParams = ListParams<CompanySortBy>;

export type CompanyInput = {
  name: string;
  commercialRegister: string | null;
  mobile: string | null;
};
