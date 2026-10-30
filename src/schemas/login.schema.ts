import { z } from "zod";

/**
 * Só presença: o formato do e-mail é do validator da API (422 por campo, via `useApiForm`), e a política de senha não
 * vale no login (RN-AC03: credencial errada tem mensagem genérica).
 */
export const loginSchema = z.object({
  email: z.string().min(1, "Informe o e-mail."),
  password: z.string().min(1, "Informe a senha."),
});

export type LoginFormData = z.infer<typeof loginSchema>;
