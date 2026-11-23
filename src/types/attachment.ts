/** A stored file (company / project attachment). */
export type AttachmentDto = {
  id: string;
  fileName: string;
  contentType: string;
  sizeBytes: number;
  /** ISO UTC */
  createdAt: string;
  createdByName: string | null;
};
