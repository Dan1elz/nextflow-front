import { LinkedProductsList } from "@/components/app/linked-products-list";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { CalendarEventResponseDto } from "@/interfaces/calendar-event.interface";
import { EVENT_SCOPE_LABELS } from "@/types/enums";
import { describeDateRule } from "@/utils/calendar-event.helpers";
import { formatDateOnly } from "@/utils/format.helpers";

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm wrap-anywhere">{value}</dd>
    </div>
  );
}

/** Visualizar evento do calendário: regra de data, próxima data (da API), antecedência e os produtos ligados. */
export function CalendarEventViewDialog({
  event,
  onClose,
}: {
  event: CalendarEventResponseDto | null;
  onClose: () => void;
}) {
  return (
    <Dialog open={event != null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        {event && (
          <>
            <DialogHeader>
              <DialogTitle className="flex flex-wrap items-center gap-2">
                {event.name}
                <Badge variant="outline">
                  {EVENT_SCOPE_LABELS[event.scope]}
                </Badge>
                {!event.isActive && <Badge variant="secondary">Inativo</Badge>}
              </DialogTitle>
              <DialogDescription>{describeDateRule(event)}</DialogDescription>
            </DialogHeader>

            <div className="flex items-baseline justify-between gap-4 rounded-xl border p-4">
              <span className="text-sm text-muted-foreground">
                Próxima data
              </span>
              <span className="text-2xl font-semibold text-primary tabular-nums">
                {formatDateOnly(event.nextDate)}
              </span>
            </div>

            <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
              <Info
                label="Antecedência"
                value={`${event.leadDays} ${event.leadDays === 1 ? "dia" : "dias"}`}
              />
              <Info label="Produtos" value={String(event.productCount)} />
            </dl>

            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium">Produtos ligados</span>
              <LinkedProductsList
                filters={{ eventId: event.id }}
                emptyText="Nenhum produto ativo ligado a este evento."
              />
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
