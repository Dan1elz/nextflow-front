import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Warehouse } from "lucide-react";

import { FormInputField } from "@/components/app/form-input-field";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldContent,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { useApiForm } from "@/hooks/use-api-form";
import type { LocationResponseDto } from "@/interfaces/store.interface";
import { locationSchema, type LocationFormData } from "@/schemas/store.schema";

interface LocationFormProps {
  initialData?: LocationResponseDto | null;
  onSubmit: (data: LocationFormData) => Promise<void>;
  onCancel: () => void;
}

export function LocationForm({
  initialData,
  onSubmit,
  onCancel,
}: LocationFormProps) {
  const form = useForm<LocationFormData>({
    resolver: zodResolver(locationSchema),
    defaultValues: {
      name: initialData?.name ?? "",
      isSellable: initialData?.isSellable ?? true,
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
          icon={Warehouse}
          placeholder="Ex.: Depósito"
          disabled={isSubmitting}
        />
        <Controller
          control={form.control}
          name="isSellable"
          render={({ field, fieldState }) => (
            <Field orientation="horizontal" data-invalid={fieldState.invalid}>
              <Checkbox
                id="isSellable"
                checked={field.value}
                onCheckedChange={(value) => field.onChange(!!value)}
                disabled={isSubmitting}
                aria-invalid={fieldState.invalid}
              />
              <FieldContent>
                <FieldLabel htmlFor="isSellable">Vendável</FieldLabel>
                <FieldDescription>
                  Local de onde a venda pode dar baixa.
                </FieldDescription>
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </FieldContent>
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
