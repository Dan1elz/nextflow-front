import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CreditCard, User } from "lucide-react";

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
import type { ClientResponseDto } from "@/interfaces/client.interface";
import { clientSchema, type ClientFormData } from "@/schemas/client.schema";
import { formatCpfCnpj, formatOnlyNumbers } from "@/utils/format.helpers";

interface ClientFormProps {
  mode: "create" | "edit" | "view";
  initialData?: ClientResponseDto | null;
  onSubmit?: (data: ClientFormData) => Promise<void>;
}

const maskCpf = (value: string) =>
  formatCpfCnpj(formatOnlyNumbers(value).slice(0, 11));

export function ClientForm({ mode, initialData, onSubmit }: ClientFormProps) {
  const form = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      name: initialData?.name ?? "",
      lastName: initialData?.lastName ?? "",
      cpf: initialData?.cpf ? maskCpf(initialData.cpf) : "",
      birthDate: initialData?.birthDate ?? "",
    },
  });
  const { submit } = useApiForm(form);
  const { isSubmitting } = form.formState;
  const locked = mode === "view" || isSubmitting;

  return (
    <form
      noValidate
      onSubmit={form.handleSubmit(async (data) => {
        await submit(async () => onSubmit?.(data));
      })}
    >
      <FieldGroup className="grid gap-5 md:grid-cols-2">
        <FormInputField
          control={form.control}
          name="name"
          label="Nome"
          icon={User}
          disabled={locked}
        />
        <FormInputField
          control={form.control}
          name="lastName"
          label="Sobrenome"
          icon={User}
          disabled={locked}
        />
        <FormInputField
          control={form.control}
          name="cpf"
          label="CPF"
          icon={CreditCard}
          placeholder="000.000.000-00"
          description="Opcional."
          mask={maskCpf}
          disabled={locked}
        />
        <Controller
          control={form.control}
          name="birthDate"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid} data-disabled={locked}>
              <FieldLabel>Data de nascimento</FieldLabel>
              <DatePicker
                value={field.value}
                onChange={field.onChange}
                disabled={locked}
                maxDate={new Date()}
                error={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        {mode !== "view" && (
          <div className="flex justify-end md:col-span-2">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Spinner data-icon="inline-start" />}
              {mode === "edit" ? "Salvar" : "Criar"}
            </Button>
          </div>
        )}
      </FieldGroup>
    </form>
  );
}
