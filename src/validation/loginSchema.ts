import { z } from "zod";

export const getLoginSchema = () => {
  return z.object({
    login: z
      .string()
      .min(1, { message: "Login is required" }),

    password: z
      .string()
      .min(1, { message: "Password is required" }),

  });
};

export type LoginSchemaType = z.infer<
  ReturnType<typeof getLoginSchema>
>;