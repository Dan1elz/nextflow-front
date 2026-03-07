import { z } from "zod";
import { TMovementType } from "@/types/enums";

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
        val === TMovementType.Entry ||
        val === TMovementType.Exit ||
        val === TMovementType.Adjustment,
      { message: "Apenas Entrada, Remoção ou Ajuste são permitidos aqui." }
    ),

  quantity: z.coerce
    .number()
    .min(0.01, "A quantidade deve ser maior que zero."),
});

export type StockMovementSchema = z.infer<typeof stockMovementSchema>;
