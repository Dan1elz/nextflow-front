import { z } from "zod";
import { personNameSchema } from "@/schemas/user.schema";
import { validateCpf } from "@/utils/validators";

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
