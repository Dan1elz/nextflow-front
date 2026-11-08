import { useCallback, useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Search } from "lucide-react";

import { CalendarEventViewDialog } from "@/components/app/calendar-event-view-dialog";
import { EntityIndexPage } from "@/components/app/entity-index-page";
import { ListFiltersSheet } from "@/components/app/list-filters-sheet";
import { NavActionColumn } from "@/components/app/nav-action-column";
import { SearchSelect } from "@/components/app/search-select";
import { CalendarEventForm } from "@/components/forms/calendar-event-form";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { useCalendarEvents } from "@/hooks/use-calendar-events";
import { useIndexSearch } from "@/hooks/use-index-search";
import type { IOption } from "@/interfaces/api.interface";
import type {
  CalendarEventRequestDto,
  CalendarEventResponseDto,
} from "@/interfaces/calendar-event.interface";
import { CalendarEventsProvider } from "@/providers/calendar-events.provider";
import type { CalendarEventFormData } from "@/schemas/calendar-event.schema";
import { EVENT_SCOPE_LABELS, TDateRule, TEventScope } from "@/types/enums";
import { describeDateRule } from "@/utils/calendar-event.helpers";
import { formatDateOnly } from "@/utils/format.helpers";
import { handleError, handleSuccess } from "@/utils/toast.helpers";

type CalendarEventFilters = {
  search: string;
  isActive: string;
  scope: string;
};

type CalendarEventDialog = { event: CalendarEventResponseDto | null } | null;

const statusOptions: IOption[] = [
  { value: "true", label: "Ativo" },
  { value: "false", label: "Inativo" },
];

const scopeOptions: IOption[] = Object.values(TEventScope).map((value) => ({
  value,
  label: EVENT_SCOPE_LABELS[value],
}));

/** Só vão os campos da regra escolhida (RN-CE41). */
function toRequestDto(data: CalendarEventFormData): CalendarEventRequestDto {
  const { dateRule } = data;
  const usesMonth =
    dateRule === TDateRule.Fixed || dateRule === TDateRule.NthWeekday;

  return {
    name: data.name,
    dateRule,
    month: usesMonth ? Number(data.month) : null,
    day: dateRule === TDateRule.Fixed ? Number(data.day) : null,
    nthWeekday:
      dateRule === TDateRule.NthWeekday
        ? {
            weekday: Number(data.nthWeekday.weekday),
            nth: Number(data.nthWeekday.nth),
          }
        : null,
    easterOffsetDays:
      dateRule === TDateRule.EasterOffset
        ? Number(data.easterOffsetDays)
        : null,
    leadDays: Number(data.leadDays),
  };
}

