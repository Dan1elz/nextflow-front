import { useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import type { ColumnDef } from "@tanstack/react-table";
import { Search, PackageCheck } from "lucide-react";

import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EntityIndexPage } from "@/components/app/entity-index-page";
import { ListFiltersSheet } from "@/components/app/list-filters-sheet";
import { NavActionColumn } from "@/components/app/nav-action-column";
import { SearchSelect } from "@/components/app/search-select";

import { handleError, handleSuccess } from "@/utils/toast.helpers";
import { formatDateTime, formatCurrency } from "@/utils";
import { usePurchaseOrders } from "@/hooks/use-purchase-orders";
import { useIndexSearch } from "@/hooks/use-index-search";
import { useSearchOptions } from "@/hooks/use-search-options";

import type { IPurchaseOrder } from "@/interfaces/purchase-order.interface";
import type { ISupplier } from "@/interfaces/supplier.interface";
import type { IIndexParams, IOption } from "@/interfaces/api.interface";

import { PurchaseOrdersProvider } from "@/providers/purchase-orders.provider";
import { SuppliersProvider } from "@/providers/suppliers.provider";

import { useSuppliers } from "@/hooks/use-suppliers";
import { Badge } from "@/components/ui/badge";
import { PURCHASE_STATUS_LABELS, TPurchaseStatus } from "@/types/enums";

type PurchaseOrderFilters = {
  search: string;
  statusGroup: string;
  supplierId: string;
  minAmount: string;
  maxAmount: string;
  minUpdateAt: string;
  maxUpdateAt: string;
};

