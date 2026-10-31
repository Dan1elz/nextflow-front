import { useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import type { ColumnDef } from "@tanstack/react-table";
import { Search } from "lucide-react";

import { EntityIndexPage } from "@/components/app/entity-index-page";
import { ListFiltersSheet } from "@/components/app/list-filters-sheet";
import { NavActionColumn } from "@/components/app/nav-action-column";
import { SearchSelect } from "@/components/app/search-select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldLabel } from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { useClients } from "@/hooks/use-clients";
import { useIndexSearch } from "@/hooks/use-index-search";
import type { IOption } from "@/interfaces/api.interface";
import type { ClientListItemDto } from "@/interfaces/client.interface";
import { ClientsProvider } from "@/providers/clients.provider";
import {
  formatCpfCnpj,
  formatCurrency,
  formatDateOnly,
  formatPhone,
} from "@/utils/format.helpers";
import { handleError, handleSuccess } from "@/utils/toast.helpers";

type ClientFilters = {
  search: string;
  isActive: string;
  birthdaysThisMonth: string;
};

const statusOptions: IOption[] = [
  { value: "true", label: "Ativo" },
  { value: "false", label: "Inativo" },
];

function Clients() {
  const navigate = useNavigate();
  const { clients, pagination, searchClients, deleteClient, reactivateClient } =
    useClients();
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
  } = useIndexSearch<ClientFilters, "search">({
    search: searchClients,
    initialFilters: { search: "", isActive: "", birthdaysThisMonth: "" },
    quickSearchKey: "search",
    perPageInitial: 10,
    debounceMs: 400,
    onError: (error) => handleError(error, "Erro ao buscar clientes"),
  });

  const handleEdit = useCallback(
    (client: ClientListItemDto) => navigate(`/clients/${client.id}/edit`),
    [navigate]
  );

  const handleView = useCallback(
    (client: ClientListItemDto) => navigate(`/clients/${client.id}/view`),
    [navigate]
  );

  const handleDelete = useCallback(
    async (client: ClientListItemDto) => {
      try {
        await deleteClient(client.id);
        handleSuccess("Cliente inativado com sucesso");
        await handleSearch(1);
      } catch (error) {
        handleError(error, "Erro ao inativar cliente");
      }
    },
    [deleteClient, handleSearch]
  );

  const handleReactivate = useCallback(
    async (client: ClientListItemDto) => {
      try {
        await reactivateClient(client.id);
        handleSuccess("Cliente reativado com sucesso");
        await handleSearch(1);
      } catch (error) {
        handleError(error, "Erro ao reativar cliente");
      }
    },
    [reactivateClient, handleSearch]
  );

  const columns = useMemo<ColumnDef<ClientListItemDto>[]>(
    () => [
      { accessorKey: "fullName", header: "Nome" },
      {
        accessorKey: "cpf",
        header: "CPF",
        cell: ({ row }) =>
          row.original.cpf ? formatCpfCnpj(row.original.cpf) : "-",
      },
      {
        accessorKey: "mainPhone",
        header: "Telefone",
        cell: ({ row }) =>
          row.original.mainPhone ? formatPhone(row.original.mainPhone) : "-",
      },
      {
        accessorKey: "cityState",
        header: "Cidade/UF",
        cell: ({ row }) => row.original.cityState ?? "-",
      },
      { accessorKey: "orderCount", header: "Compras" },
      {
        accessorKey: "totalSpent",
        header: "Total comprado",
        cell: ({ row }) => formatCurrency(row.original.totalSpent),
      },
      {
        accessorKey: "lastPurchaseOn",
        header: "Última compra",
        cell: ({ row }) =>
          row.original.lastPurchaseOn
            ? formatDateOnly(row.original.lastPurchaseOn)
            : "-",
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
        id: "actions",
        header: "Ações",
        cell: ({ row }) => (
          <NavActionColumn
            object={row.original}
            onView={handleView}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onReactivate={handleReactivate}
            disableDelete={!row.original.isActive}
            disableEdit={!row.original.isActive}
            disableReactivate={row.original.isActive}
            deleteLabel="Inativar"
            deleteDialogTitle="Inativar este cliente?"
            deleteDialogDescription="O cliente sai dos combos de venda. Você pode reativá-lo depois."
            deleteButtonLabel="Inativar"
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
    ],
    [handleDelete, handleEdit, handleReactivate, handleView]
  );

  return (
    <EntityIndexPage
      title="Clientes"
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
              placeholder="Pesquisar por nome, CPF ou telefone..."
              aria-label="Pesquisar cliente"
            />
          </InputGroup>

          <ListFiltersSheet
            open={isFiltersOpen}
            onOpenChange={handleFiltersOpenChange}
            description="Filtre a listagem de clientes."
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
            <Field orientation="horizontal">
              <Checkbox
                id="birthdaysThisMonth"
                checked={filters.birthdaysThisMonth === "true"}
                onCheckedChange={(value) =>
                  setFilters((prev) => ({
                    ...prev,
                    birthdaysThisMonth: value ? "true" : "",
                  }))
                }
              />
              <FieldLabel htmlFor="birthdaysThisMonth">
                Aniversariantes do mês
              </FieldLabel>
            </Field>
          </ListFiltersSheet>
        </>
      }
      columns={columns}
      data={clients}
      pagination={pagination}
      onPageChange={handlePageChange}
      onPerPageChange={setPerPage}
      onCreate={() => navigate("/clients/create")}
    />
  );
}

export default function ClientsPageWrapper() {
  return (
    <ClientsProvider>
      <Clients />
    </ClientsProvider>
  );
}
