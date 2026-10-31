import { z } from "zod";
import { formatOnlyNumbers } from "@/utils/format.helpers";

export const addressSchema = z.object({
  zipCode: z.string().refine((value) => formatOnlyNumbers(value).length === 8, {
    message: "Informe um CEP com 8 dígitos.",
  }),
  street: z
    .string()
    .trim()
    .min(1, "Informe a rua.")
    .max(150, "A rua deve ter no máximo 150 caracteres."),
  number: z
    .string()
    .trim()
    .min(1, "Informe o número.")
    .max(20, "O número deve ter no máximo 20 caracteres."),
  complement: z
    .string()
    .max(100, "O complemento deve ter no máximo 100 caracteres."),
  neighborhood: z
    .string()
    .trim()
    .min(1, "Informe o bairro.")
    .max(100, "O bairro deve ter no máximo 100 caracteres."),
  cityId: z.string().min(1, "Informe a cidade."),
  isMain: z.boolean(),
});

export type AddressFormData = z.infer<typeof addressSchema>;
