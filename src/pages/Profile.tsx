import { Moon, Sun } from "lucide-react";

import { ChangePasswordForm } from "@/components/forms/change-password-form";
import { ProfileForm } from "@/components/forms/profile-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/hooks/use-theme";
import type {
  ChangePasswordRequestDto,
  UpdateProfileRequestDto,
} from "@/interfaces/user.interface";
import type { TTheme } from "@/types/theme";
import { handleSuccess } from "@/utils/toast.helpers";

export default function Profile() {
  const { user, updateProfile, changePassword } = useAuth();
  const { theme, setTheme } = useTheme();

  const handleProfile = async (dto: UpdateProfileRequestDto) => {
    await updateProfile(dto);
    handleSuccess("Dados atualizados com sucesso");
  };

  const handlePassword = async (dto: ChangePasswordRequestDto) => {
    await changePassword(dto);
    handleSuccess("Senha alterada com sucesso");
  };

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Meus dados</CardTitle>
          <CardDescription>Nome, sobrenome e e-mail de acesso.</CardDescription>
        </CardHeader>
        <CardContent>
          {user ? (
            <ProfileForm
              initialData={{
                name: user.name,
                lastName: user.lastName,
                email: user.email,
              }}
              onSubmit={handleProfile}
            />
          ) : (
            <Skeleton className="h-48 w-full" />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Senha</CardTitle>
          <CardDescription>Informe a senha atual e a nova.</CardDescription>
        </CardHeader>
        <CardContent>
          <ChangePasswordForm onSubmit={handlePassword} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tema</CardTitle>
          <CardDescription>Vale só para este navegador.</CardDescription>
        </CardHeader>
        <CardContent>
          <ToggleGroup
            type="single"
            variant="outline"
            value={theme}
            onValueChange={(value) => value && setTheme(value as TTheme)}
          >
            <ToggleGroupItem value="light" aria-label="Tema claro">
              <Sun />
              Claro
            </ToggleGroupItem>
            <ToggleGroupItem value="dark" aria-label="Tema escuro">
              <Moon />
              Escuro
            </ToggleGroupItem>
          </ToggleGroup>
        </CardContent>
      </Card>
    </div>
  );
}
