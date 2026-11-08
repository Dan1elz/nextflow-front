import { useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import type { ColumnDef } from "@tanstack/react-table";
import { Search } from "lucide-react";

import { EntityIndexPage } from "@/components/app/entity-index-page";
import { ListFiltersSheet } from "@/components/app/list-filters-sheet";
import { NavActionColumn } from "@/components/app/nav-action-column";
import { PurchaseStatusBadge } from "@/components/app/purchase-status-badge";
import { SearchSelect } from "@/components/app/search-select";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { useCurrentStore } from "@/hooks/use-current-store";
import { useIndexSearch } from "@/hooks/use-index-search";
import { usePurchaseOrders } from "@/hooks/use-purchase-orders";
import type { IOption } from "@/interfaces/api.interface";
import type { PurchaseOrderListItemDto } from "@/interfaces/purchase-order.interface";
import { PurchaseOrdersProvider } from "@/providers/purchase-orders.provider";
import { PURCHASE_STATUS_LABELS, TPurchaseStatus } from "@/types/enums";
import {
  formatCurrency,
  formatDateOnly,
  formatDateTime,
} from "@/utils/format.helpers";
import { handleError, handleSuccess } from "@/utils/toast.helpers";

type PurchaseOrderFilters = {
  search: string;
  status: string;
  onlyLate: string;
};

const statusOptions: IOption[] = Object.values(TPurchaseStatus).map(
  (status) => ({
    value: status,
    label: PURCHASE_STATUS_LABELS[status],
  })
);

const lateOptions: IOption[] = [{ value: "true", label: "Só atrasados" }];

const isOpen = (order: PurchaseOrderListItemDto) =>
  order.status === TPurchaseStatus.Budget ||
  order.status === TPurchaseStatus.Pending;

/** Pedidos de compra da loja selecionada no topo (T-CP1). */
function PurchaseOrders() {
  const navigate = useNavigate();
  const {
    purchaseOrders,
    pagination,
    searchPurchaseOrders,
    getPurchaseOrder,
    cancelPurchaseOrder,
  } = usePurchaseOrders();
  const { storeId } = useCurrentStore();
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
    search: searchPurchaseOrders,
    initialFilters: { search: "", status: "", onlyLate: "" },
    quickSearchKey: "search",
    perPageInitial: 10,
    debounceMs: 400,
    onError: (error) => handleError(error, "Erro ao buscar pedidos de compra"),
    refreshKey: storeId,
  });

  const handleCancel = useCallback(
    async (order: PurchaseOrderListItemDto, reason?: string) => {
      try {
        // A listagem não traz a versão: lê o pedido antes de cancelar (409 se mudou no meio).
        const current = await getPurchaseOrder(order.id);
        await cancelPurchaseOrder(order.id, current.version, reason ?? "");
        handleSuccess(`Pedido nº ${order.number} cancelado`);
        await handleSearch(1);
      } catch (error) {
        handleError(error, "Erro ao cancelar pedido de compra");
      }
    },
    [cancelPurchaseOrder, getPurchaseOrder, handleSearch]
  );

  const columns = useMemo<ColumnDef<PurchaseOrderListItemDto>[]>(
    () => [
      { accessorKey: "number", header: "Nº" },
      { accessorKey: "supplierName", header: "Fornecedor" },
      {
        accessorKey: "receiveLocationName",
        header: "Entrega",
        cell: ({ row }) =>
          `${row.original.storeName} › ${row.original.receiveLocationName}`,
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <PurchaseStatusBadge
            status={row.original.status}
            isLate={row.original.isLate}
          />
        ),
      },
      { accessorKey: "itemCount", header: "Itens" },
      {
        accessorKey: "total",
        header: "Total",
        cell: ({ row }) => formatCurrency(row.original.total),
      },
      {
        accessorKey: "createdAt",
        header: "Criado em",
        cell: ({ row }) => formatDateTime(row.original.createdAt),
      },
      {
        accessorKey: "expectedOn",
        header: "Previsão",
        cell: ({ row }) =>
          row.original.expectedOn
            ? formatDateOnly(row.original.expectedOn)
            : "-",
      },
      {
        accessorKey: "receivedAt",
        header: "Recebido",
        cell: ({ row }) =>
          row.original.receivedAt
            ? `${formatDateTime(row.original.receivedAt)} (${row.original.realLeadTimeDays ?? 0} dia(s))`
            : "-",
      },
      {
        id: "actions",
        header: "Ações",
        cell: ({ row }) => (
          <NavActionColumn
            object={row.original}
            onView={(order) => navigate(`/purchase-orders/${order.id}/view`)}
            onEdit={(order) => navigate(`/purchase-orders/${order.id}/edit`)}
            onDelete={handleCancel}
            disableEdit={!isOpen(row.original)}
            disableDelete={!isOpen(row.original)}
            deleteRequiresReason
            deleteReasonLabel="Motivo do cancelamento:"
            deleteLabel="Cancelar"
            deleteDialogTitle={`Cancelar o pedido nº ${row.original.number}?`}
            deleteDialogDescription="O pedido deixa de contar como estoque a caminho e não volta a ser editado."
            deleteButtonLabel="Cancelar pedido"
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
    ],
    [handleCancel, navigate]
  );

  return (
    <EntityIndexPage
      title="Pedidos de compra"
      onRowOpen={(order) => navigate(`/purchase-orders/${order.id}/view`)}
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
              placeholder="Pesquisar por nº ou fornecedor..."
              aria-label="Pesquisar pedido de compra"
            />
          </InputGroup>

          <ListFiltersSheet
            open={isFiltersOpen}
            onOpenChange={handleFiltersOpenChange}
            description="Filtre a listagem de pedidos de compra."
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
                value: filters.status,
                onChange: (value) =>
                  setFilters((prev) => ({
                    ...prev,
                    status: value ? String(value) : "",
                  })),
              }}
              label="Status"
              data={statusOptions}
              placeholder="Todos"
            />
            <SearchSelect<IOption>
              field={{
                value: filters.onlyLate,
                onChange: (value) =>
                  setFilters((prev) => ({
                    ...prev,
                    onlyLate: value ? String(value) : "",
                  })),
              }}
              label="Atraso"
              data={lateOptions}
              placeholder="Todos"
            />
          </ListFiltersSheet>
        </>
      }
      columns={columns}
      data={purchaseOrders}
      pagination={pagination}
      onPageChange={handlePageChange}
      onPerPageChange={setPerPage}
      onCreate={() => navigate("/purchase-orders/create")}
    />
  );
}

export default function PurchaseOrdersPageWrapper() {
  return (
    <PurchaseOrdersProvider>
      <PurchaseOrders />
    </PurchaseOrdersProvider>
  );
}
