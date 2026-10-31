import { z } from "zod";

/** A regra dos 2 níveis (RN-CE23) e o nome único entre irmãs (RN-CE38) são da API. */
export const categorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Informe o nome.")
    .max(100, "O nome deve ter no máximo 100 caracteres."),
  description: z
    .string()
    .max(500, "A descrição deve ter no máximo 500 caracteres."),
  parentId: z.string(),
});

export type CategoryFormData = z.infer<typeof categorySchema>;
