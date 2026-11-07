import { z } from "zod";
import { diffDateOnlyInDays, getTodayDateOnly } from "@/utils/date.helpers";

export const PROMOTION_MAX_DAYS = 90;

const dateOnlyRequired = (message: string) =>
  z
    .string({ message })
    .min(1, message)
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida. Use o formato dd/mm/aaaa.");

/**
 * Promoção (criação manual ou a partir de recomendação da IA).
 * Regras espelham o backend: desconto 1–90%, início ≥ hoje, fim ≥ início, período máx. 90 dias.
 */
export const promotionSchema = z
  .object({
    productId: z
      .string({ message: "Selecione um produto." })
      .min(1, "Selecione um produto."),
    discountPercent: z
      .number({ message: "Informe o percentual de desconto." })
      .min(1, "O desconto deve ser de no mínimo 1%.")
      .max(90, "O desconto deve ser de no máximo 90%."),
    startDate: dateOnlyRequired("Informe a data de início."),
    endDate: dateOnlyRequired("Informe a data de término."),
    reason: z
      .string()
      .max(255, "O motivo não pode exceder 255 caracteres.")
      .optional(),
  })
  .superRefine((data, ctx) => {
    if (!data.startDate || !data.endDate) return;
    if (data.startDate < getTodayDateOnly()) {
      ctx.addIssue({
        code: "custom",
        path: ["startDate"],
        message: "A data de início não pode ser anterior a hoje.",
      });
    }
    const days = diffDateOnlyInDays(data.startDate, data.endDate);
    if (days < 0) {
      ctx.addIssue({
        code: "custom",
        path: ["endDate"],
        message: "A data de término deve ser igual ou posterior ao início.",
      });
    } else if (days + 1 > PROMOTION_MAX_DAYS) {
      // período inclusivo (início e término contam), igual ao backend
      ctx.addIssue({
        code: "custom",
        path: ["endDate"],
        message: `O período da promoção pode ter no máximo ${PROMOTION_MAX_DAYS} dias.`,
      });
    }
  });

export type PromotionSchema = z.infer<typeof promotionSchema>;
