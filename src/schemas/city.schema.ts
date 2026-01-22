import { z } from "zod";

export const citySchema = z.object({
  name: z
    .string()
    .min(1, "O nome da cidade é obrigatório.")
    .min(2, "O nome da cidade deve ter no mínimo 2 caracteres.")
    .max(100, "O nome da cidade deve ter no máximo 100 caracteres."),
  ibgeCode: z
    .string()
    .min(1, "O código IBGE é obrigatório.")
    .length(7, "O código IBGE deve ter exatamente 7 caracteres.")
    .refine((value) => /^\d+$/.test(value), {
      message: "O código IBGE deve conter apenas números.",
    }),
  stateId: z
    .string()
    .min(1, "O estado é obrigatório.")
    .uuid("O identificador do estado deve ser um UUID válido."),
});

export type CitySchema = z.infer<typeof citySchema>;
