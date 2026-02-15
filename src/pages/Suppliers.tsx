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
import { useSuppliers } from "@/hooks/use-suppliers";
import { handleError, handleSuccess } from "@/utils/toast.helpers";
import type { ISupplier } from "@/interfaces/supplier.interface";
import { formatCpfCnpj } from "@/utils/format.helpers";
import { SuppliersProvider } from "@/providers/suppliers.provider";
import { useIndexSearch } from "@/hooks/use-index-search";

type SupplierFilters = {
  search: string;
  cnpj: string;
  isActive: string;
};

const statusOptions: IOption[] = [
  { value: "true", label: "Ativo" },
  { value: "false", label: "Inativo" },
];

function Suppliers() {
  const navigate = useNavigate();
  const {
    suppliers,
    pagination,
    searchSuppliers,
    deleteSupplier,
    reactivateSupplier,
  } = useSuppliers();

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
  } = useIndexSearch<SupplierFilters, "search">({
    search: searchSuppliers,
    initialFilters: {
      search: "",
      cnpj: "",
      isActive: "",
    },
    quickSearchKey: "search",
    perPageInitial: 10,
    debounceMs: 400,
    onError: (error) => {
      handleError(error, "Erro desconhecido ao buscar fornecedores");
    },
  });

  const handleCreate = () => navigate("/suppliers/create");

  const handleEdit = useCallback(
    (supplier: ISupplier) => {
      if (supplier.id) {
        navigate(`/suppliers/${supplier.id}/edit`);
      }
    },
    [navigate]
  );

  const handleView = useCallback(
    (supplier: ISupplier) => {
      if (supplier.id) {
        navigate(`/suppliers/${supplier.id}/view`);
      }
    },
    [navigate]
  );

  const handleReactivate = useCallback(
    async (supplier: ISupplier) => {
      if (!supplier.id) return;

      try {
        await reactivateSupplier(supplier.id);
        handleSuccess("Fornecedor reativado com sucesso");
        await handleSearch(1);
      } catch (error) {
        handleError(error, "Erro ao reativar fornecedor");
      }
    },
    [reactivateSupplier, handleSearch]
  );

  const handleDelete = useCallback(
    async (supplier: ISupplier) => {
      if (!supplier.id) return;

      try {
        await deleteSupplier(supplier.id);
        handleSuccess("Fornecedor excluído com sucesso");
        await handleSearch(1);
      } catch (error) {
        handleError(error, "Erro ao excluir fornecedor");
      }
    },
    [deleteSupplier, handleSearch]
  );

  const handleExport = useCallback((_ids?: string[]) => {
    void _ids;
  }, []);

  const handleDeleteMultiple = useCallback((_ids: string[]) => {
    void _ids;
  }, []);

  const columns = useMemo<ColumnDef<ISupplier>[]>(
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
        header: "Nome/Razão Social",
        cell: ({ row }) => row.original.name,
      },
      {
        accessorKey: "cnpj",
        header: "CNPJ",
        cell: ({ row }) => formatCpfCnpj(row.original.cnpj),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
          const supplier = row.original;
          return (
            <Badge variant={supplier.isActive ? "default" : "secondary"}>
              {supplier.isActive ? "Ativo" : "Inativo"}
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
      title="Fornecedores"
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
              placeholder="Pesquisar fornecedor..."
              aria-label="Pesquisar fornecedor"
            />
          </InputGroup>

          <ListFiltersSheet
            open={isFiltersOpen}
            onOpenChange={handleFiltersOpenChange}
            description="Filtre a listagem de fornecedores."
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
              <Label htmlFor="supplierFilterSearch">Nome</Label>
              <Input
                id="supplierFilterSearch"
                value={filters.search}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    search: e.target.value,
                  }))
                }
                placeholder="Ex.: Distribuidora X"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="supplierFilterCnpj">CNPJ</Label>
              <Input
                id="supplierFilterCnpj"
                value={filters.cnpj}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    cnpj: e.target.value,
                  }))
                }
                placeholder="Ex.: 00.000.000/0000-00"
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
      data={suppliers}
      pagination={pagination}
      onPageChange={handlePageChange}
      onPerPageChange={setPerPage}
      onCreate={handleCreate}
      onExport={handleExport}
      onDeleteMultiple={handleDeleteMultiple}
    />
  );
}

export default function SuppliersPageWrapper() {
  return (
    <SuppliersProvider>
      <Suppliers />
    </SuppliersProvider>
  );
}
