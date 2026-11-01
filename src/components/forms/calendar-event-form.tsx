import { Controller, useForm, useWatch, type FieldPath } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarClock, CalendarDays, Info } from "lucide-react";

import { FormInputField } from "@/components/app/form-input-field";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { useApiForm } from "@/hooks/use-api-form";
import type { CalendarEventResponseDto } from "@/interfaces/calendar-event.interface";
import {
  calendarEventSchema,
  type CalendarEventFormData,
} from "@/schemas/calendar-event.schema";
import { DATE_RULE_LABELS, TDateRule, TEventScope } from "@/types/enums";
import { MONTH_LABELS, WEEKDAY_LABELS } from "@/utils/calendar-event.helpers";
import { formatOnlyNumbers } from "@/utils/format.helpers";

type SelectOption = { value: string; label: string };

const capitalize = (text: string) =>
  text.charAt(0).toUpperCase() + text.slice(1);

const dateRuleOptions: SelectOption[] = Object.values(TDateRule).map(
  (value) => ({ value, label: DATE_RULE_LABELS[value] })
);
const monthOptions: SelectOption[] = MONTH_LABELS.map((label, index) => ({
  value: String(index + 1),
  label: capitalize(label),
}));
const weekdayOptions: SelectOption[] = WEEKDAY_LABELS.map((label, index) => ({
  value: String(index),
  label: capitalize(label),
}));
const nthOptions: SelectOption[] = [1, 2, 3, 4].map((nth) => ({
  value: String(nth),
  label: `${nth}º`,
}));

const formatSignedNumber = (value: string) =>
  value.replace(/[^\d-]/g, "").replace(/(?!^)-/g, "");

interface CalendarEventFormProps {
  initialData?: CalendarEventResponseDto | null;
  onSubmit: (data: CalendarEventFormData) => Promise<void>;
  onCancel: () => void;
}

export function CalendarEventForm({
  initialData,
  onSubmit,
  onCancel,
}: CalendarEventFormProps) {
  const form = useForm<CalendarEventFormData>({
    resolver: zodResolver(calendarEventSchema),
    defaultValues: {
      name: initialData?.name ?? "",
      dateRule: initialData?.dateRule ?? TDateRule.Fixed,
      month: initialData?.month ? String(initialData.month) : "",
      day: initialData?.day ? String(initialData.day) : "",
      nthWeekday: {
        weekday: initialData?.nthWeekday
          ? String(initialData.nthWeekday.weekday)
          : "",
        nth: initialData?.nthWeekday ? String(initialData.nthWeekday.nth) : "",
      },
      easterOffsetDays:
        initialData?.easterOffsetDays != null
          ? String(initialData.easterOffsetDays)
          : "",
      leadDays: initialData ? String(initialData.leadDays) : "",
    },
  });
  const { submit } = useApiForm(form);
  const { isSubmitting } = form.formState;
  const dateRule = useWatch({ control: form.control, name: "dateRule" });

  // RN-CE42: o evento nacional só altera a antecedência; o resto vai igual ao gravado.
  const isNational = initialData?.scope === TEventScope.National;
  const lockedDisabled = isSubmitting || isNational;

  const renderSelect = (
    name: FieldPath<CalendarEventFormData>,
    label: string,
    options: SelectOption[],
    placeholder = "Selecione"
  ) => (
    <Controller
      control={form.control}
      name={name}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid} data-disabled={lockedDisabled}>
          <FieldLabel htmlFor={name}>{label}</FieldLabel>
          <Select
            value={String(field.value ?? "")}
            onValueChange={field.onChange}
            disabled={lockedDisabled}
          >
            <SelectTrigger id={name} aria-invalid={fieldState.invalid}>
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {options.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
      )}
    />
  );

  return (
    <form
      noValidate
      onSubmit={form.handleSubmit(async (data) => {
        await submit(() => onSubmit(data));
      })}
    >
      <FieldGroup>
        {isNational && (
          <Alert>
            <Info className="size-4" />
            <AlertDescription>
              Evento nacional: só a antecedência pode ser alterada.
            </AlertDescription>
          </Alert>
        )}
        <FormInputField
          control={form.control}
          name="name"
          label="Nome"
          icon={CalendarDays}
          placeholder="Ex.: Festa da Uva"
          disabled={lockedDisabled}
        />
        {renderSelect("dateRule", "Regra de data", dateRuleOptions)}

        {dateRule === TDateRule.Fixed && (
          <div className="grid grid-cols-2 items-start gap-4">
            {renderSelect("month", "Mês", monthOptions)}
            <FormInputField
              control={form.control}
              name="day"
              label="Dia"
              inputMode="numeric"
              mask={formatOnlyNumbers}
              disabled={lockedDisabled}
            />
          </div>
        )}

        {dateRule === TDateRule.NthWeekday && (
          <div className="grid grid-cols-1 items-start gap-4 sm:grid-cols-3">
            {renderSelect("nthWeekday.nth", "Ocorrência", nthOptions)}
            {renderSelect(
              "nthWeekday.weekday",
              "Dia da semana",
              weekdayOptions
            )}
            {renderSelect("month", "Mês", monthOptions)}
          </div>
        )}

        {dateRule === TDateRule.EasterOffset && (
          <FormInputField
            control={form.control}
            name="easterOffsetDays"
            label="Dias a partir da Páscoa"
            inputMode="text"
            description="De -60 a 60. Negativo é antes da Páscoa: Carnaval é -47."
            mask={formatSignedNumber}
            disabled={lockedDisabled}
          />
        )}

        <FormInputField
          control={form.control}
          name="leadDays"
          label="Antecedência (dias)"
          icon={CalendarClock}
          inputMode="numeric"
          description="Quantos dias antes do evento a venda começa a subir. De 0 a 120."
          mask={formatOnlyNumbers}
          disabled={isSubmitting}
        />
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Spinner data-icon="inline-start" />}
            {initialData ? "Salvar" : "Criar"}
          </Button>
        </div>
      </FieldGroup>
    </form>
  );
}
