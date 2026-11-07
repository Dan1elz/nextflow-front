import { useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import type { ColumnDef } from "@tanstack/react-table";
import { Search } from "lucide-react";

import { EntityIndexPage } from "@/components/app/entity-index-page";
import { ListFiltersSheet } from "@/components/app/list-filters-sheet";
import { NavActionColumn } from "@/components/app/nav-action-column";
import { OwnerActivityFilters } from "@/components/app/owner-activity-filters";
import { SearchSelect } from "@/components/app/search-select";
import { Badge } from "@/components/ui/badge";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { useIndexSearch } from "@/hooks/use-index-search";
import { useSuppliers } from "@/hooks/use-suppliers";
import type { IOption } from "@/interfaces/api.interface";
import type { SupplierListItemDto } from "@/interfaces/supplier.interface";
import { SuppliersProvider } from "@/providers/suppliers.provider";
import {
  formatCpfCnpj,
  formatDateOnly,
  formatPhone,
} from "@/utils/format.helpers";
import { handleError, handleSuccess } from "@/utils/toast.helpers";

type SupplierFilters = {
  search: string;
  isActive: string;
  stateId: string;
  cityId: string;
  purchases: string;
  pendingOrders: string;
};

const statusOptions: IOption[] = [
  { value: "true", label: "Ativo" },
  { value: "false", label: "Inativo" },
];

const pendingOptions: IOption[] = [
  { value: "true", label: "Com pedido a receber" },
  { value: "false", label: "Sem pedido a receber" },
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
      isActive: "",
      stateId: "",
      cityId: "",
      purchases: "",
      pendingOrders: "",
    },
    quickSearchKey: "search",
    perPageInitial: 10,
    debounceMs: 400,
    onError: (error) => handleError(error, "Erro ao buscar fornecedores"),
  });

  const handleEdit = useCallback(
    (supplier: SupplierListItemDto) =>
      navigate(`/suppliers/${supplier.id}/edit`),
    [navigate]
  );

  const handleView = useCallback(
    (supplier: SupplierListItemDto) =>
      navigate(`/suppliers/${supplier.id}/view`),
    [navigate]
  );

  const handleDelete = useCallback(
    async (supplier: SupplierListItemDto) => {
      try {
        await deleteSupplier(supplier.id);
        handleSuccess("Fornecedor inativado com sucesso");
        await handleSearch(1);
      } catch (error) {
        handleError(error, "Erro ao inativar fornecedor");
      }
    },
    [deleteSupplier, handleSearch]
  );

  const handleReactivate = useCallback(
    async (supplier: SupplierListItemDto) => {
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

  const columns = useMemo<ColumnDef<SupplierListItemDto>[]>(
    () => [
      { accessorKey: "name", header: "Nome" },
      {
        accessorKey: "cnpj",
        header: "CNPJ",
        cell: ({ row }) => (
          <span className="whitespace-nowrap">
            {formatCpfCnpj(row.original.cnpj)}
          </span>
        ),
      },
      {
        accessorKey: "cityState",
        header: "Cidade/UF",
        cell: ({ row }) => row.original.cityState ?? "-",
      },
      {
        accessorKey: "mainContact",
        header: "Contato",
        cell: ({ row }) => {
          const contact = row.original.mainContact;
          if (!contact) return "-";
          return contact.includes("@") ? contact : formatPhone(contact);
        },
      },
      { accessorKey: "leadTimeDays", header: "Prazo (dias)" },
      {
        accessorKey: "realLeadTimeDays",
        header: "Prazo real",
        cell: ({ row }) => row.original.realLeadTimeDays ?? "-",
      },
      { accessorKey: "productCount", header: "Produtos" },
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
            deleteDialogTitle="Inativar este fornecedor?"
            deleteDialogDescription="O fornecedor sai dos combos de compra. Você pode reativá-lo depois."
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
      title="Fornecedores"
      onRowOpen={handleView}
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
              placeholder="Pesquisar por nome ou CNPJ..."
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
            <OwnerActivityFilters
              filters={filters}
              setFilters={setFilters}
              purchasesLabel="Pedidos de compra"
            />
            <SearchSelect<IOption>
              field={{
                value: filters.pendingOrders,
                onChange: (value) =>
                  setFilters((prev) => ({
                    ...prev,
                    pendingOrders: value ? String(value) : "",
                  })),
              }}
              label="Pedido a receber"
              data={pendingOptions}
              placeholder="Todos"
            />
          </ListFiltersSheet>
        </>
      }
      columns={columns}
      data={suppliers}
      pagination={pagination}
      onPageChange={handlePageChange}
      onPerPageChange={setPerPage}
      onCreate={() => navigate("/suppliers/create")}
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
