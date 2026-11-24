import { z } from "zod";
import { checkDecimal, parseDecimal } from "@/lib/numbers";
import { PROJECT_STATUSES } from "@/lib/projectStatus";
import { decimalText } from "./decimalText";

export const MAX_PROJECT_MATERIALS = 50;

export const getProjectSchema = () => {
  return z.object({
    name: z
      .string()
      .trim()
      .min(1, { message: "الاسم مطلوب" })
      .max(200, { message: "الاسم يجب ألا يزيد عن 200 حرف" }),
    allocatedAmount: decimalText("المخصص مطلوب"),
    status: z.enum(PROJECT_STATUSES, { message: "اختر موقف المشروع" }),
    progressPercent: decimalText("نسبة التنفيذ مطلوبة").refine(
      (value) => checkDecimal(value) !== "ok" || (parseDecimal(value) ?? 0) <= 100,
      { message: "نسبة التنفيذ يجب أن تكون بين 0 و 100" }
    ),
    /** "yyyy-MM-dd" from the date input, or "" (no date). */
    completionDate: z.string().refine((value) => value === "" || /^\d{4}-\d{2}-\d{2}$/.test(value), {
      message: "تاريخ غير صحيح",
    }),
    materials: z
      .array(
        z.object({
          materialId: z.string().min(1, { message: "اختر الخامة" }),
          value: decimalText("القيمة مطلوبة"),
        })
      )
      .max(MAX_PROJECT_MATERIALS, { message: `لا يمكن إضافة أكثر من ${MAX_PROJECT_MATERIALS} خامة` })
      .superRefine((rows, ctx) => {
        const seen = new Set<string>();
        rows.forEach((row, index) => {
          if (!row.materialId) return;
          if (seen.has(row.materialId)) {
            ctx.addIssue({ code: "custom", path: [index, "materialId"], message: "هذه الخامة مضافة من قبل" });
          }
          seen.add(row.materialId);
        });
      }),
  });
};

export type ProjectSchemaType = z.infer<ReturnType<typeof getProjectSchema>>;
