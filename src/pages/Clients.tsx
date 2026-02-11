import { useMemo, useCallback } from "react";
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
import { useClients } from "@/hooks/use-clients";
import { handleError, handleSuccess } from "@/utils/toast.helpers";
import type { IClient } from "@/interfaces/client.interface";
import { formatCpfCnpj, formatDateOnly } from "@/utils/format.helpers";
import { ClientsProvider } from "@/providers/clients.provider";
import { useIndexSearch } from "@/hooks/use-index-search";

type ClientFilters = {
  search: string;
  cpf: string;
  isActive: string;
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
    initialFilters: {
      search: "",
      cpf: "",
      isActive: "",
    },
    quickSearchKey: "search",
    perPageInitial: 10,
    debounceMs: 400,
    onError: (error) => {
      handleError(error, "Erro desconhecido ao buscar clientes");
    },
  });

  const handleCreate = () => navigate("/clients/create");

  const handleEdit = useCallback(
    (client: IClient) => {
      if (client.id) {
        navigate(`/clients/${client.id}/edit`);
      }
    },
    [navigate]
  );

  const handleView = useCallback(
    (client: IClient) => {
      if (client.id) {
        navigate(`/clients/${client.id}/view`);
      }
    },
    [navigate]
  );

  const handleReactivate = useCallback(
    async (client: IClient) => {
      if (!client.id) return;

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

  const handleDelete = useCallback(
    async (client: IClient) => {
      if (!client.id) return;

      try {
        await deleteClient(client.id);
        handleSuccess("Cliente excluído com sucesso");
        await handleSearch(1);
      } catch (error) {
        handleError(error, "Erro ao excluir cliente");
      }
    },
    [deleteClient, handleSearch]
  );
  const handleExport = useCallback((_ids?: string[]) => {
    void _ids;
    // Função vazia conforme solicitado
  }, []);

  const handleDeleteMultiple = useCallback((_ids: string[]) => {
    void _ids;
    // Função vazia conforme solicitado
  }, []);

  const columns = useMemo<ColumnDef<IClient>[]>(
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
          const client = row.original;
          return `${client.name} ${client.lastName}`;
        },
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
        cell: ({ row }) => formatCpfCnpj(row.original.cpf),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
          const client = row.original;
          return (
            <Badge variant={client.isActive ? "default" : "secondary"}>
              {client.isActive ? "Ativo" : "Inativo"}
            </Badge>
          );
        },
      },
      {
        id: "actions",
        header: "Ações",
        cell: ({ row }) => (
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
        ),
        enableSorting: false,
        enableHiding: false,
      },
    ],
    [handleDelete, handleEdit, handleView, handleReactivate]
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
              <Search className="h-4 w-4" />
            </InputGroupAddon>
            <InputGroupInput
              value={filters.search}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, search: e.target.value }))
              }
              placeholder="Pesquisar cliente..."
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
            <div className="grid gap-2">
              <Label htmlFor="clientFilterSearch">Nome</Label>
              <Input
                id="clientFilterSearch"
                value={filters.search}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    search: e.target.value,
                  }))
                }
                placeholder="Ex.: João"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="clientFilterCpf">CPF</Label>
              <Input
                id="clientFilterCpf"
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
      data={clients}
      pagination={pagination}
      onPageChange={handlePageChange}
      onPerPageChange={setPerPage}
      onCreate={handleCreate}
      onExport={handleExport}
      onDeleteMultiple={handleDeleteMultiple}
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
