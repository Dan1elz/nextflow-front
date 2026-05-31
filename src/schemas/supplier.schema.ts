import { z } from "zod";
import { validateCnpj } from "@/utils/validators";
import { formatOnlyNumbers } from "@/utils/format.helpers";

export const createSupplierSchema = z.object({
  name: z
    .string()
    .min(1, "O Nome do fornecedor é obrigatório.")
    .min(2, "O Nome do fornecedor deve ter no mínimo 2 caracteres.")
    .max(100, "O Nome do fornecedor deve ter no máximo 100 caracteres."),

  cnpj: z
    .string()
    .min(1, "O CNPJ do fornecedor é obrigatório.")
    .refine((v) => !v || !v.trim() || validateCnpj(formatOnlyNumbers(v)), {
      message: "CNPJ inválido",
    }),
  bacenCode: z.string().optional().or(z.literal("")),
});

export const updateSupplierSchema = createSupplierSchema;

export type CreateSupplierFormData = z.infer<typeof createSupplierSchema>;
export type UpdateSupplierFormData = z.infer<typeof updateSupplierSchema>;
