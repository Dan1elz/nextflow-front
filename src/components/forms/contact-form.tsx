import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { FormInputField } from "@/components/app/form-input-field";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useApiForm } from "@/hooks/use-api-form";
import type { ContactResponseDto } from "@/interfaces/contact.interface";
import { contactSchema, type ContactFormData } from "@/schemas/contact.schema";
import { CONTACT_TYPE_LABELS, TContactType } from "@/types/enums";
import { formatPhone } from "@/utils/format.helpers";

interface ContactFormProps {
  initialData?: ContactResponseDto | null;
  onSubmit: (data: ContactFormData) => Promise<void>;
  onCancelEdit?: () => void;
}

export function ContactForm({
  initialData,
  onSubmit,
  onCancelEdit,
}: ContactFormProps) {
  const form = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      type: initialData?.type ?? TContactType.Phone,
      value: initialData
        ? initialData.type === TContactType.Email
          ? initialData.value
          : formatPhone(initialData.value)
        : "",
      isMain: initialData?.isMain ?? false,
    },
  });
  const { submit } = useApiForm(form);
  const { isSubmitting } = form.formState;
  const type = useWatch({ control: form.control, name: "type" });
  const isEmail = type === TContactType.Email;

  return (
    <form
      noValidate
      onSubmit={form.handleSubmit(async (data) => {
        await submit(() => onSubmit(data));
      })}
    >
      <FieldGroup className="grid gap-5 md:grid-cols-2">
        <Controller
          control={form.control}
          name="type"
          render={({ field }) => (
            <Field>
              <FieldLabel>Tipo</FieldLabel>
              <ToggleGroup
                type="single"
                variant="outline"
                className="justify-start"
                value={field.value}
                onValueChange={(value) => {
                  if (!value) return;
                  field.onChange(value);
                  form.setValue("value", "");
                  form.clearErrors("value");
                }}
                disabled={isSubmitting}
              >
                {Object.values(TContactType).map((option) => (
                  <ToggleGroupItem key={option} value={option}>
                    {CONTACT_TYPE_LABELS[option]}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </Field>
          )}
        />
        <FormInputField
          control={form.control}
          name="value"
          label={isEmail ? "E-mail" : "Número com DDD"}
          type={isEmail ? "email" : "tel"}
          placeholder={isEmail ? "contato@empresa.com" : "(00) 00000-0000"}
          mask={isEmail ? undefined : formatPhone}
          disabled={isSubmitting}
        />
        <Controller
          control={form.control}
          name="isMain"
          render={({ field }) => (
            <Field orientation="horizontal">
              <Checkbox
                id="contactIsMain"
                checked={field.value}
                onCheckedChange={(value) => field.onChange(!!value)}
                disabled={isSubmitting}
              />
              <FieldLabel htmlFor="contactIsMain">Contato principal</FieldLabel>
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
            {initialData ? "Salvar contato" : "Adicionar contato"}
          </Button>
        </div>
      </FieldGroup>
    </form>
  );
}
