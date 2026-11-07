import { z } from "zod";
import { addDays, differenceInCalendarDays, format, parseISO } from "date-fns";

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

/** Converte uma Date (local) para DateOnly "yyyy-MM-dd". */
export function toDateOnlyString(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

/** Data de hoje (local) como DateOnly "yyyy-MM-dd". */
export function getTodayDateOnly(): string {
  return toDateOnlyString(new Date());
}

/** Converte DateOnly "yyyy-MM-dd" para Date local (meia-noite), sem deslocamento de fuso. */
export function parseDateOnly(value: string): Date {
  return parseISO(value.split("T")[0]);
}

/** Soma dias a uma DateOnly "yyyy-MM-dd". */
export function addDaysToDateOnly(value: string, days: number): string {
  return toDateOnlyString(addDays(parseDateOnly(value), days));
}

/** Diferença em dias de calendário (end - start) entre duas DateOnly. */
export function diffDateOnlyInDays(start: string, end: string): number {
  return differenceInCalendarDays(parseDateOnly(end), parseDateOnly(start));
}
