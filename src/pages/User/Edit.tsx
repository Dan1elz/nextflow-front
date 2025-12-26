import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserForm } from "@/components/forms/user-form";
import { useUsers } from "@/hooks/use-users";
import { handleError, handleSuccess } from "@/utils/toast.helpers";
import type { UpdateUserFormData } from "@/schemas/user.schema";
import type { IUpdateUser } from "@/interfaces/user.interface";

function EditUser() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { selectedUser, selectUser, updateUser } = useUsers();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!id) {
      navigate("/users");
      return;
    }

    selectUser(id).catch((error) => {
      handleError(error, "Erro desconhecido ao buscar usuário");
      navigate("/users");
    });
  }, [id, navigate, selectUser]);

  const handleSubmit = async (data: UpdateUserFormData) => {
    if (!id) return;

    try {
      setIsLoading(true);
      const userData: IUpdateUser = {
        name: data.name,
        lastName: data.lastName,
        email: data.email,
        cpf: data.cpf.replace(/\D/g, ""), // Remove formatação do CPF
      };

      await updateUser(id, userData);
      handleSuccess("Usuário atualizado com sucesso");
      navigate("/users");
    } catch (error) {
      handleError(error, "Erro ao atualizar usuário");
    } finally {
      setIsLoading(false);
    }
  };

  if (!selectedUser) {
    return (
      <div className="flex flex-col gap-4">
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-muted-foreground">
              Carregando...
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Editar Usuário</CardTitle>
        </CardHeader>
        <CardContent>
          <UserForm
            onSubmit={handleSubmit}
            isLoading={isLoading}
            initialData={selectedUser}
            isEdit={true}
          />
        </CardContent>
      </Card>
    </div>
  );
}

import { UsersProvider } from "@/providers/users.provider";

export default function EditUserPageWrapper() {
  return (
    <UsersProvider>
      <EditUser />
    </UsersProvider>
  );
}
