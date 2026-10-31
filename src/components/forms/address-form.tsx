import { useEffect, useRef } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Building2, Hash, MapPin, Navigation } from "lucide-react";

import { FormInputField } from "@/components/app/form-input-field";
import { SearchSelect } from "@/components/app/search-select";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { useApiForm } from "@/hooks/use-api-form";
import type { IOption } from "@/interfaces/api.interface";
import type { AddressResponseDto } from "@/interfaces/address.interface";
import { addressSchema, type AddressFormData } from "@/schemas/address.schema";
import { formatCep, formatOnlyNumbers } from "@/utils/format.helpers";
import { handleError } from "@/utils/toast.helpers";

export type CepLookupResult = {
  street?: string;
  neighborhood?: string;
  complement?: string;
  cityId?: string;
};

interface AddressFormProps {
  initialData?: AddressResponseDto | null;
  onSubmit: (data: AddressFormData) => Promise<void>;
  onCancelEdit?: () => void;
  cityOptions: IOption[];
  onSearchCity: (query: string) => Promise<IOption[]>;
  onLookupCep: (zipCode: string) => Promise<CepLookupResult>;
}

const maskCep = (value: string) =>
  formatCep(formatOnlyNumbers(value).slice(0, 8));

export function AddressForm({
  initialData,
  onSubmit,
  onCancelEdit,
  cityOptions,
  onSearchCity,
  onLookupCep,
}: AddressFormProps) {
  const form = useForm<AddressFormData>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      zipCode: initialData ? maskCep(initialData.zipCode) : "",
      street: initialData?.street ?? "",
      number: initialData?.number ?? "",
      complement: initialData?.complement ?? "",
      neighborhood: initialData?.neighborhood ?? "",
      cityId: initialData?.cityId ?? "",
      isMain: initialData?.isMain ?? false,
    },
  });
  const { submit } = useApiForm(form);
  const { isSubmitting } = form.formState;

  const zipCode = useWatch({ control: form.control, name: "zipCode" });
  // Na edição o CEP já veio do banco: só consulta o ViaCEP se o usuário mudar.
  const lastLookup = useRef(formatOnlyNumbers(initialData?.zipCode ?? ""));

  useEffect(() => {
    const digits = formatOnlyNumbers(zipCode);
    if (digits.length !== 8 || digits === lastLookup.current) return;
    lastLookup.current = digits;

    onLookupCep(digits)
      .then((result) => {
        const fillIfEmpty = (
          field: "street" | "neighborhood" | "complement",
          value?: string
        ) => {
          if (value && !form.getValues(field).trim())
            form.setValue(field, value, { shouldDirty: true });
        };
        fillIfEmpty("street", result.street);
        fillIfEmpty("neighborhood", result.neighborhood);
        fillIfEmpty("complement", result.complement);
        if (result.cityId)
          form.setValue("cityId", result.cityId, {
            shouldDirty: true,
            shouldValidate: true,
          });
      })
      .catch((error) => handleError(error, "Erro ao consultar o CEP"));
  }, [zipCode, form, onLookupCep]);

  return (
    <form
      noValidate
      onSubmit={form.handleSubmit(async (data) => {
        await submit(() => onSubmit(data));
      })}
    >
      <FieldGroup className="grid gap-5 md:grid-cols-2">
        <FormInputField
          control={form.control}
          name="zipCode"
          label="CEP"
          icon={MapPin}
          placeholder="00000-000"
          mask={maskCep}
          description="Preenche rua, bairro e cidade pelo ViaCEP."
          disabled={isSubmitting}
        />
        <FormInputField
          control={form.control}
          name="street"
          label="Rua"
          icon={Navigation}
          disabled={isSubmitting}
        />
        <FormInputField
          control={form.control}
          name="number"
          label="Número"
          icon={Hash}
          disabled={isSubmitting}
        />
        <FormInputField
          control={form.control}
          name="complement"
          label="Complemento"
          disabled={isSubmitting}
        />
        <FormInputField
          control={form.control}
          name="neighborhood"
          label="Bairro"
          icon={Building2}
          disabled={isSubmitting}
        />
        <Controller
          control={form.control}
          name="cityId"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <SearchSelect<IOption>
                field={{
                  value: field.value,
                  onChange: (value) =>
                    field.onChange(value ? String(value) : ""),
                }}
                label="Cidade/UF"
                data={cityOptions}
                onSearch={onSearchCity}
                placeholder="Digite para buscar"
                disabled={isSubmitting}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          control={form.control}
          name="isMain"
          render={({ field }) => (
            <Field orientation="horizontal">
              <Checkbox
                id="addressIsMain"
                checked={field.value}
                onCheckedChange={(value) => field.onChange(!!value)}
                disabled={isSubmitting}
              />
              <FieldLabel htmlFor="addressIsMain">
                Endereço principal
              </FieldLabel>
            </Field>
          )}
        />
        <div className="flex justify-end gap-2 md:col-span-2">
          {onCancelEdit && (
            <Button type="button" variant="secondary" onClick={onCancelEdit}>
              Cancelar
            </Button>
          )}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Spinner data-icon="inline-start" />}
            {initialData ? "Salvar endereço" : "Adicionar endereço"}
          </Button>
        </div>
      </FieldGroup>
    </form>
  );
}
