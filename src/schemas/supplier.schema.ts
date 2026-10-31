import { z } from "zod";
import { validateCnpj } from "@/utils/validators";

/** CNPJ único (a unicidade é da API) e válido (RN-CD02); prazo de 1 a 180 dias (RN-CD03). */
export const supplierSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Informe o nome.")
    .max(150, "O nome deve ter no máximo 150 caracteres."),
  cnpj: z
    .string()
    .min(1, "Informe o CNPJ.")
    .refine(validateCnpj, { message: "Informe um CNPJ válido." }),
  leadTimeDays: z.string().refine(
    (value) => {
      const days = Number(value);
      return Number.isInteger(days) && days >= 1 && days <= 180;
    },
    { message: "O prazo de entrega deve ser de 1 a 180 dias." }
  ),
  note: z.string().max(500, "A observação deve ter no máximo 500 caracteres."),
});

export type SupplierFormData = z.infer<typeof supplierSchema>;
