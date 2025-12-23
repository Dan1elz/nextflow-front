import { z } from "zod";
import { validateEmail } from "@/utils/validators";

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email é obrigatório")
    .refine((email) => validateEmail(email), {
      message: "Email inválido",
    }),
  password: z
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
    ),
});

export type LoginFormData = z.infer<typeof loginSchema>;
