import { z } from "zod";
import { validateCep } from "@/utils/validators";
import { formatOnlyNumbers } from "@/utils/format.helpers";

export const addressSchema = z.object({
  description: z
    .string()
    .min(1, "Descrição é obrigatória")
    .min(2, "Descrição deve ter no mínimo 2 caracteres")
    .max(100, "Descrição deve ter no máximo 100 caracteres"),
  street: z
    .string()
    .min(1, "Rua é obrigatória")
    .min(2, "Rua deve ter no mínimo 2 caracteres")
    .max(100, "Rua deve ter no máximo 100 caracteres"),
  number: z
    .string()
    .min(1, "Número é obrigatório")
    .max(10, "Número deve ter no máximo 10 caracteres"),
  district: z
    .string()
    .min(1, "Bairro é obrigatório")
    .max(100, "Bairro deve ter no máximo 100 caracteres"),
  stateId: z.string().min(1, "Estado é obrigatório"),
  cityId: z.string().min(1, "Cidade é obrigatória"),
  complement: z.string().max(100),
  zipCode: z
    .string()
    .min(1, "CEP é obrigatório")
    .refine(
      (cep) => {
        const numbers = formatOnlyNumbers(cep);
        return validateCep(numbers);
      },
      { message: "CEP inválido (8 dígitos)" }
    ),
});

export type AddressFormData = z.infer<typeof addressSchema>;
