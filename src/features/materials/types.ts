export type MaterialForm = {
  name: string;
};

export type Material = MaterialForm & {
  id: number;
  editTime: string;
  lastEdit: string;
  addTime: string;
  enteredBy: string;
};
