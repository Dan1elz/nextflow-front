import { useContext } from "react";
import { CalendarEventsContext } from "@/contexts/calendar-events.context";

export function useCalendarEvents() {
  const context = useContext(CalendarEventsContext);

  if (!context) {
    throw new Error(
      "useCalendarEvents must be used within a CalendarEventsProvider"
    );
  }

  return context;
}
