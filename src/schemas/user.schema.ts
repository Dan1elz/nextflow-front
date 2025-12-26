import { z } from "zod";
import { validateEmail, validateCpf } from "@/utils/validators";
import { formatOnlyNumbers } from "@/utils/format.helpers";

const passwordSchema = z
  .string()
  .min(1, "Senha é obrigatória")
  .min(8, "A senha deve ter no mínimo 8 caracteres")
  .refine(
    (password) => /[A-Z]/.test(password),
    "A senha deve conter pelo menos uma letra maiúscula"
  )
  .refine(
    (password) => /[a-z]/.test(password),
    "A senha deve conter pelo menos uma letra minúscula"
  )
  .refine(
    (password) => /\d/.test(password),
    "A senha deve conter pelo menos um número"
  )
  .refine(
    (password) => /[!@#$%^&*(),.?":{}|<>]/.test(password),
    "A senha deve conter pelo menos um caractere especial"
  );

export const createUserSchema = z.object({
  name: z
    .string()
    .min(1, "Nome é obrigatório")
    .min(2, "Nome deve ter no mínimo 2 caracteres"),
  lastName: z
    .string()
    .min(1, "Sobrenome é obrigatório")
    .min(2, "Sobrenome deve ter no mínimo 2 caracteres"),
  email: z
    .string()
    .min(1, "Email é obrigatório")
    .refine((email) => validateEmail(email), {
      message: "Email inválido",
    }),
  cpf: z
    .string()
    .min(1, "CPF é obrigatório")
    .refine(
      (cpf) => {
        const numbers = formatOnlyNumbers(cpf);
        return validateCpf(numbers);
      },
      {
        message: "CPF inválido",
      }
    ),
  password: passwordSchema,
});

export const updateUserSchema = z.object({
  name: z
    .string()
    .min(1, "Nome é obrigatório")
    .min(2, "Nome deve ter no mínimo 2 caracteres"),
  lastName: z
    .string()
    .min(1, "Sobrenome é obrigatório")
    .min(2, "Sobrenome deve ter no mínimo 2 caracteres"),
  email: z
    .string()
    .min(1, "Email é obrigatório")
    .refine((email) => validateEmail(email), {
      message: "Email inválido",
    }),
  cpf: z
    .string()
    .min(1, "CPF é obrigatório")
    .refine(
      (cpf) => {
        const numbers = formatOnlyNumbers(cpf);
        return validateCpf(numbers);
      },
      {
        message: "CPF inválido",
      }
    ),
});

export type CreateUserFormData = z.infer<typeof createUserSchema>;
export type UpdateUserFormData = z.infer<typeof updateUserSchema>;
