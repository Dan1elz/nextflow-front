import { z } from "zod";
import { TMovementType } from "@/types/enums";

export const stockMovementSchema = z.object({
  productId: z
    .string()
    .min(1, "O Produto é obrigatório.")
    .uuid("Selecione um produto válido.")
    .optional(), // Passivo de ser escondido

  userId: z
    .string()
    .min(1, "O Usuário é obrigatório.")
    .uuid("Usuário inválido."),

  description: z
    .string()
    .max(255, "A descrição não pode exceder 255 caracteres.")
    .optional(),

  movementType: z.coerce
    .number()
    .min(TMovementType.Entry, "Tipo de movimento obrigatório.")
    .max(TMovementType.Return, "Tipo de movimento inválido."),

  quantity: z.coerce
    .number()
    .min(0.01, "A quantidade deve ser maior que zero."),

  quote: z.coerce
    .number()
    .min(0, "A cotação não pode ser negativa."),
});

export type StockMovementSchema = z.infer<typeof stockMovementSchema>;
