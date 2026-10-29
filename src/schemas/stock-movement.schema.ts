import { z } from "zod";
import { TLegacyMovementType } from "@/types/enums";

export const stockMovementSchema = z.object({
  productId: z
    .string()
    .min(1, "O Produto é obrigatório.")
    .uuid("Selecione um produto válido.")
    .optional(), // Passivo de ser escondido

  description: z
    .string()
    .max(255, "A descrição não pode exceder 255 caracteres.")
    .optional(),

  movementType: z.coerce
    .number()
    .refine(
      (val) =>
        val === TLegacyMovementType.Entry ||
        val === TLegacyMovementType.Exit ||
        val === TLegacyMovementType.Adjustment,
      { message: "Apenas Entrada, Remoção ou Ajuste são permitidos aqui." }
    ),

  quantity: z.coerce
    .number()
    .min(0.01, "A quantidade deve ser maior que zero."),
});

export type StockMovementSchema = z.infer<typeof stockMovementSchema>;