function CalendarEvents() {
  const {
    calendarEvents,
    pagination,
    searchCalendarEvents,
    createCalendarEvent,
    updateCalendarEvent,
    deleteCalendarEvent,
    reactivateCalendarEvent,
  } = useCalendarEvents();
  const [dialog, setDialog] = useState<CalendarEventDialog>(null);
  const [viewing, setViewing] = useState<CalendarEventResponseDto | null>(null);
  const {
    setPerPage,
    selectedIds,
    setSelectedIds,
    filters,
    setFilters,
    resetFilters,
    isFiltersOpen,
    handleFiltersOpenChange,
    handleSearch,
    handlePageChange,
  } = useIndexSearch<CalendarEventFilters, "search">({
    search: searchCalendarEvents,
    initialFilters: { search: "", isActive: "", scope: "" },
    quickSearchKey: "search",
    perPageInitial: 10,
    debounceMs: 400,
    onError: (error) => handleError(error, "Erro ao buscar eventos"),
  });

  const handleDelete = useCallback(
    async (event: CalendarEventResponseDto) => {
      try {
        await deleteCalendarEvent(event.id);
        handleSuccess("Evento inativado com sucesso");
        await handleSearch(1);
      } catch (error) {
        handleError(error, "Erro ao inativar evento");
      }
    },
    [deleteCalendarEvent, handleSearch]
  );

  const handleReactivate = useCallback(
    async (event: CalendarEventResponseDto) => {
      try {
        await reactivateCalendarEvent(event.id);
        handleSuccess("Evento reativado com sucesso");
        await handleSearch(1);
      } catch (error) {
        handleError(error, "Erro ao reativar evento");
      }
    },
    [reactivateCalendarEvent, handleSearch]
  );

  const handleSave = async (data: CalendarEventFormData) => {
    const dto = toRequestDto(data);
    if (dialog?.event) {
      await updateCalendarEvent(dialog.event.id, dto);
      handleSuccess("Evento atualizado com sucesso");
    } else {
      await createCalendarEvent(dto);
      handleSuccess("Evento criado com sucesso");
    }
    setDialog(null);
    await handleSearch(1);
  };

  const columns = useMemo<ColumnDef<CalendarEventResponseDto>[]>(
    () => [
      { accessorKey: "name", header: "Nome" },
      {
        accessorKey: "scope",
        header: "Escopo",
        cell: ({ row }) => (
          <Badge variant="outline">
            {EVENT_SCOPE_LABELS[row.original.scope]}
          </Badge>
        ),
      },
      {
        accessorKey: "dateRule",
        header: "Regra de data",
        cell: ({ row }) => describeDateRule(row.original),
      },
      {
        accessorKey: "nextDate",
        header: "Próxima data",
        cell: ({ row }) => formatDateOnly(row.original.nextDate),
      },
      { accessorKey: "leadDays", header: "Antecedência (dias)" },
      { accessorKey: "productCount", header: "Produtos" },
      {
        accessorKey: "isActive",
        header: "Status",
        cell: ({ row }) => (
          <Badge variant={row.original.isActive ? "default" : "secondary"}>
            {row.original.isActive ? "Ativo" : "Inativo"}
          </Badge>
        ),
      },
      {
        id: "actions",
        header: "Ações",
        cell: ({ row }) => (
          <NavActionColumn
            object={row.original}
            onEdit={(event) => setDialog({ event })}
            onDelete={handleDelete}
            onReactivate={handleReactivate}
            onView={setViewing}
            disableDelete={!row.original.isActive}
            disableEdit={!row.original.isActive}
            disableReactivate={row.original.isActive}
            deleteLabel="Inativar"
            deleteDialogTitle="Inativar este evento?"
            deleteDialogDescription="O evento sai dos combos de produto. Você pode reativá-lo depois."
            deleteButtonLabel="Inativar"
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
    ],
    [handleDelete, handleReactivate]
  );

  return (
    <>
      <EntityIndexPage
        title="Calendário de eventos"
        onRowOpen={setViewing}
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        toolbar={
          <>
            <InputGroup className="w-full md:w-[280px]">
              <InputGroupAddon>
                <Search />
              </InputGroupAddon>
              <InputGroupInput
                value={filters.search}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, search: e.target.value }))
                }
                placeholder="Pesquisar por nome..."
                aria-label="Pesquisar evento"
              />
            </InputGroup>

            <ListFiltersSheet
              open={isFiltersOpen}
              onOpenChange={handleFiltersOpenChange}
              description="Filtre a listagem de eventos."
              onApply={() => {
                handleSearch(1);
                handleFiltersOpenChange(false);
              }}
              onClear={() => {
                resetFilters();
                handleSearch(1);
                handleFiltersOpenChange(false);
              }}
            >
              <SearchSelect<IOption>
                field={{
                  value: filters.isActive,
                  onChange: (value) =>
                    setFilters((prev) => ({
                      ...prev,
                      isActive: value ? String(value) : "",
                    })),
                }}
                label="Status"
                data={statusOptions}
                placeholder="Todos"
              />
              <SearchSelect<IOption>
                field={{
                  value: filters.scope,
                  onChange: (value) =>
                    setFilters((prev) => ({
                      ...prev,
                      scope: value ? String(value) : "",
                    })),
                }}
                label="Escopo"
                data={scopeOptions}
                placeholder="Todos"
              />
            </ListFiltersSheet>
          </>
        }
        columns={columns}
        data={calendarEvents}
        pagination={pagination}
        onPageChange={handlePageChange}
        onPerPageChange={setPerPage}
        onCreate={() => setDialog({ event: null })}
      />

      <Dialog
        open={dialog !== null}
        onOpenChange={(open) => !open && setDialog(null)}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {dialog?.event ? "Editar evento" : "Novo evento"}
            </DialogTitle>
            <DialogDescription>
              Data comercial que puxa a venda, com a antecedência em dias.
            </DialogDescription>
          </DialogHeader>
          {dialog && (
            <CalendarEventForm
              initialData={dialog.event}
              onSubmit={handleSave}
              onCancel={() => setDialog(null)}
            />
          )}
        </DialogContent>
      </Dialog>
      <CalendarEventViewDialog
        event={viewing}
        onClose={() => setViewing(null)}
      />
    </>
  );
}

export default function CalendarEventsPageWrapper() {
  return (
    <CalendarEventsProvider>
      <CalendarEvents />
    </CalendarEventsProvider>
  );
}
