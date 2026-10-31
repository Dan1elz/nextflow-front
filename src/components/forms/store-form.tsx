import {
  Controller,
  useForm,
  type Control,
  type Resolver,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Store } from "lucide-react";

import { FormInputField } from "@/components/app/form-input-field";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
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
import type {
  LocationResponseDto,
  StoreResponseDto,
} from "@/interfaces/store.interface";
import {
  storeSchema,
  updateStoreSchema,
  type StoreFormData,
} from "@/schemas/store.schema";

interface StoreFormProps {
  initialData?: StoreResponseDto | null;
  onSubmit: (data: StoreFormData) => Promise<void>;
  onCancel: () => void;
}

function LocationSelect({
  control,
  name,
  label,
  locations,
  disabled,
}: {
  control: Control<StoreFormData>;
  name: "defaultSaleLocationId" | "defaultReceiveLocationId";
  label: string;
  locations: LocationResponseDto[];
  disabled: boolean;
}) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel htmlFor={name}>{label}</FieldLabel>
          <Select
            value={field.value}
            onValueChange={field.onChange}
            disabled={disabled}
          >
            <SelectTrigger id={name} aria-invalid={fieldState.invalid}>
              <SelectValue placeholder="Selecione o local" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {locations.map((location) => (
                  <SelectItem key={location.id} value={location.id}>
                    {location.name}
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
}

export function StoreForm({ initialData, onSubmit, onCancel }: StoreFormProps) {
  const form = useForm<StoreFormData>({
    resolver: zodResolver(
      initialData ? updateStoreSchema : storeSchema
    ) as Resolver<StoreFormData>,
    defaultValues: {
      name: initialData?.name ?? "",
      defaultSaleLocationId: initialData?.defaultSaleLocationId ?? "",
      defaultReceiveLocationId: initialData?.defaultReceiveLocationId ?? "",
    },
  });
  const { submit } = useApiForm(form);
  const { isSubmitting } = form.formState;
  const active = initialData?.locations.filter((l) => l.isActive) ?? [];

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
          icon={Store}
          disabled={isSubmitting}
        />
        {initialData ? (
          <>
            <LocationSelect
              control={form.control}
              name="defaultSaleLocationId"
              label="Local padrão de venda"
              locations={active.filter((l) => l.isSellable)}
              disabled={isSubmitting}
            />
            <LocationSelect
              control={form.control}
              name="defaultReceiveLocationId"
              label="Local padrão de recebimento"
              locations={active}
              disabled={isSubmitting}
            />
          </>
        ) : (
          <FieldDescription>
            A loja nasce com o local &quot;Loja&quot;, vendável, como padrão de
            venda e de recebimento.
          </FieldDescription>
        )}
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
