import { useCallback, useState, type ReactNode } from "react";

import { CalendarEventsContext } from "@/contexts/calendar-events.context";
import { useAuth } from "@/hooks/use-auth";
import type { IIndexParams, IPaginationInfo } from "@/interfaces/api.interface";
import type {
  CalendarEventRequestDto,
  CalendarEventResponseDto,
} from "@/interfaces/calendar-event.interface";
import { calendarEventService } from "@/services/calendar-event.service";

export function CalendarEventsProvider({ children }: { children: ReactNode }) {
  const [calendarEvents, setCalendarEvents] = useState<
    CalendarEventResponseDto[]
  >([]);
  const [pagination, setPagination] = useState<IPaginationInfo | null>(null);
  const { token } = useAuth();
  const auth = token ?? undefined;

  const searchCalendarEvents = useCallback(
    async (query?: IIndexParams) => {
      const page = query?.page ?? 1;
      const perPage = query?.perPage ?? 10;
      const response = await calendarEventService.getAll(query, auth);
      setCalendarEvents(response.items || []);
      setPagination({
        currentPage: page,
        lastPage: Math.ceil(response.total / perPage) || 1,
        total: response.total,
        perPage,
      });
    },
    [auth]
  );

  const createCalendarEvent = useCallback(
    async (dto: CalendarEventRequestDto) => {
      await calendarEventService.create(dto, auth);
    },
    [auth]
  );

  const updateCalendarEvent = useCallback(
    async (id: string, dto: CalendarEventRequestDto) => {
      await calendarEventService.update(id, dto, auth);
    },
    [auth]
  );

  const deleteCalendarEvent = useCallback(
    async (id: string) => {
      await calendarEventService.delete(id, auth);
    },
    [auth]
  );

  const reactivateCalendarEvent = useCallback(
    async (id: string) => {
      await calendarEventService.reactivate(id, auth);
    },
    [auth]
  );

  return (
    <CalendarEventsContext.Provider
      value={{
        calendarEvents,
        pagination,
        searchCalendarEvents,
        createCalendarEvent,
        updateCalendarEvent,
        deleteCalendarEvent,
        reactivateCalendarEvent,
      }}
    >
      {children}
    </CalendarEventsContext.Provider>
  );
}
