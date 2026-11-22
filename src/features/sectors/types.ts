export type SectorForm = {
  name: string;
};

export type Sector = {
  id: number;
  name: string;
  projectCount: number | null;
  editTime: string;
  lastEdit: string;
  addTime: string;
  enteredBy: string;
};
