import { z } from "zod";
import { validateCpf, validateEmail } from "@/utils/validators";

/** Espelha `CommonRules` da API. Senha forte (L-AC3): mínimo de 8 caracteres, com letra e número. */
export const passwordSchema = z
  .string()
  .min(1, "Informe a senha.")
  .min(8, "A senha deve ter ao menos 8 caracteres.")
  .max(100, "A senha deve ter no máximo 100 caracteres.")
  .refine((value) => /\p{L}/u.test(value), {
    message: "A senha precisa ter ao menos uma letra.",
  })
  .refine((value) => /\d/.test(value), {
    message: "A senha precisa ter ao menos um número.",
  });

export const personNameSchema = (label: string) =>
  z
    .string()
    .trim()
    .min(1, `Informe o ${label}.`)
    .max(100, `O ${label} deve ter no máximo 100 caracteres.`);

export const emailSchema = z
  .string()
  .trim()
  .min(1, "Informe o e-mail.")
  .max(150, "O e-mail deve ter no máximo 150 caracteres.")
  .refine(validateEmail, { message: "Informe um e-mail válido." });

const baseFields = {
  name: personNameSchema("nome"),
  lastName: personNameSchema("sobrenome"),
  birthDate: z.string().min(1, "Informe a data de nascimento."),
  email: emailSchema,
};

export const createUserSchema = z.object({
  ...baseFields,
  cpf: z
    .string()
    .min(1, "Informe o CPF.")
    .refine(validateCpf, { message: "Informe um CPF válido." }),
  password: passwordSchema,
  newPassword: z.string(),
});

/** Na edição o CPF não muda e a senha só troca se "nova senha" vier preenchida (T-AC3). */
export const updateUserSchema = z.object({
  ...baseFields,
  cpf: z.string(),
  password: z.string(),
  newPassword: z.union([z.literal(""), passwordSchema]),
});

export type UserFormData = z.infer<typeof createUserSchema>;
