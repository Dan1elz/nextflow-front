import { z } from "zod";

export const countrySchema = z.object({
  name: z
    .string()
    .min(1, "O Nome do país é obrigatório.")
    .min(2, "O Nome do país deve ter no mínimo 2 caracteres.")
    .max(100, "O Nome do país deve ter no máximo 100 caracteres."),
  acronymIso: z
    .string()
    .min(1, "O acrônimo do país é obrigatório.")
    .length(2, "O acrônimo do país deve ter exatamente 2 caracteres."),
  bacenCode: z
    .string()
    .optional()
    .refine(
      (value) => {
        if (!value || value.trim() === "") return true;
        return value.length >= 2 && value.length <= 255;
      },
      {
        message:
          "O código do Bacen deve ter no máximo 255 caracteres e no mínimo 2 caracteres.",
      }
    )
    .transform((val) => val || ""),
});

export type CountrySchema = z.infer<typeof countrySchema>;
