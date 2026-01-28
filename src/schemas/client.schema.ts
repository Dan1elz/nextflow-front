import { z } from "zod";
import { validateEmail, validateCpf } from "@/utils/validators";
import { formatOnlyNumbers } from "@/utils/format.helpers";

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
  email: z
    .string()
    .min(1, "E-mail é obrigatório")
    .min(5, "E-mail deve ter no mínimo 5 caracteres")
    .max(150, "E-mail deve ter no máximo 150 caracteres")
    .refine((email) => validateEmail(email), {
      message: "E-mail inválido",
    }),
  cpf: z
    .string()
    .optional()
    .refine((v) => !v || !v.trim() || validateCpf(formatOnlyNumbers(v)), {
      message: "CPF inválido",
    }),
});

export const updateClientSchema = createClientSchema;

export type CreateClientFormData = z.infer<typeof createClientSchema>;
export type UpdateClientFormData = z.infer<typeof updateClientSchema>;
