import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserForm } from "@/components/forms/user-form";
import { useUsers } from "@/hooks/use-users";
import { UsersProvider } from "@/providers/users.provider";
import type { UserFormData } from "@/schemas/user.schema";
import { formatOnlyNumbers } from "@/utils/format.helpers";
import { handleSuccess } from "@/utils/toast.helpers";

function CreateUser() {
  const navigate = useNavigate();
  const { createUser } = useUsers();

  const handleSubmit = async (data: UserFormData) => {
    await createUser({
      name: data.name,
      lastName: data.lastName,
      cpf: formatOnlyNumbers(data.cpf),
      birthDate: data.birthDate,
      email: data.email,
      password: data.password,
    });
    handleSuccess("Usuário criado com sucesso");
    navigate("/users");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Criar usuário</CardTitle>
      </CardHeader>
      <CardContent>
        <UserForm
          mode="create"
          onSubmit={handleSubmit}
          onBack={() => navigate("/users")}
        />
      </CardContent>
    </Card>
  );
}

export default function CreateUserPageWrapper() {
  return (
    <UsersProvider>
      <CreateUser />
    </UsersProvider>
  );
}
