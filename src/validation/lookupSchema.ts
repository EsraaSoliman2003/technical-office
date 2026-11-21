import { z } from "zod";

export const getLookupSchema = () => {
  return z.object({
    name: z
      .string()
      .trim()
      .min(1, { message: "الاسم مطلوب" })
      .max(200, { message: "الاسم يجب ألا يزيد عن 200 حرف" }),
  });
};

export type LookupSchemaType = z.infer<ReturnType<typeof getLookupSchema>>;
