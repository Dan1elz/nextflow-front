import { Controller, useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CreditCard, Lock, Mail, User } from "lucide-react";

import { DatePicker } from "@/components/app/date-picker";
import { FormInputField } from "@/components/app/form-input-field";
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
import type { UserResponseDto } from "@/interfaces/user.interface";
import {
  createUserSchema,
  updateUserSchema,
  type UserFormData,
} from "@/schemas/user.schema";
import { ROLE_ENUM_LABELS, TRoleEnum } from "@/types/enums";
import { formatCpfCnpj, formatOnlyNumbers } from "@/utils/format.helpers";

interface UserFormProps {
  mode: "create" | "edit" | "view";
  initialData?: UserResponseDto;
  onSubmit?: (data: UserFormData) => Promise<void>;
  onBack: () => void;
}

const formatCpf = (value: string) =>
  formatCpfCnpj(formatOnlyNumbers(value).slice(0, 11));

export function UserForm({
  mode,
  initialData,
  onSubmit,
  onBack,
}: UserFormProps) {
  const form = useForm<UserFormData>({
    resolver: zodResolver(
      mode === "create" ? createUserSchema : updateUserSchema
    ) as Resolver<UserFormData>,
    defaultValues: {
      name: initialData?.name ?? "",
      lastName: initialData?.lastName ?? "",
      cpf: initialData ? formatCpf(initialData.cpf) : "",
      birthDate: initialData?.birthDate ?? "",
      email: initialData?.email ?? "",
      password: "",
      newPassword: "",
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
          placeholder="Nome"
          autoComplete="given-name"
          disabled={locked}
        />
        <FormInputField
          control={form.control}
          name="lastName"
          label="Sobrenome"
          icon={User}
          placeholder="Sobrenome"
          autoComplete="family-name"
          disabled={locked}
        />
        <FormInputField
          control={form.control}
          name="cpf"
          label="CPF"
          icon={CreditCard}
          placeholder="000.000.000-00"
          mask={formatCpf}
          disabled={locked || mode !== "create"}
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
        <FormInputField
          control={form.control}
          name="email"
          label="E-mail"
          icon={Mail}
          type="email"
          placeholder="seu@email.com"
          autoComplete="off"
          disabled={locked}
        />
        <Field data-disabled>
          <FieldLabel htmlFor="role">Perfil</FieldLabel>
          {/* RN-AC04: enquanto só existir Admin, o perfil é fixo. */}
          <Input
            id="role"
            value={ROLE_ENUM_LABELS[initialData?.role ?? TRoleEnum.Admin]}
            disabled
          />
        </Field>
        {mode === "create" && (
          <FormInputField
            control={form.control}
            name="password"
            label="Senha"
            icon={Lock}
            type="password"
            description="Mínimo de 8 caracteres, com letra e número."
            autoComplete="new-password"
            disabled={locked}
          />
        )}
        {mode === "edit" && (
          <FormInputField
            control={form.control}
            name="newPassword"
            label="Nova senha"
            icon={Lock}
            type="password"
            description="Deixe em branco para manter a senha atual."
            autoComplete="new-password"
            disabled={locked}
          />
        )}

        <div className="flex justify-end gap-2 md:col-span-2">
          <Button type="button" variant="secondary" onClick={onBack}>
            Voltar
          </Button>
          {mode !== "view" && (
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Spinner data-icon="inline-start" />}
              {mode === "edit" ? "Salvar" : "Criar"}
            </Button>
          )}
        </div>
      </FieldGroup>
    </form>
  );
}
