import { createContext } from "react";

import type { IIndexParams, IPaginationInfo } from "@/interfaces/api.interface";
import type {
  CalendarEventRequestDto,
  CalendarEventResponseDto,
} from "@/interfaces/calendar-event.interface";

export type CalendarEventsContextType = {
  calendarEvents: CalendarEventResponseDto[];
  pagination: IPaginationInfo | null;
  searchCalendarEvents: (query?: IIndexParams) => Promise<void>;
  createCalendarEvent: (dto: CalendarEventRequestDto) => Promise<void>;
  updateCalendarEvent: (
    id: string,
    dto: CalendarEventRequestDto
  ) => Promise<void>;
  deleteCalendarEvent: (id: string) => Promise<void>;
  reactivateCalendarEvent: (id: string) => Promise<void>;
};

export const CalendarEventsContext =
  createContext<CalendarEventsContextType | null>(null);
