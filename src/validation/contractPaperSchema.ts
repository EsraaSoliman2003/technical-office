import { z } from "zod";
import { dateText, notesText } from "./codeText";

export const MAX_PAPER_SUBJECT_LENGTH = 500;

/** The server's message for a تاريخ الخروج before تاريخ الاستلام. */
export const EXIT_BEFORE_RECEIVED_MESSAGE = "تاريخ الخروج يجب ألا يسبق تاريخ الاستلام";

export const getContractPaperSchema = () => {
  return z
    .object({
      subject: z
        .string()
        .trim()
        .min(1, { message: "بخصوص مطلوب" })
        .max(MAX_PAPER_SUBJECT_LENGTH, { message: `بخصوص يجب ألا يزيد عن ${MAX_PAPER_SUBJECT_LENGTH} حرف` }),
      receivedDate: dateText,
      exitDate: dateText,
      notes: notesText(),
    })
    .superRefine((values, context) => {
      // "yyyy-MM-dd" strings compare in date order.
      if (values.receivedDate && values.exitDate && values.exitDate < values.receivedDate) {
        context.addIssue({ code: "custom", path: ["exitDate"], message: EXIT_BEFORE_RECEIVED_MESSAGE });
      }
    });
};

/** Form values (what the fields hold). */
export type ContractPaperFormValues = z.input<ReturnType<typeof getContractPaperSchema>>;
/** Validated values (trimmed). */
export type ContractPaperSchemaType = z.output<ReturnType<typeof getContractPaperSchema>>;
