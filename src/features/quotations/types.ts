export type Quotation = {
  id: number;
  number: string;
  project: string;
  company: string;
  description: string;
  administrationValue: string;
  consultantValue: string;
  stage: string;
  owner: string;
  status: string;
};

export type QuotationForm = Omit<Quotation, "id">;
