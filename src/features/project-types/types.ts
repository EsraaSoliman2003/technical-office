export type ProjectTypeForm = {
  name: string;
};

export type ProjectType = ProjectTypeForm & {
  id: number;
  editTime: string;
  lastEdit: string;
  addTime: string;
  enteredBy: string;
};
