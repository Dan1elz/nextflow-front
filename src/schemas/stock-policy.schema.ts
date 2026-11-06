import { z } from "zod";

const days = (label: string) =>
  z
    .string()
    .trim()
    .refine((value) => {
      const number = Number(value);
      return (
        value !== "" && Number.isInteger(number) && number >= 0 && number <= 365
      );
    }, `${label} deve ser um número inteiro de 0 a 365.`);

/** Espelha o `StockPolicyRequestDtoValidator` da API (T13, RN-CE29). */
export const stockPolicySchema = z.object({
  targetCoverageDays: days("A cobertura alvo"),
  safetyDays: days("Os dias de segurança"),
});

export type StockPolicyFormData = z.infer<typeof stockPolicySchema>;
