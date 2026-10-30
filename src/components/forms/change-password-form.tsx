import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Lock } from "lucide-react";

import { FormInputField } from "@/components/app/form-input-field";
import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { useApiForm } from "@/hooks/use-api-form";
import type { ChangePasswordRequestDto } from "@/interfaces/user.interface";
import {
  changePasswordSchema,
  type ChangePasswordFormData,
} from "@/schemas/profile.schema";

interface ChangePasswordFormProps {
  onSubmit: (dto: ChangePasswordRequestDto) => Promise<void>;
}

export function ChangePasswordForm({ onSubmit }: ChangePasswordFormProps) {
  const form = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });
  const { submit } = useApiForm(form);
  const { isSubmitting } = form.formState;

  return (
    <form
      noValidate
      onSubmit={form.handleSubmit(async (data) => {
        const saved = await submit(() =>
          onSubmit({
            currentPassword: data.currentPassword,
            newPassword: data.newPassword,
          })
        );
        if (saved) form.reset();
      })}
    >
      <FieldGroup>
        <FormInputField
          control={form.control}
          name="currentPassword"
          label="Senha atual"
          icon={Lock}
          type="password"
          autoComplete="current-password"
          disabled={isSubmitting}
        />
        <FormInputField
          control={form.control}
          name="newPassword"
          label="Nova senha"
          icon={Lock}
          type="password"
          description="Mínimo de 8 caracteres, com letra e número."
          autoComplete="new-password"
          disabled={isSubmitting}
        />
        <FormInputField
          control={form.control}
          name="confirmPassword"
          label="Confirmar nova senha"
          icon={Lock}
          type="password"
          autoComplete="new-password"
          disabled={isSubmitting}
        />
        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Spinner data-icon="inline-start" />}
            Trocar senha
          </Button>
        </div>
      </FieldGroup>
    </form>
  );
}
