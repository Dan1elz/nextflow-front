import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { ColumnDef } from "@tanstack/react-table";
import { PackageCheck, Search } from "lucide-react";

import { DatePicker } from "@/components/app/date-picker";
import { EntityIndexPage } from "@/components/app/entity-index-page";
import { ListFiltersSheet } from "@/components/app/list-filters-sheet";
import { MultiSelectFilter } from "@/components/app/multi-select-filter";
import { NavActionColumn } from "@/components/app/nav-action-column";
import { PurchaseStatusBadge } from "@/components/app/purchase-status-badge";
import {
  ReceivePurchaseOrderDialog,
  type ReceiveLots,
} from "@/components/app/receive-purchase-order-dialog";
import { SearchSelect } from "@/components/app/search-select";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useCurrentStore } from "@/hooks/use-current-store";
import { useIndexSearch } from "@/hooks/use-index-search";
import { usePurchaseOrders } from "@/hooks/use-purchase-orders";
import type { IOption, Option } from "@/interfaces/api.interface";
import type {
  PurchaseOrderDetailDto,
  PurchaseOrderListItemDto,
} from "@/interfaces/purchase-order.interface";
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
  /** Status separados por vírgula ("Budget,Pending"): a API filtra por qualquer um deles. */
  status: string;
  onlyLate: string;
  supplierId: string;
  from: string;
  to: string;
};

const statusOptions: Option[] = Object.values(TPurchaseStatus).map(
  (status) => ({
    value: status,
    label: PURCHASE_STATUS_LABELS[status],
  })
);

/** A tela abre no que ainda pede ação: orçamento a enviar e pendente a receber. */
const OPEN_STATUSES = [TPurchaseStatus.Budget, TPurchaseStatus.Pending].join(
  ","
);

const INITIAL_FILTERS: PurchaseOrderFilters = {
  search: "",
  status: OPEN_STATUSES,
  onlyLate: "",
  supplierId: "",
  from: "",
  to: "",
};

/** Lista inicial vazia e estável: as opções do fornecedor vêm do servidor. */
const NO_OPTIONS: IOption[] = [];

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
    receivePurchaseOrder,
    searchSupplierOptions,
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
    initialFilters: INITIAL_FILTERS,
    quickSearchKey: "search",
    perPageInitial: 10,
    debounceMs: 400,
    onError: (error) => handleError(error, "Erro ao buscar pedidos de compra"),
    refreshKey: storeId,
  });

  const [receiving, setReceiving] = useState<PurchaseOrderDetailDto | null>(
    null
  );

  // O status fica na barra e aplica na hora (os demais filtros esperam o "Aplicar" do painel).
  const lastStatusRef = useRef(filters.status);
  useEffect(() => {
    if (lastStatusRef.current === filters.status) return;
    lastStatusRef.current = filters.status;
    handleSearch(1);
  }, [filters.status, handleSearch]);

  // O SearchSelect trabalha com IOption (aceita campos extras); o combo de fornecedor devolve Option.
  const searchSuppliers = useCallback(
    async (term: string): Promise<IOption[]> =>
      (await searchSupplierOptions(term)).map(({ value, label }) => ({
        value,
        label,
      })),
    [searchSupplierOptions]
  );

  const openReceive = useCallback(
    async (order: PurchaseOrderListItemDto) => {
      try {
        // O recebimento precisa dos itens (lotes) e da versão: a listagem não traz nenhum dos dois.
        setReceiving(await getPurchaseOrder(order.id));
      } catch (error) {
        handleError(error, "Erro ao carregar o pedido de compra");
      }
    },
    [getPurchaseOrder]
  );

  const handleReceive = async (lots: ReceiveLots) => {
    if (!receiving) return;
    try {
      await receivePurchaseOrder(receiving.id, {
        version: receiving.version,
        items: receiving.items.map((item) => ({
          itemId: item.id,
          lots: lots[item.id] ?? null,
        })),
      });
      handleSuccess(
        `Pedido nº ${receiving.number} recebido e estoque atualizado`
      );
      setReceiving(null);
      await handleSearch(1);
    } catch (error) {
      handleError(error, "Erro ao receber o pedido");
      throw error;
    }
  };

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
            extraActions={[
              {
                label: "Receber",
                icon: <PackageCheck className="mr-2 size-4" />,
                onClick: openReceive,
                disabled: row.original.status !== TPurchaseStatus.Pending,
              },
            ]}
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
    ],
    [handleCancel, navigate, openReceive]
  );

  const setFilter = (key: keyof PurchaseOrderFilters, value: string) =>
    setFilters((prev) => ({ ...prev, [key]: value }));

  return (
    <>
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

            <MultiSelectFilter
              label="Status"
              options={statusOptions}
              value={filters.status ? filters.status.split(",") : []}
              onChange={(value) => setFilter("status", value.join(","))}
              className="w-full md:w-auto"
            />

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
                  value: filters.supplierId,
                  onChange: (value) =>
                    setFilter("supplierId", value ? String(value) : ""),
                }}
                label="Fornecedor"
                data={NO_OPTIONS}
                onSearch={searchSuppliers}
                placeholder="Todos"
              />
              <div className="grid gap-2">
                <Label>Criado de</Label>
                <DatePicker
                  value={filters.from}
                  onChange={(value) => setFilter("from", value)}
                  placeholder="Início do período"
                />
              </div>
              <div className="grid gap-2">
                <Label>Criado até</Label>
                <DatePicker
                  value={filters.to}
                  onChange={(value) => setFilter("to", value)}
                  placeholder="Fim do período"
                />
              </div>
              <div className="flex items-center justify-between gap-4 rounded-xl border p-3">
                <div className="grid gap-0.5">
                  <Label htmlFor="purchase-only-late">Só atrasados</Label>
                  <span className="text-xs text-muted-foreground">
                    Pendentes com a previsão de chegada vencida
                  </span>
                </div>
                <Switch
                  id="purchase-only-late"
                  checked={filters.onlyLate === "true"}
                  onCheckedChange={(checked) =>
                    setFilter("onlyLate", checked ? "true" : "")
                  }
                />
              </div>
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

      {receiving && (
        <ReceivePurchaseOrderDialog
          key={receiving.id}
          open
          order={receiving}
          onOpenChange={(open) => !open && setReceiving(null)}
          onConfirm={handleReceive}
        />
      )}
    </>
  );
}

export default function PurchaseOrdersPageWrapper() {
  return (
    <PurchaseOrdersProvider>
      <PurchaseOrders />
    </PurchaseOrdersProvider>
  );
}
