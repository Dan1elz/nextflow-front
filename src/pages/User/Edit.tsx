import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { UserForm } from "@/components/forms/user-form";
import { useUsers } from "@/hooks/use-users";
import { UsersProvider } from "@/providers/users.provider";
import type { UserFormData } from "@/schemas/user.schema";
import { handleError, handleSuccess } from "@/utils/toast.helpers";

function EditUser() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { selectedUser, selectUser, updateUser } = useUsers();

  useEffect(() => {
    if (!id) return;

    selectUser(id).catch((error) => {
      handleError(error, "Erro ao buscar usuário");
      navigate("/users");
    });
  }, [id, navigate, selectUser]);

  const handleSubmit = async (data: UserFormData) => {
    await updateUser(id!, {
      name: data.name,
      lastName: data.lastName,
      birthDate: data.birthDate,
      email: data.email,
      newPassword: data.newPassword || undefined,
    });
    handleSuccess("Usuário atualizado com sucesso");
    navigate("/users");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Editar usuário</CardTitle>
      </CardHeader>
      <CardContent>
        {selectedUser ? (
          <UserForm
            mode="edit"
            initialData={selectedUser}
            onSubmit={handleSubmit}
            onBack={() => navigate("/users")}
          />
        ) : (
          <Skeleton className="h-64 w-full" />
        )}
      </CardContent>
    </Card>
  );
}

export default function EditUserPageWrapper() {
  return (
    <UsersProvider>
      <EditUser />
    </UsersProvider>
  );
}
