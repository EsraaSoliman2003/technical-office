import { z } from "zod";

export const getRegisterSchema = () => {
  return z
    .object({
      name: z
        .string()
        .min(5, { message: "Full name must be at least 5 characters" }),

      email: z
        .string()
        .min(1, { message: "Email is required" })
        .email(),

      phone: z.string().min(1, { message: "Phone number is required" }),

      password: z
        .string()
        .min(8, { message: "Password must be at least 8 characters" })
        .regex(/[a-z]/, {
          message: "Password must include a lowercase letter",
        })
        .regex(/[A-Z]/, {
          message: "Password must include an uppercase letter",
        })
        .regex(/[^a-zA-Z0-9]/, {
          message: "Password must include a special character",
        }),

      password_confirmation: z
        .string()
        .min(1, {
          message: "Password confirmation is required",
        }),
    })
    .refine(
      (data) => data.password === data.password_confirmation,
      {
        message: "Passwords do not match",
        path: ["password_confirmation"],
      }
    );
};

export type RegisterSchemaType = z.infer<
  ReturnType<typeof getRegisterSchema>
>;