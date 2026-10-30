import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { UserForm } from "@/components/forms/user-form";
import { useUsers } from "@/hooks/use-users";
import { UsersProvider } from "@/providers/users.provider";
import { handleError } from "@/utils/toast.helpers";

function ViewUser() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { selectedUser, selectUser } = useUsers();

  useEffect(() => {
    if (!id) return;

    selectUser(id).catch((error) => {
      handleError(error, "Erro ao buscar usuário");
      navigate("/users");
    });
  }, [id, navigate, selectUser]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Visualizar usuário</CardTitle>
      </CardHeader>
      <CardContent>
        {selectedUser ? (
          <UserForm
            mode="view"
            initialData={selectedUser}
            onBack={() => navigate("/users")}
          />
        ) : (
          <Skeleton className="h-64 w-full" />
        )}
      </CardContent>
    </Card>
  );
}

export default function ViewUserPageWrapper() {
  return (
    <UsersProvider>
      <ViewUser />
    </UsersProvider>
  );
}
