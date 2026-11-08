import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { useApiForm } from "@/hooks/use-api-form";
import type { QuickCreateClientRequestDto } from "@/interfaces/client.interface";
import {
  quickClientSchema,
  type QuickClientFormData,
} from "@/schemas/client.schema";
import { formatOnlyNumbers, formatPhone } from "@/utils/format.helpers";

interface ClientQuickFormProps {
  onSubmit: (dto: QuickCreateClientRequestDto) => Promise<void>;
  onCancel: () => void;
}

/** Cadastro rápido de cliente (T-CD4): nome, telefone e e-mail opcional, sem sair da venda. */
export function ClientQuickForm({ onSubmit, onCancel }: ClientQuickFormProps) {
  const form = useForm<QuickClientFormData>({
    resolver: zodResolver(quickClientSchema),
    defaultValues: { name: "", phone: "", email: "" },
  });
  const { submit, handleSubmit } = useApiForm(form);
  const { isSubmitting } = form.formState;

  return (
    <form
      noValidate
      onSubmit={(event) => {
        // O dialog fica dentro do formulário da venda (portal do React): sem isso o submit subiria até ele.
        event.stopPropagation();
        return handleSubmit(async (data) => {
          await submit(() =>
            onSubmit({
              name: data.name.trim(),
              phone: formatOnlyNumbers(data.phone),
              email: data.email || null,
            })
          );
        })(event);
      }}
    >
      <FieldGroup>
        <Controller
          control={form.control}
          name="name"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="quick-client-name">Nome</FieldLabel>
              <Input
                {...field}
                id="quick-client-name"
                autoFocus
                autoComplete="off"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          control={form.control}
          name="phone"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="quick-client-phone">Telefone</FieldLabel>
              <Input
                {...field}
                id="quick-client-phone"
                inputMode="tel"
                autoComplete="off"
                placeholder="(00) 00000-0000"
                maxLength={15}
                onChange={(event) =>
                  field.onChange(formatPhone(event.target.value))
                }
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          control={form.control}
          name="email"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="quick-client-email">
                E-mail <span className="text-muted-foreground">(opcional)</span>
              </FieldLabel>
              <Input
                {...field}
                id="quick-client-email"
                type="email"
                inputMode="email"
                autoComplete="off"
                placeholder="cliente@exemplo.com"
                maxLength={150}
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Spinner />}
            Cadastrar
          </Button>
        </div>
      </FieldGroup>
    </form>
  );
}
