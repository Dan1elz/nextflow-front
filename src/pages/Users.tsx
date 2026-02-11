import { useMemo, useCallback, type ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import type { ColumnDef } from "@tanstack/react-table";
import { Search } from "lucide-react";

import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { SearchSelect } from "@/components/app/search-select";
import type { IOption } from "@/interfaces/api.interface";
import { EntityIndexPage } from "@/components/app/entity-index-page";
import { ListFiltersSheet } from "@/components/app/list-filters-sheet";
import { NavActionColumn } from "@/components/app/nav-action-column";
import { useUsers } from "@/hooks/use-users";
import { handleError, handleSuccess } from "@/utils/toast.helpers";
import type { IUser } from "@/interfaces/user.interface";
import { formatCpfCnpj, formatDateOnly } from "@/utils/format.helpers";
import { UsersProvider } from "@/providers/users.provider";
import { useIndexSearch } from "@/hooks/use-index-search";

type UserFilters = {
  search: string;
  email: string;
  cpf: string;
  isActive: string;
};

const statusOptions: IOption[] = [
  { value: "true", label: "Ativo" },
  { value: "false", label: "Inativo" },
];

function Users() {
  const navigate = useNavigate();
  const { users, pagination, searchUsers, deleteUser, reactivateUser } =
    useUsers();
  const {
    setPerPage,
    selectedIds,
    setSelectedIds,
    filters,
    setFilters,
    resetFilters,
    isFiltersOpen,
    handleFiltersOpenChange,
    handleSearch,
    handlePageChange,
  } = useIndexSearch<UserFilters, "search">({
    search: searchUsers,
    initialFilters: {
      search: "",
      email: "",
      cpf: "",
      isActive: "",
    },
    quickSearchKey: "search",
    perPageInitial: 10,
    debounceMs: 400,
    onError: (error) => {
      handleError(error, "Erro desconhecido ao buscar usuários");
    },
  });

  const handleCreate = () => navigate("/users/create");

  const handleEdit = useCallback(
    (user: IUser) => {
      if (user.id) {
        navigate(`/users/${user.id}/edit`);
      }
    },
    [navigate]
  );

  const handleReactivate = useCallback(
    async (user: IUser) => {
      if (!user.id) return;

      try {
        await reactivateUser(user.id);
        handleSuccess("Usuário reativado com sucesso");
        await handleSearch(1);
      } catch (error) {
        handleError(error, "Erro ao reativar usuário");
      }
    },
    [reactivateUser, handleSearch]
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
        await handleSearch(1);
      } catch (error) {
        handleError(error, "Erro ao excluir usuário");
      }
    },
    [deleteUser, handleSearch]
  );
  const handleExport = useCallback((_ids?: string[]) => {
    void _ids;
    // Função vazia conforme solicitado
  }, []);

  const handleDeleteMultiple = useCallback((_ids: string[]) => {
    void _ids;
    // Função vazia conforme solicitado
  }, []);

  const handleImport = useCallback((event: ChangeEvent<HTMLInputElement>) => {
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
  }, []);

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
        accessorKey: "birthDate",
        header: "Data de Nascimento",
        cell: ({ row }) =>
          row.original.birthDate ? formatDateOnly(row.original.birthDate) : "-",
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
          const user = row.original;
          return (
            <Badge variant={user.isActive ? "default" : "secondary"}>
              {user.isActive ? "Ativo" : "Inativo"}
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
              onReactivate={handleReactivate}
              onDelete={handleDelete}
              onView={handleView}
              disableDelete={!row.original.isActive}
              disableEdit={!row.original.isActive}
              disableReactivate={row.original.isActive}
            />
          );
        },
        enableSorting: false,
        enableHiding: false,
      },
    ],
    [handleDelete, handleEdit, handleView, handleReactivate]
  );

  return (
    <EntityIndexPage
      title="Usuários"
      selectedIds={selectedIds}
      onSelectionChange={setSelectedIds}
      toolbar={
        <>
          <InputGroup className="w-full md:w-[280px]">
            <InputGroupAddon>
              <Search className="h-4 w-4" />
            </InputGroupAddon>
            <InputGroupInput
              value={filters.search}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, search: e.target.value }))
              }
              placeholder="Pesquisar usuário..."
              aria-label="Pesquisar usuário"
            />
          </InputGroup>

          <ListFiltersSheet
            open={isFiltersOpen}
            onOpenChange={handleFiltersOpenChange}
            description="Filtre a listagem de usuários."
            onApply={() => {
              handleSearch(1);
              handleFiltersOpenChange(false);
            }}
            onClear={() => {
              resetFilters();
              handleSearch(1);
              handleFiltersOpenChange(false);
            }}
          >
            <div className="grid gap-2">
              <Label htmlFor="userFilterSearch">Nome</Label>
              <Input
                id="userFilterSearch"
                value={filters.search}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    search: e.target.value,
                  }))
                }
                placeholder="Ex.: Maria"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="userFilterEmail">Email</Label>
              <Input
                id="userFilterEmail"
                value={filters.email}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    email: e.target.value,
                  }))
                }
                placeholder="Ex.: maria@empresa.com"
                inputMode="email"
                autoComplete="off"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="userFilterCpf">CPF</Label>
              <Input
                id="userFilterCpf"
                value={filters.cpf}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    cpf: e.target.value,
                  }))
                }
                placeholder="Ex.: 000.000.000-00"
                autoComplete="off"
              />
            </div>

            <div className="grid gap-2">
              <SearchSelect<IOption>
                field={{
                  value: filters.isActive,
                  onChange: (value) =>
                    setFilters((prev) => ({
                      ...prev,
                      isActive: value ? String(value) : "",
                    })),
                }}
                label="Status"
                data={statusOptions}
                placeholder="Todos"
              />
            </div>
          </ListFiltersSheet>
        </>
      }
      columns={columns}
      data={users}
      pagination={pagination}
      onPageChange={handlePageChange}
      onPerPageChange={setPerPage}
      onCreate={handleCreate}
      onImport={handleImport}
      onExport={handleExport}
      onDeleteMultiple={handleDeleteMultiple}
    />
  );
}

export default function UsersPageWrapper() {
  return (
    <UsersProvider>
      <Users />
    </UsersProvider>
  );
}
