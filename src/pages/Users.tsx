import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import type { ColumnDef } from "@tanstack/react-table";
import { Plus, Download, Trash2, Upload } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
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
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
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

  const handleView = useCallback(
    (user: IUser) => {
      if (user.id) {
        navigate(`/users/${user.id}/view`);
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
  //eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleExport = useCallback((_ids?: string[]) => {
    // Função vazia conforme solicitado
  }, []);

  //eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleDeleteMultiple = useCallback((_ids: string[]) => {
    // Função vazia conforme solicitado
  }, []);

  const handleImport = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      if (!file.name.endsWith(".csv")) {
        handleError(new Error("Arquivo deve ser CSV"), "Formato inválido");
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result;
        if (typeof result === "string") {
          const base64 = btoa(result);
          // Arquivo convertido para base64, pronto para enviar
          console.log("Arquivo em base64:", base64);
        }
      };
      reader.readAsText(file);
    },
    []
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
        header: ({ table }) => {
          const isAllSelected = table.getIsAllPageRowsSelected();
          const isSomeSelected = table.getIsSomePageRowsSelected();
          return (
            <Checkbox
              checked={isAllSelected}
              indeterminate={isSomeSelected && !isAllSelected}
              onCheckedChange={(value) =>
                table.toggleAllPageRowsSelected(!!value)
              }
              aria-label="Selecionar todos"
            />
          );
        },
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Selecionar linha"
          />
        ),
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
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
          const status = row.original.status || "ativo";
          return (
            <Badge
              variant={
                status.toLowerCase() === "ativo" ||
                status.toLowerCase() === "active"
                  ? "default"
                  : "secondary"
              }
            >
              {status}
            </Badge>
          );
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
              onView={handleView}
            />
          );
        },
        enableSorting: false,
        enableHiding: false,
      },
    ],
    [handleDelete, handleEdit, handleView]
  );

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle>Usuários</CardTitle>
              {selectedIds.length > 0 && (
                <span className="text-sm text-muted-foreground">
                  {selectedIds.length} selecionado
                  {selectedIds.length > 1 ? "s" : ""}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleImport}
                className="hidden"
              />
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                onClick={() =>
                  handleExport(selectedIds.length > 0 ? selectedIds : undefined)
                }
              >
                <Download className="h-4 w-4" />
              </Button>
              {selectedIds.length > 0 && (
                <Button
                  // variant="destructive"
                  variant="outline"
                  className="text-destructive border-destructive hover:text-destructive"
                  onClick={() => handleDeleteMultiple(selectedIds)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
              <Button onClick={handleCreate}>
                <Plus />
              </Button>
            </div>
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
            onSelectionChange={setSelectedIds}
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
