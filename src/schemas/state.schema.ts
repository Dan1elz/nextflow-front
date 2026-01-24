import { z } from "zod";

export const stateSchema = z.object({
  name: z
    .string()
    .min(2, "O Nome do estado deve ter no mínimo 2 caracteres.")
    .max(100, "O Nome do estado deve ter no máximo 100 caracteres.")
    .refine((val) => val.trim().length > 0, "O Nome do estado é obrigatório."),

  acronym: z
    .string()
    .length(2, "O acrônimo do estado deve ter exatamente 2 caracteres.")
    .refine(
      (val) => val.trim().length > 0,
      "O acrônimo do estado é obrigatório."
    )
    .transform((val) => val.toUpperCase()),

  ibgeCode: z
    .string()
    .length(2, "O código IBGE deve ter exatamente 2 caracteres.")
    .refine((val) => val.trim().length > 0, "O código IBGE é obrigatório."),

  countryId: z
    .string()
    .uuid("Id do país inválido.")
    .min(1, "Id do país é obrigatório."),
});

export type StateSchema = z.infer<typeof stateSchema>;
