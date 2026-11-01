import { z } from "zod";

import { TDateRule } from "@/types/enums";

const NON_LEAP_YEAR = 2025;

const isIntegerBetween = (value: string, min: number, max: number) => {
  if (value.trim() === "") return false;
  const number = Number(value);
  return Number.isInteger(number) && number >= min && number <= max;
};

const dateRules = Object.values(TDateRule) as [TDateRule, ...TDateRule[]];

/** Espelha o `CalendarEventRequestDtoValidator` da API: cada regra de data pede os próprios campos (RN-CE41). */
export const calendarEventSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Informe o nome.")
      .max(100, "O nome deve ter no máximo 100 caracteres."),
    dateRule: z.enum(dateRules),
    month: z.string(),
    day: z.string(),
    nthWeekday: z.object({ weekday: z.string(), nth: z.string() }),
    easterOffsetDays: z.string(),
    leadDays: z.string().refine((value) => isIntegerBetween(value, 0, 120), {
      message: "A antecedência deve ser de 0 a 120 dias.",
    }),
  })
  .superRefine((data, context) => {
    const fail = (path: (string | number)[], message: string) =>
      context.addIssue({ code: "custom", path, message });

    if (
      (data.dateRule === TDateRule.Fixed ||
        data.dateRule === TDateRule.NthWeekday) &&
      !isIntegerBetween(data.month, 1, 12)
    ) {
      fail(["month"], "Informe o mês.");
    }

    if (data.dateRule === TDateRule.Fixed) {
      const month = Number(data.month);
      const lastDay = isIntegerBetween(data.month, 1, 12)
        ? new Date(NON_LEAP_YEAR, month, 0).getDate()
        : 31;
      if (data.day.trim() === "") {
        fail(["day"], "Informe o dia.");
      } else if (month === 2 && Number(data.day) === 29) {
        fail(
          ["day"],
          "29 de fevereiro não é aceito, porque não existe em todos os anos."
        );
      } else if (!isIntegerBetween(data.day, 1, lastDay)) {
        fail(["day"], "Este dia não existe no mês informado.");
      }
    }

    if (data.dateRule === TDateRule.NthWeekday) {
      if (!isIntegerBetween(data.nthWeekday.weekday, 0, 6)) {
        fail(["nthWeekday", "weekday"], "Informe o dia da semana.");
      }
      if (!isIntegerBetween(data.nthWeekday.nth, 1, 4)) {
        fail(["nthWeekday", "nth"], "Informe a ocorrência no mês.");
      }
    }

    if (
      data.dateRule === TDateRule.EasterOffset &&
      !isIntegerBetween(data.easterOffsetDays, -60, 60)
    ) {
      fail(
        ["easterOffsetDays"],
        "Os dias a partir da Páscoa devem ser de -60 a 60."
      );
    }
  });

export type CalendarEventFormData = z.infer<typeof calendarEventSchema>;
