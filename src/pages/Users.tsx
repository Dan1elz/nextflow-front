import { useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import type { ColumnDef } from "@tanstack/react-table";
import { Search } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { EntityIndexPage } from "@/components/app/entity-index-page";
import { ListFiltersSheet } from "@/components/app/list-filters-sheet";
import { NavActionColumn } from "@/components/app/nav-action-column";
import { SearchSelect } from "@/components/app/search-select";
import { useAuth } from "@/hooks/use-auth";
import { useIndexSearch } from "@/hooks/use-index-search";
import { useUsers } from "@/hooks/use-users";
import type { IOption } from "@/interfaces/api.interface";
import type { UserListItemDto } from "@/interfaces/user.interface";
import { UsersProvider } from "@/providers/users.provider";
import { ROLE_ENUM_LABELS } from "@/types/enums";
import { formatDateOnly, formatDateTime } from "@/utils/format.helpers";
import { handleError, handleSuccess } from "@/utils/toast.helpers";

type UserFilters = {
  search: string;
  isActive: string;
};

const statusOptions: IOption[] = [
  { value: "true", label: "Ativo" },
  { value: "false", label: "Inativo" },
];

function Users() {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
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
    initialFilters: { search: "", isActive: "" },
    quickSearchKey: "search",
    perPageInitial: 10,
    debounceMs: 400,
    onError: (error) => handleError(error, "Erro ao buscar usuários"),
  });

  const handleEdit = useCallback(
    (user: UserListItemDto) => navigate(`/users/${user.id}/edit`),
    [navigate]
  );

  const handleView = useCallback(
    (user: UserListItemDto) => navigate(`/users/${user.id}/view`),
    [navigate]
  );

  const handleReactivate = useCallback(
    async (user: UserListItemDto) => {
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

  const handleDelete = useCallback(
    async (user: UserListItemDto) => {
      try {
        await deleteUser(user.id);
        handleSuccess("Usuário inativado com sucesso");
        await handleSearch(1);
      } catch (error) {
        handleError(error, "Erro ao inativar usuário");
      }
    },
    [deleteUser, handleSearch]
  );

  const columns = useMemo<ColumnDef<UserListItemDto>[]>(
    () => [
      { accessorKey: "fullName", header: "Nome" },
      { accessorKey: "email", header: "E-mail" },
      { accessorKey: "cpfMasked", header: "CPF" },
      {
        accessorKey: "role",
        header: "Perfil",
        cell: ({ row }) => ROLE_ENUM_LABELS[row.original.role],
      },
      {
        accessorKey: "isActive",
        header: "Status",
        cell: ({ row }) => (
          <Badge variant={row.original.isActive ? "default" : "secondary"}>
            {row.original.isActive ? "Ativo" : "Inativo"}
          </Badge>
        ),
      },
      {
        accessorKey: "createdAt",
        header: "Criado em",
        cell: ({ row }) => formatDateOnly(new Date(row.original.createdAt)),
      },
      {
        accessorKey: "lastLoginAt",
        header: "Último acesso",
        cell: ({ row }) =>
          row.original.lastLoginAt
            ? formatDateTime(row.original.lastLoginAt)
            : "-",
      },
      {
        id: "actions",
        header: "Ações",
        cell: ({ row }) => (
          <NavActionColumn
            object={row.original}
            onView={handleView}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onReactivate={handleReactivate}
            // L-AC2: a API também recusa; aqui só não oferece inativar a si mesmo.
            disableDelete={
              !row.original.isActive || row.original.id === currentUser?.id
            }
            disableEdit={!row.original.isActive}
            disableReactivate={row.original.isActive}
            deleteLabel="Inativar"
            deleteDialogTitle="Inativar este usuário?"
            deleteDialogDescription="O usuário perde o acesso na hora. Você pode reativá-lo depois."
            deleteButtonLabel="Inativar"
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
    ],
    [currentUser?.id, handleDelete, handleEdit, handleView, handleReactivate]
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
              <Search />
            </InputGroupAddon>
            <InputGroupInput
              value={filters.search}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, search: e.target.value }))
              }
              placeholder="Pesquisar por nome ou e-mail..."
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
          </ListFiltersSheet>
        </>
      }
      columns={columns}
      data={users}
      pagination={pagination}
      onPageChange={handlePageChange}
      onPerPageChange={setPerPage}
      onCreate={() => navigate("/users/create")}
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
