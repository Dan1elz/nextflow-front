import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Building2, CalendarClock, CreditCard } from "lucide-react";

import { FormInputField } from "@/components/app/form-input-field";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { useApiForm } from "@/hooks/use-api-form";
import type { SupplierResponseDto } from "@/interfaces/supplier.interface";
import {
  supplierSchema,
  type SupplierFormData,
} from "@/schemas/supplier.schema";
import { formatCpfCnpj, formatOnlyNumbers } from "@/utils/format.helpers";

interface SupplierFormProps {
  mode: "create" | "edit" | "view";
  initialData?: SupplierResponseDto | null;
  onSubmit?: (data: SupplierFormData) => Promise<void>;
}

const maskCnpj = (value: string) => {
  const digits = formatOnlyNumbers(value).slice(0, 14);
  // Até 11 dígitos o formatador comum aplicaria a máscara de CPF.
  return digits.length > 11 ? formatCpfCnpj(digits) : digits;
};

export function SupplierForm({
  mode,
  initialData,
  onSubmit,
}: SupplierFormProps) {
  const form = useForm<SupplierFormData>({
    resolver: zodResolver(supplierSchema),
    defaultValues: {
      name: initialData?.name ?? "",
      cnpj: initialData ? maskCnpj(initialData.cnpj) : "",
      leadTimeDays: String(initialData?.leadTimeDays ?? 7),
      note: initialData?.note ?? "",
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
          icon={Building2}
          disabled={locked}
        />
        <FormInputField
          control={form.control}
          name="cnpj"
          label="CNPJ"
          icon={CreditCard}
          placeholder="00.000.000/0000-00"
          mask={maskCnpj}
          disabled={locked}
        />
        <FormInputField
          control={form.control}
          name="leadTimeDays"
          label="Prazo de entrega (dias)"
          icon={CalendarClock}
          inputMode="numeric"
          description="De 1 a 180 dias."
          mask={formatOnlyNumbers}
          disabled={locked}
        />
        <Controller
          control={form.control}
          name="note"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid} data-disabled={locked}>
              <FieldLabel htmlFor="note">Observação</FieldLabel>
              <Textarea
                {...field}
                id="note"
                aria-invalid={fieldState.invalid}
                disabled={locked}
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
