import { z } from "zod";
import { personNameSchema } from "@/schemas/user.schema";
import { validateCpf, validateEmail } from "@/utils/validators";

/** CPF opcional, único e válido quando informado (RN-CD01, L-CP6). A unicidade é da API. */
export const clientSchema = z.object({
  name: personNameSchema("nome"),
  lastName: z
    .string()
    .max(100, "O sobrenome deve ter no máximo 100 caracteres."),
  cpf: z.string().refine((value) => !value || validateCpf(value), {
    message: "Informe um CPF válido.",
  }),
  birthDate: z.string(),
});

export type ClientFormData = z.infer<typeof clientSchema>;

/** Cadastro rápido na venda (T-CD4): nome, telefone com DDD e e-mail opcional; o resto completa depois em Pessoas. */
export const quickClientSchema = z.object({
  name: personNameSchema("nome"),
  phone: z
    .string()
    .min(1, "Informe o telefone.")
    .refine((value) => [10, 11].includes(value.replace(/\D/g, "").length), {
      message: "Informe um telefone com DDD.",
    }),
  email: z
    .string()
    .trim()
    .max(150, "O e-mail deve ter no máximo 150 caracteres.")
    .refine((value) => !value || validateEmail(value), {
      message: "Informe um e-mail válido.",
    }),
});

export type QuickClientFormData = z.infer<typeof quickClientSchema>;
