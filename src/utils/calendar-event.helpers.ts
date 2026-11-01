import type { CalendarEventResponseDto } from "@/interfaces/calendar-event.interface";
import { DATE_RULE_LABELS, TDateRule } from "@/types/enums";

export const MONTH_LABELS = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
];

/** Índice igual ao `weekday` da API: 0 = domingo. */
export const WEEKDAY_LABELS = [
  "domingo",
  "segunda-feira",
  "terça-feira",
  "quarta-feira",
  "quinta-feira",
  "sexta-feira",
  "sábado",
];

/** Descreve a regra para leitura ("2º domingo de maio"). A data em si vem da API (`nextDate`). */
export function describeDateRule(event: CalendarEventResponseDto): string {
  const month = event.month ? MONTH_LABELS[event.month - 1] : "";

  switch (event.dateRule) {
    case TDateRule.Fixed:
      return `${event.day} de ${month}`;
    case TDateRule.NthWeekday:
      return event.nthWeekday
        ? `${event.nthWeekday.nth}${isMasculineWeekday(event.nthWeekday.weekday) ? "º" : "ª"} ${WEEKDAY_LABELS[event.nthWeekday.weekday]} de ${month}`
        : DATE_RULE_LABELS.NthWeekday;
    case TDateRule.EasterOffset:
      return describeEasterOffset(event.easterOffsetDays ?? 0);
    default:
      return DATE_RULE_LABELS[event.dateRule];
  }
}

/** Domingo e sábado pedem "2º"; os demais, "3ª segunda-feira". */
function isMasculineWeekday(weekday: number): boolean {
  return weekday === 0 || weekday === 6;
}

function describeEasterOffset(days: number): string {
  if (days === 0) return "No dia da Páscoa";
  const count = Math.abs(days);
  const unit = count === 1 ? "dia" : "dias";
  return `${count} ${unit} ${days < 0 ? "antes" : "depois"} da Páscoa`;
}
