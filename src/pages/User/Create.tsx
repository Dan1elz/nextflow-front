import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserForm } from "@/components/forms/user-form";
import { useUsers } from "@/hooks/use-users";
import { handleError, handleSuccess } from "@/utils/toast.helpers";
import type {
  CreateUserFormData,
  UpdateUserFormData,
} from "@/schemas/user.schema";
import type { ICreateUser } from "@/interfaces/user.interface";

function CreateUser() {
  const navigate = useNavigate();
  const { createUser } = useUsers();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (
    data: CreateUserFormData | UpdateUserFormData
  ) => {
    if (!("password" in data)) {
      return;
    }
    try {
      setIsLoading(true);
      const userData: ICreateUser = {
        name: data.name,
        lastName: data.lastName,
        email: data.email,
        cpf: data.cpf.replace(/\D/g, ""), // Remove formatação do CPF
        password: data.password,
      };

      await createUser(userData);
      handleSuccess("Usuário criado com sucesso");
      navigate("/users");
    } catch (error) {
      handleError(error, "Erro ao criar usuário");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Criar Usuário</CardTitle>
        </CardHeader>
        <CardContent>
          <UserForm
            onSubmit={handleSubmit}
            isLoading={isLoading}
            isEdit={false}
          />
        </CardContent>
      </Card>
    </div>
  );
}

import { UsersProvider } from "@/providers/users.provider";

export default function CreateUserPageWrapper() {
  return (
    <UsersProvider>
      <CreateUser />
    </UsersProvider>
  );
}
