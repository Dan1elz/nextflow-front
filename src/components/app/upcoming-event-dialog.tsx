import { useNavigate } from "react-router-dom";
import { CalendarDays } from "lucide-react";

import { LinkedProductsList } from "@/components/app/linked-products-list";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { IUpcomingEvent } from "@/interfaces/dashboard.interface";
import { formatDateOnly } from "@/utils/format.helpers";

/** Próxima data: os produtos ligados ao evento, e o calendário completo. */
export function UpcomingEventDialog({
  event,
  onClose,
}: {
  event: IUpcomingEvent | null;
  onClose: () => void;
}) {
  const navigate = useNavigate();
  return (
    <Dialog open={event != null} onOpenChange={(value) => !value && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        {event && (
          <>
            <DialogHeader>
              <DialogTitle>{event.name}</DialogTitle>
              <DialogDescription>
                {formatDateOnly(event.nextDate)} · procura sobe a partir de{" "}
                {formatDateOnly(event.demandStartsOn)}
              </DialogDescription>
            </DialogHeader>
            <LinkedProductsList
              filters={{ eventId: event.eventId }}
              emptyText="Nenhum produto ativo ligado a esta data."
            />
            <Button
              variant="outline"
              onClick={() => navigate("/calendar-events")}
            >
              <CalendarDays />
              Ver calendário completo
            </Button>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
