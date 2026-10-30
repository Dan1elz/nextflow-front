import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, User } from "lucide-react";

import { FormInputField } from "@/components/app/form-input-field";
import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { useApiForm } from "@/hooks/use-api-form";
import { profileSchema, type ProfileFormData } from "@/schemas/profile.schema";

interface ProfileFormProps {
  initialData: ProfileFormData;
  onSubmit: (data: ProfileFormData) => Promise<void>;
}

export function ProfileForm({ initialData, onSubmit }: ProfileFormProps) {
  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: initialData,
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
          icon={User}
          autoComplete="given-name"
          disabled={isSubmitting}
        />
        <FormInputField
          control={form.control}
          name="lastName"
          label="Sobrenome"
          icon={User}
          autoComplete="family-name"
          disabled={isSubmitting}
        />
        <FormInputField
          control={form.control}
          name="email"
          label="E-mail"
          icon={Mail}
          type="email"
          autoComplete="email"
          disabled={isSubmitting}
        />
        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Spinner data-icon="inline-start" />}
            Salvar
          </Button>
        </div>
      </FieldGroup>
    </form>
  );
}
