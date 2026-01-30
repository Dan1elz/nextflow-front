import { z } from "zod";
import { validateCpf } from "@/utils/validators";
import { formatOnlyNumbers } from "@/utils/format.helpers";

const birthDateSchema = z
  .string()
  .min(1, "Data de nascimento é obrigatória")
  .refine(
    (date) => {
      const year = new Date(date).getFullYear();
      return year >= 1900;
    },
    { message: "Ano deve ser a partir de 1900" }
  );

export const createClientSchema = z.object({
  name: z
    .string()
    .min(1, "Nome é obrigatório")
    .min(2, "Nome deve ter no mínimo 2 caracteres")
    .max(25, "Nome deve ter no máximo 25 caracteres"),
  lastName: z
    .string()
    .min(1, "Sobrenome é obrigatório")
    .min(2, "Sobrenome deve ter no mínimo 2 caracteres")
    .max(25, "Sobrenome deve ter no máximo 25 caracteres"),
  cpf: z
    .string()
    .optional()
    .refine((v) => !v || !v.trim() || validateCpf(formatOnlyNumbers(v)), {
      message: "CPF inválido",
    }),
  birthDate: birthDateSchema,
});

export const updateClientSchema = createClientSchema;

export type CreateClientFormData = z.infer<typeof createClientSchema>;
export type UpdateClientFormData = z.infer<typeof updateClientSchema>;
