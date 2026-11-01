import type { TDateRule, TEventScope } from "@/types/enums";

/** `weekday` de 0 (domingo) a 6 (sábado); `nth` de 1 a 4. */
export interface NthWeekdayDto {
  weekday: number;
  nth: number;
}

export interface CalendarEventRequestDto {
  name: string;
  dateRule: TDateRule;
  month?: number | null;
  day?: number | null;
  nthWeekday?: NthWeekdayDto | null;
  easterOffsetDays?: number | null;
  leadDays: number;
}

/** `nextDate` vem calculado da API (RN-CE46); `productCount` fica zero até a F1.4. */
export interface CalendarEventResponseDto {
  id: string;
  name: string;
  scope: TEventScope;
  dateRule: TDateRule;
  month?: number | null;
  day?: number | null;
  nthWeekday?: NthWeekdayDto | null;
  easterOffsetDays?: number | null;
  leadDays: number;
  nextDate: string;
  productCount: number;
  isActive: boolean;
}
