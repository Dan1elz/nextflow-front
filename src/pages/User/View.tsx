import { UserForm } from "@/components/forms/user-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useUsers } from "@/hooks/use-users";
import { UsersProvider } from "@/providers/users.provider";
import { handleError } from "@/utils/toast.helpers";
import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";

function ViewUser() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { selectedUser, selectUser } = useUsers();

  const handleBack = () => {
    navigate("/users");
  };

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
          <CardTitle>Visualizar Usuário</CardTitle>
        </CardHeader>
        <CardContent>
          <UserForm
            onSubmit={() => {}}
            onBack={handleBack}
            isLoading={false}
            initialData={selectedUser}
            disabled={true}
          />
        </CardContent>
      </Card>
    </div>
  );
}

export default function ViewUserPageWrapper() {
  return (
    <UsersProvider>
      <ViewUser />
    </UsersProvider>
  );
}
