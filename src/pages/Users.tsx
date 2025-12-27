import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import type { ColumnDef } from "@tanstack/react-table";
import { Plus } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/app/data-table";
import { NavActionColumn } from "@/components/app/nav-action-column";
import { useUsers } from "@/hooks/use-users";
import { handleError, handleSuccess } from "@/utils/toast.helpers";
import type { IUser } from "@/interfaces/user.interface";
import { formatCpfCnpj } from "@/utils/format.helpers";
import { UsersProvider } from "@/providers/users.provider";

function Users() {
  const navigate = useNavigate();
  const { users, pagination, searchUsers, deleteUser } = useUsers();
  const [perPage, setPerPage] = useState(10);
  const hasSearched = useRef(false);

  const searchUsersRef = useRef(searchUsers);
  const perPageRef = useRef(perPage);

  useEffect(() => {
    searchUsersRef.current = searchUsers;
  }, [searchUsers]);

  useEffect(() => {
    perPageRef.current = perPage;
  }, [perPage]);

  const handleSearch = useCallback((page = 1) => {
    searchUsersRef
      .current({
        filters: {},
        page,
        perPage: perPageRef.current,
      })
      .catch((error) => {
        handleError(error, "Erro desconhecido ao buscar usuários");
      });
  }, []);

  const handlePageChange = (page: number) => handleSearch(page);

  const handleCreate = () => navigate("/users/create");

  const handleEdit = useCallback(
    (user: IUser) => {
      if (user.id) {
        navigate(`/users/${user.id}/edit`);
      }
    },
    [navigate]
  );

  const handleDelete = useCallback(
    async (user: IUser) => {
      if (!user.id) return;

      try {
        await deleteUser(user.id);
        handleSuccess("Usuário excluído com sucesso");
        handleSearch(1);
      } catch (error) {
        handleError(error, "Erro ao excluir usuário");
      }
    },
    [deleteUser, handleSearch]
  );

  useEffect(() => {
    if (hasSearched.current) {
      searchUsersRef
        .current({
          filters: {},
          page: 1,
          perPage,
        })
        .catch((error) =>
          handleError(error, "Erro desconhecido ao buscar usuários")
        );
    } else {
      hasSearched.current = true;
      handleSearch(1);
    }
  }, [perPage, handleSearch]);

  const columns = useMemo<ColumnDef<IUser>[]>(
    () => [
      {
        id: "select",
        header: "",
        cell: () => null,
        enableSorting: false,
        enableHiding: false,
      },
      {
        accessorKey: "name",
        header: "Nome",
        cell: ({ row }) => {
          const user = row.original;
          return `${user.name} ${user.lastName}`;
        },
      },
      {
        accessorKey: "email",
        header: "Email",
      },
      {
        accessorKey: "cpf",
        header: "CPF",
        cell: ({ row }) => {
          return formatCpfCnpj(row.original.cpf);
        },
      },
      {
        id: "actions",
        header: "Ações",
        cell: ({ row }) => {
          return (
            <NavActionColumn
              object={row.original}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          );
        },
        enableSorting: false,
        enableHiding: false,
      },
    ],
    [handleDelete, handleEdit]
  );

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Usuários</CardTitle>
            <Button onClick={handleCreate}>
              <Plus />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={users}
            page={pagination?.currentPage ?? 1}
            totalPages={pagination?.lastPage ?? 1}
            total={pagination?.total ?? 0}
            onPageChange={handlePageChange}
            onPerPageChange={setPerPage}
          />
        </CardContent>
      </Card>
    </div>
  );
}

export default function UsersPageWrapper() {
  return (
    <UsersProvider>
      <Users />
    </UsersProvider>
  );
}
