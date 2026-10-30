import { z } from "zod";
import {
  emailSchema,
  passwordSchema,
  personNameSchema,
} from "@/schemas/user.schema";

export const profileSchema = z.object({
  name: personNameSchema("nome"),
  lastName: personNameSchema("sobrenome"),
  email: emailSchema,
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Informe a senha atual."),
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1, "Confirme a nova senha."),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "A confirmação não confere com a nova senha.",
    path: ["confirmPassword"],
  });

export type ProfileFormData = z.infer<typeof profileSchema>;
export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;
