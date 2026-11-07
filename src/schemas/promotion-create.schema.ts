import { z } from "zod";

import { diffDateOnlyInDays } from "@/utils/date.helpers";

/** Todas as variações do produto (escopo sem `variantId`). */
export const ALL_VARIANTS = "all";

/**
 * Espelha o `PromotionRequestDtoValidator` da API (RN-VD10): 1% a 90%, fim no início ou depois, no máximo 90 dias
 * contando início e fim. Início a partir de hoje, sobreposição e custo são conferidos pela API.
 */
export const promotionCreateSchema = z
  .object({
    productId: z.string().min(1, "Escolha o produto."),
    variantId: z.string(),
    discountPercent: z.string().refine(
      (value) => {
        const number = Number(value.replace(",", "."));
        return value.trim() !== "" && number >= 1 && number <= 90;
      },
      { message: "O desconto deve ser de 1% a 90%." }
    ),
    startDate: z.string().min(1, "Informe o início."),
    endDate: z.string().min(1, "Informe o fim."),
    reason: z.string().max(200, "O motivo tem no máximo 200 caracteres."),
  })
  .superRefine((data, ctx) => {
    if (!data.startDate || !data.endDate) return;
    const days = diffDateOnlyInDays(data.startDate, data.endDate);
    if (days < 0)
      ctx.addIssue({
        code: "custom",
        path: ["endDate"],
        message: "O fim deve ser no início ou depois dele.",
      });
    else if (days + 1 > 90)
      ctx.addIssue({
        code: "custom",
        path: ["endDate"],
        message: "A promoção dura no máximo 90 dias, contando início e fim.",
      });
  });

export type PromotionCreateFormData = z.infer<typeof promotionCreateSchema>;

export const parsePercent = (value: string) => Number(value.replace(",", "."));