function PurchaseOrders() {
  const navigate = useNavigate();
  const {
    purchaseOrders,
    pagination,
    searchPurchaseOrders,
    deletePurchaseOrder,
    updatePurchaseOrder,
  } = usePurchaseOrders();
  const { searchSuppliersForOptions, getSupplierById } = useSuppliers();

  const customSearch = useCallback(
    async (params?: IIndexParams) => {
      const activeFilters = { ...params?.filters } as Record<string, string>;
      
      // Map statusGroup tab to actual status filter
      if (activeFilters.statusGroup && activeFilters.statusGroup !== "all") {
        const statusMap: Record<string, string> = {
          budget: String(TPurchaseStatus.Budget),
          pending: String(TPurchaseStatus.Pending),
          received: String(TPurchaseStatus.Received),
        };
        
        if (activeFilters.statusGroup !== "canceled") {
          activeFilters.status = statusMap[activeFilters.statusGroup] ?? "";
        }
      }

      // Explicitly handle Active filter based on tab
      if (activeFilters.statusGroup === "canceled") {
        activeFilters.active = "false";
      } else if (activeFilters.statusGroup !== "all") {
        activeFilters.active = "true";
      }
      
      delete activeFilters.statusGroup;
      await searchPurchaseOrders({ ...params, filters: activeFilters });
    },
    [searchPurchaseOrders]
  );

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
  } = useIndexSearch<PurchaseOrderFilters, "search">({
    search: customSearch,
    initialFilters: {
      search: "",
      statusGroup: "all",
      supplierId: "",
      minAmount: "",
      maxAmount: "",
      minUpdateAt: "",
      maxUpdateAt: "",
    },
    quickSearchKey: "search",
    perPageInitial: 10,
    debounceMs: 400,
    onError: (error) => {
      handleError(error, "Erro ao buscar pedidos de compra");
    },
  });

  const { options: supplierOptions, handleSearch: handleSearchSuppliers } =
    useSearchOptions<ISupplier>({
      searchFn: searchSuppliersForOptions,
      mapFn: (supplier) => ({
        value: supplier.id ?? "",
        label: supplier.name || "Fornecedor",
      }),
      selectFn: getSupplierById,
      errorLabel: "fornecedores",
      autoLoad: false,
      perPage: 50,
    });

  const handleCreate = () => navigate("/purchase-orders/create");

  const handleEdit = useCallback(
    (order: IPurchaseOrder) => navigate(`/purchase-orders/${order.id}/edit`),
    [navigate]
  );

  const handleView = useCallback(
    (order: IPurchaseOrder) => navigate(`/purchase-orders/${order.id}/view`),
    [navigate]
  );

  const handleCancel = useCallback(
    async (order: IPurchaseOrder) => {
      if (!order.id) return;
      try {
        await deletePurchaseOrder(order.id);
        handleSuccess("Pedido de compra cancelado com sucesso");
        await handleSearch(1);
      } catch (error) {
        handleError(error, "Erro ao cancelar pedido de compra");
      }
    },
    [deletePurchaseOrder, handleSearch]
  );

  const handleReceive = useCallback(
    async (order: IPurchaseOrder) => {
      if (!order.id) return;
      try {
        await updatePurchaseOrder(order.id, {
          status: TPurchaseStatus.Received,
        });
        handleSuccess("Pedido recebido! Estoque atualizado.");
        await handleSearch(1);
      } catch (error) {
        handleError(error, "Erro ao confirmar recebimento");
      }
    },
    [updatePurchaseOrder, handleSearch]
  );

  const columns = useMemo<ColumnDef<IPurchaseOrder>[]>(
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
        id: "supplier",
        header: "Fornecedor",
        cell: ({ row }) =>
          row.original.supplier ? row.original.supplier.name : "-",
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
          if (!row.original.status) return "-";
          const label =
            PURCHASE_STATUS_LABELS[row.original.status] ?? row.original.status;

          let extraClass = "";
          if (row.original.status === TPurchaseStatus.Received)
            extraClass = "bg-emerald-500 hover:bg-emerald-600 text-white border-none shadow-sm";
          else if (row.original.status === TPurchaseStatus.Canceled)
            extraClass = "bg-rose-500 hover:bg-rose-600 text-white border-none shadow-sm";
          else if (row.original.status === TPurchaseStatus.Pending)
            extraClass = "bg-amber-400 hover:bg-amber-500 text-black border-none shadow-sm";
          else if (row.original.status === TPurchaseStatus.Budget)
            extraClass = "bg-slate-500 hover:bg-slate-600 text-white border-none shadow-sm";

          return <Badge className={`font-semibold ${extraClass}`}>{label}</Badge>;
        },
      },
      {
        accessorKey: "totalAmount",
        header: "Valor Total",
        cell: ({ row }) =>
          formatCurrency(Number(row.original.totalAmount || 0)),
      },
      {
        accessorKey: "createAt",
        header: "Criado",
        cell: ({ row }) =>
          row.original.createAt ? formatDateTime(row.original.createAt) : "-",
      },
      {
        id: "actions",
        header: "Ações",
        cell: ({ row }) => {
          const status = row.original.status as number;
          const isCanceled = status === TPurchaseStatus.Canceled;
          const isReceived = status === TPurchaseStatus.Received;
          const canAct = !isCanceled && !isReceived;

          return (
            <NavActionColumn
              object={row.original}
              onEdit={handleEdit}
              onDelete={canAct ? handleCancel : undefined}
              onView={handleView}
              disableEdit={!canAct}
              deleteLabel="Cancelar"
              deleteDialogTitle="Cancelar Pedido de Compra"
              deleteDialogDescription="Tem certeza que deseja cancelar este pedido de compra? O pedido será marcado como cancelado."
              deleteButtonLabel="Confirmar Cancelamento"
              extraActions={
                canAct
                  ? [
                      {
                        label: "Receber",
                        icon: <PackageCheck className="mr-2 h-4 w-4" />,
                        onClick: handleReceive,
                      },
                    ]
                  : undefined
              }
            />
          );
        },
        enableSorting: false,
        enableHiding: false,
      },
    ],
    [handleCancel, handleEdit, handleView, handleReceive]
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="px-4 md:px-0">
        <Tabs
          value={filters.statusGroup}
          onValueChange={(val) => {
            setFilters((prev) => ({ ...prev, statusGroup: val }));
            setTimeout(() => handleSearch(1), 0);
          }}
          className="w-full flex-wrap"
        >
          <TabsList className="flex w-full md:w-auto overflow-x-auto justify-start h-auto p-1">
            <TabsTrigger value="all">Todos</TabsTrigger>
            <TabsTrigger value="budget">Orçamentos</TabsTrigger>
            <TabsTrigger value="pending">Pendentes</TabsTrigger>
            <TabsTrigger value="received">Recebidos</TabsTrigger>
            <TabsTrigger value="canceled">Cancelados</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <EntityIndexPage
        title="Pedidos de Compra"
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        toolbar={
          <>
            <InputGroup className="w-full md:w-[260px]">
              <InputGroupAddon>
                <Search className="h-4 w-4" />
              </InputGroupAddon>
              <InputGroupInput
                value={filters.search}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, search: e.target.value }))
                }
                placeholder="Buscar (IDs, notas...)"
                aria-label="Pesquisar"
              />
            </InputGroup>

            <ListFiltersSheet
              open={isFiltersOpen}
              onOpenChange={handleFiltersOpenChange}
              description="Filtre os pedidos de compra."
              onApply={() => {
                handleSearch(1);
                handleFiltersOpenChange(false);
              }}
              onClear={() => {
                resetFilters();
                setFilters((prev) => ({
                  ...prev,
                  statusGroup: filters.statusGroup,
                })); // Mantem tab
                handleSearch(1);
                handleFiltersOpenChange(false);
              }}
            >
              <div className="grid gap-4 py-2">
                <div className="grid gap-2">
                  <SearchSelect<IOption>
                    field={{
                      value: filters.supplierId,
                      onChange: (value) =>
                        setFilters((prev) => ({
                          ...prev,
                          supplierId: value ? String(value) : "",
                        })),
                    }}
                    data={supplierOptions}
                    onSearch={handleSearchSuppliers}
                    placeholder="Selecione um fornecedor..."
                    label="Fornecedor"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="grid gap-2">
                    <Label htmlFor="minAmount">Valor Min</Label>
                    <Input
                      id="minAmount"
                      type="number"
                      placeholder="0.00"
                      value={filters.minAmount}
                      onChange={(e) =>
                        setFilters((prev) => ({
                          ...prev,
                          minAmount: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="maxAmount">Valor Max</Label>
                    <Input
                      id="maxAmount"
                      type="number"
                      placeholder="999.00"
                      value={filters.maxAmount}
                      onChange={(e) =>
                        setFilters((prev) => ({
                          ...prev,
                          maxAmount: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="grid gap-2">
                    <Label htmlFor="minUpdateAt">Atualizado (De)</Label>
                    <Input
                      id="minUpdateAt"
                      type="date"
                      value={filters.minUpdateAt}
                      onChange={(e) =>
                        setFilters((prev) => ({
                          ...prev,
                          minUpdateAt: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="maxUpdateAt">Atualizado (Até)</Label>
                    <Input
                      id="maxUpdateAt"
                      type="date"
                      value={filters.maxUpdateAt}
                      onChange={(e) =>
                        setFilters((prev) => ({
                          ...prev,
                          maxUpdateAt: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>
              </div>
            </ListFiltersSheet>
          </>
        }
        columns={columns}
        data={purchaseOrders}
        pagination={pagination}
        onPageChange={handlePageChange}
        onPerPageChange={setPerPage}
        onCreate={handleCreate}
      />
    </div>
  );
}

export default function PurchaseOrdersPageWrapper() {
  return (
    <SuppliersProvider>
      <PurchaseOrdersProvider>
        <PurchaseOrders />
      </PurchaseOrdersProvider>
    </SuppliersProvider>
  );
}
