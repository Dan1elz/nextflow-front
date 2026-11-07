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
import { useAuth } from "@/hooks/use-auth";
import type {
  ChangePasswordRequestDto,
  UpdateProfileRequestDto,
} from "@/interfaces/user.interface";
import { handleSuccess } from "@/utils/toast.helpers";

export default function Profile() {
  const { user, updateProfile, changePassword } = useAuth();

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
    </div>
  );
}
