import { z } from "zod";

export const getLoginSchema = () => {
  return z.object({
    email: z
      .string()
      .trim()
      .min(1, { message: "البريد الإلكتروني مطلوب" })
      .email({ message: "البريد الإلكتروني غير صالح" }),

    password: z.string().min(1, { message: "كلمة المرور مطلوبة" }),
  });
};

export type LoginSchemaType = z.infer<ReturnType<typeof getLoginSchema>>;
