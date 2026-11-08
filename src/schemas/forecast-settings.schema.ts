import { z } from "zod";

/** Espelha o `ForecastSettingsRequestDtoValidator` (T-DF11): dia 0 a 6, hora "HH:mm" e lote de 1 a 100 (RN-DF20). */
export const forecastSettingsSchema = z.object({
  scheduleEnabled: z.boolean(),
  weekday: z.string().regex(/^[0-6]$/, "Escolha o dia da semana."),
  time: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Informe a hora no formato HH:mm."),
  aiBatchSize: z.string().refine(
    (value) => {
      const number = Number(value);
      return Number.isInteger(number) && number >= 1 && number <= 100;
    },
    { message: "O lote da IA deve ter de 1 a 100 produtos." }
  ),
});

export type ForecastSettingsFormData = z.infer<typeof forecastSettingsSchema>;
