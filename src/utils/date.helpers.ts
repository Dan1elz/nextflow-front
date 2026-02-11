import { z } from "zod";

/**
 * Schema Zod para data opcional (DateOnly no backend).
 * Aceita string vazia, null ou undefined. Quando preenchido, valida se é data válida.
 * Formato esperado: "YYYY-MM-DD" (saída do DatePicker) ou "dd/mm/aaaa" (input do usuário).
 */
export const dateOnlyOptionalSchema = z
  .string()
  .nullish()
  .or(z.literal(""))
  .refine(
    (v) => {
      if (!v || v === "") return true;
      const date = new Date(v);
      return !Number.isNaN(date.getTime());
    },
    { message: "Data inválida. Use o formato dd/mm/aaaa." }
  );
