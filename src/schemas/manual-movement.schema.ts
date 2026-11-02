import { z } from "zod";

import { parsePrice } from "@/schemas/product.schema";
import { TMovementReason, TMovementType } from "@/types/enums";

/** Motivos que o T9 oferece; venda, compra, transferência e inventário nascem do próprio documento (RN-CE02). */
export const MANUAL_REASONS = [
  TMovementReason.Opening,
  TMovementReason.Adjustment,
  TMovementReason.Breakage,
  TMovementReason.Expired,
  TMovementReason.Theft,
  TMovementReason.InternalUse,
] as const;
export type TManualReason = (typeof MANUAL_REASONS)[number];

/** Sentido fixo por motivo; só o ajuste deixa escolher entrada ou saída. */
export const REASON_TYPE: Partial<Record<TManualReason, TMovementType>> = {
  Opening: TMovementType.In,
  Breakage: TMovementType.Out,
  Expired: TMovementType.Out,
  Theft: TMovementType.Out,
  InternalUse: TMovementType.Out,
};

const movementTypes = Object.values(TMovementType) as [
  TMovementType,
  ...TMovementType[],
];

/** Espelha o `ManualMovementRequestDtoValidator` da API (L4, L5). O saldo negativo (RN-CE32) só a API sabe. */
export const manualMovementSchema = z
  .object({
    variantId: z.string().min(1, "Escolha a variação."),
    locationId: z.string().min(1, "Escolha o local."),
    reason: z.enum(MANUAL_REASONS, { message: "Escolha o motivo." }),
    type: z.enum(movementTypes, { message: "Escolha entrada ou saída." }),
    quantity: z.string(),
    unitCost: z.string(),
    note: z
      .string()
      .max(500, "A observação deve ter no máximo 500 caracteres."),
  })
  .superRefine((data, context) => {
    const fail = (path: string, message: string) =>
      context.addIssue({ code: "custom", path: [path], message });

    const quantity = parsePrice(data.quantity);
    if (data.quantity.trim() === "" || !(quantity > 0))
      fail("quantity", "A quantidade precisa ser maior que zero.");

    if (data.reason === TMovementReason.Opening && data.unitCost.trim()) {
      const cost = parsePrice(data.unitCost);
      if (!(cost > 0)) fail("unitCost", "O custo precisa ser maior que zero.");
    }

    if (data.reason === TMovementReason.Adjustment && !data.note.trim())
      fail("note", "Informe a observação do ajuste.");
  });

export type ManualMovementFormData = z.infer<typeof manualMovementSchema>;
