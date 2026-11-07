import { z } from "zod";

import { parsePrice } from "./product.schema";

/** Formato do pedido de compra (T-CP2). Casas decimais do produto, mínimo, múltiplo e status ficam com a API. */
export const purchaseOrderSchema = z.object({
  supplierId: z.string().min(1, "Escolha o fornecedor."),
  receiveLocationId: z.string().min(1, "Escolha o local de entrega."),
  note: z.string().max(500, "A observação aceita até 500 caracteres."),
  items: z
    .array(
      z.object({
        id: z.string().nullable(),
        variantId: z.string().min(1),
        quantity: z
          .string()
          .refine(
            (v) => parsePrice(v) > 0,
            "A quantidade precisa ser maior que zero."
          ),
        unitCost: z
          .string()
          .refine(
            (v) => v.trim() !== "" && parsePrice(v) >= 0,
            "Informe um custo maior ou igual a zero."
          ),
      })
    )
    .min(1, "Inclua ao menos um item."),
});

export type PurchaseOrderFormData = z.infer<typeof purchaseOrderSchema>;

export const cancelPurchaseOrderSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(1, "Informe o motivo do cancelamento.")
    .max(500, "O motivo aceita até 500 caracteres."),
});

export type CancelPurchaseOrderFormData = z.infer<
  typeof cancelPurchaseOrderSchema
>;
