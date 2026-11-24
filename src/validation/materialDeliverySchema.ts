import { z } from "zod";
import { codeText, dateText, notesText, optionalText } from "./codeText";
import { quantityText } from "./decimalText";

/** Ids of the optional dropdowns: "" = none. */
const optionalId = z.string();

export const getMaterialDeliverySchema = () => {
  return z.object({
    authorizationNumber: codeText(50, "رقم التفويض"),
    projectTypeId: optionalId,
    projectId: z.string().min(1, { message: "اختر المشروع" }),
    billOfLadingNumber: codeText(50, "رقم البوليصة"),
    billDate: dateText,
    quantity: quantityText(),
    materialId: z.string().min(1, { message: "اختر الخامة" }),
    loadingPermitNumber: codeText(50, "اذن التحميل"),
    salesOrderNumber: codeText(50, "رقم امر البيع"),
    vehicleNumber: codeText(50, "رقم السيارة"),
    driverName: optionalText(200, "اسم السائق يجب ألا يزيد عن 200 حرف"),
    factoryId: optionalId,
    mixerId: optionalId,
    transportCompanyId: optionalId,
    receivedDate: dateText,
    exitDate: dateText,
    notes: notesText(),
  });
};

/** Form values (what the fields hold). */
export type MaterialDeliveryFormValues = z.input<ReturnType<typeof getMaterialDeliverySchema>>;
/** Validated values (trimmed, Latin digits). */
export type MaterialDeliverySchemaType = z.output<ReturnType<typeof getMaterialDeliverySchema>>;
