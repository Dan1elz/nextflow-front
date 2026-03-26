import { z } from "zod";
import { TPaymentMethod } from "@/types/enums";

export const paymentSchema = z.object({
  amount: z.coerce
    .number({ message: "Insira um valor numérico" })
    .min(0.01, "O valor deve ser de pelo menos R$ 0,01"),
  paymentMethod: z.coerce
    .number()
    .refine(
      (val) => Object.values(TPaymentMethod).includes(val as TPaymentMethod),
      { message: "Método de pagamento inválido" }
    ),
});

export const createSaleSchema = z.object({
  orderId: z.string().uuid("Pedido inválido"),
  payments: z
    .array(paymentSchema)
    .min(1, "É necessário ao menos um pagamento para finalizar a venda"),
});

export type PaymentSchema = z.infer<typeof paymentSchema>;
export type CreateSaleSchema = z.infer<typeof createSaleSchema>;
