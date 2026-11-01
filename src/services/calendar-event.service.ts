import { BaseService } from "./base.service";
import type {
  CalendarEventRequestDto,
  CalendarEventResponseDto,
} from "@/interfaces/calendar-event.interface";

export const calendarEventService = new BaseService<
  CalendarEventResponseDto,
  CalendarEventRequestDto
>("calendar-events");
