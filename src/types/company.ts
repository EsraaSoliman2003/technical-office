import type { AttachmentDto } from "./attachment";
import type { AuditFields, ListParams } from "./paged";

export type { AttachmentDto };

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
