import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Lock, Mail } from "lucide-react";

import { FormInputField } from "@/components/app/form-input-field";
import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { useApiForm } from "@/hooks/use-api-form";
import { loginSchema, type LoginFormData } from "@/schemas/login.schema";

interface LoginFormProps {
  onSubmit: (data: LoginFormData) => Promise<void>;
}

export function LoginForm({ onSubmit }: LoginFormProps) {
  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
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
          name="email"
          label="E-mail"
          icon={Mail}
          type="email"
          placeholder="seu@email.com"
          autoComplete="email"
          disabled={isSubmitting}
        />
        <FormInputField
          control={form.control}
          name="password"
          label="Senha"
          icon={Lock}
          type="password"
          placeholder="••••••••"
          autoComplete="current-password"
          disabled={isSubmitting}
        />
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Spinner data-icon="inline-start" />}
          Entrar
        </Button>
      </FieldGroup>
    </form>
  );
}
