import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Layers } from "lucide-react";

import { DatePicker } from "@/components/app/date-picker";
import { FormInputField } from "@/components/app/form-input-field";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { useApiForm } from "@/hooks/use-api-form";
import type { CollectionResponseDto } from "@/interfaces/collection.interface";
import {
  collectionSchema,
  type CollectionFormData,
} from "@/schemas/collection.schema";

/** Coleção pode ser planejada para o futuro: o seletor não trava em hoje. */
const MAX_DATE = new Date(2100, 11, 31);

interface CollectionFormProps {
  initialData?: CollectionResponseDto | null;
  onSubmit: (data: CollectionFormData) => Promise<void>;
  onCancel: () => void;
}

export function CollectionForm({
  initialData,
  onSubmit,
  onCancel,
}: CollectionFormProps) {
  const form = useForm<CollectionFormData>({
    resolver: zodResolver(collectionSchema),
    defaultValues: {
      name: initialData?.name ?? "",
      startsOn: initialData?.startsOn ?? "",
      endsOn: initialData?.endsOn ?? "",
    },
  });
  const { submit } = useApiForm(form);
  const { isSubmitting } = form.formState;

  return (
    <form
      noValidate
      onSubmit={form.handleSubmit(async (data) => {
        await submit(() => onSubmit(data));
      })}
    >
      <FieldGroup>
        <FormInputField
          control={form.control}
          name="name"
          label="Nome"
          icon={Layers}
          placeholder="Ex.: Verão 2026"
          disabled={isSubmitting}
        />
        <Controller
          control={form.control}
          name="startsOn"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel>Início</FieldLabel>
              <DatePicker
                value={field.value}
                onChange={field.onChange}
                disabled={isSubmitting}
                maxDate={MAX_DATE}
                error={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          control={form.control}
          name="endsOn"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel>Fim</FieldLabel>
              <DatePicker
                value={field.value}
                onChange={field.onChange}
                disabled={isSubmitting}
                maxDate={MAX_DATE}
                error={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
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
