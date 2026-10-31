import { z } from "zod";
import { personNameSchema } from "@/schemas/user.schema";

export const storeSchema = z.object({
  name: personNameSchema("nome"),
  defaultSaleLocationId: z.string(),
  defaultReceiveLocationId: z.string(),
});

export const updateStoreSchema = storeSchema.extend({
  defaultSaleLocationId: z.string().min(1, "Informe o local padrão de venda."),
  defaultReceiveLocationId: z
    .string()
    .min(1, "Informe o local padrão de recebimento."),
});

export const locationSchema = z.object({
  name: personNameSchema("nome"),
  isSellable: z.boolean(),
});

export type StoreFormData = z.infer<typeof storeSchema>;
export type LocationFormData = z.infer<typeof locationSchema>;
