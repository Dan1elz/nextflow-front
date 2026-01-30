import { z } from "zod";
import { validateEmail, validatePhone } from "@/utils/validators";
import { formatOnlyNumbers } from "@/utils/format.helpers";

export const contactSchema = z.object({
  description: z
    .string()
    .min(1, "Descrição é obrigatória")
    .min(2, "Descrição deve ter no mínimo 2 caracteres")
    .max(100, "Descrição deve ter no máximo 100 caracteres"),
  fone: z
    .string()
    .optional()
    .refine(
      (v) => {
        const n = formatOnlyNumbers(v ?? "");
        return validatePhone(n);
      },
      { message: "Telefone inválido (10 ou 11 dígitos)" }
    ),
  email: z
    .string()
    .optional()
    .refine((v) => !v || !v.trim() || validateEmail(v), {
      message: "E-mail inválido",
    }),
});

export type ContactFormData = z.infer<typeof contactSchema>;
