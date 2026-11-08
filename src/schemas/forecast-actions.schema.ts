import { z } from "zod";

import { TDismissReason } from "@/types/enums";
import { diffDateOnlyInDays } from "@/utils/date.helpers";

/** Promover todas as variações (sem `variantIds`). */
export const ALL_VARIANTS = "all";
export const SELECTED_VARIANTS = "selected";

/**
 * Espelha o `ApplyPromotionDtoValidator` (T-DF6, RN-VD10): desconto de 1% a 90% e término a partir do início.
 * Início a partir de hoje, sobreposição e preço abaixo do custo são conferidos pela API.
 */
export const applyPromotionSchema = z
  .object({
    discountPercent: z.string().refine(
      (value) => {
        const number = Number(value.replace(",", "."));
        return value.trim() !== "" && number >= 1 && number <= 90;
      },
      { message: "O desconto deve ser de 1% a 90%." }
    ),
    startDate: z.string().min(1, "Informe o início."),
    endDate: z.string().min(1, "Informe o término."),
    scope: z.enum([ALL_VARIANTS, SELECTED_VARIANTS]),
    variantIds: z.array(z.string()),
  })
  .superRefine((data, ctx) => {
    if (
      data.startDate &&
      data.endDate &&
      diffDateOnlyInDays(data.startDate, data.endDate) < 0
    )
      ctx.addIssue({
        code: "custom",
        path: ["endDate"],
        message: "O término deve ser igual ou depois do início.",
      });
    if (data.scope === SELECTED_VARIANTS && data.variantIds.length === 0)
      ctx.addIssue({
        code: "custom",
        path: ["variantIds"],
        message: "Escolha ao menos uma variação.",
      });
  });

export type ApplyPromotionFormData = z.infer<typeof applyPromotionSchema>;

/** Sem motivo escolhido. */
export const NO_REASON = "";

/** Espelha o `DismissRecommendationDtoValidator` (T-DF8): "Outro" exige o texto; até 255 caracteres. */
export const dismissSchema = z
  .object({
    reasonCode: z.string(),
    note: z.string().max(255, "O motivo aceita até 255 caracteres."),
  })
  .superRefine((data, ctx) => {
    if (data.reasonCode === TDismissReason.Other && !data.note.trim())
      ctx.addIssue({
        code: "custom",
        path: ["note"],
        message: "Descreva o motivo.",
      });
  });

export type DismissFormData = z.infer<typeof dismissSchema>;
