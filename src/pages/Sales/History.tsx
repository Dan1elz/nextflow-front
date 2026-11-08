import { useCallback, useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Search } from "lucide-react";

import { DatePicker } from "@/components/app/date-picker";
import { EntityIndexPage } from "@/components/app/entity-index-page";
import { ListFiltersSheet } from "@/components/app/list-filters-sheet";
import { OrderStatusBadge } from "@/components/app/order-status-badge";
import { SaleDetailDialog } from "@/components/app/sale-detail-dialog";
import { SearchSelect } from "@/components/app/search-select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { useCurrentStore } from "@/hooks/use-current-store";
import { useIndexSearch } from "@/hooks/use-index-search";
import { useSalesHistory } from "@/hooks/use-sales-history";
import type { IOption } from "@/interfaces/api.interface";
import type {
  OrderDetailDto,
  OrderListItemDto,
} from "@/interfaces/quick-sale.interface";
import { SalesHistoryProvider } from "@/providers/sales-history.provider";
import {
  ORDER_STATUS_LABELS,
  PAYMENT_METHOD_LABELS,
  TOrderChannel,
  TOrderStatus,
  TPaymentMethod,
} from "@/types/enums";
import { formatCurrency, formatDateTime } from "@/utils/format.helpers";
import { handleError } from "@/utils/toast.helpers";

type SalesHistoryFilters = {
  search: string;
  status: string;
  paymentMethod: string;
  from: string;
  to: string;
  channel: string;
  clientId: string;
  userId: string;
  productId: string;
  minTotal: string;
  maxTotal: string;
};

const statusOptions: IOption[] = Object.values(TOrderStatus).map((status) => ({
  value: status,
  label: ORDER_STATUS_LABELS[status],
}));

const paymentOptions: IOption[] = Object.values(TPaymentMethod).map(
  (method) => ({ value: method, label: PAYMENT_METHOD_LABELS[method] })
);

/** Lista inicial vazia e estável: as opções dos selects de busca vêm do servidor. */
const NO_OPTIONS: IOption[] = [];

const paymentLabels = (methods: TPaymentMethod[]) =>
  methods.length > 0
    ? methods.map((method) => PAYMENT_METHOD_LABELS[method]).join(", ")
    : "-";

/** Histórico das vendas de balcão da loja selecionada no topo, com o detalhe da venda num diálogo. */
function SalesHistory() {
  const {
    sales,
    pagination,
    searchSales,
    getSale,
    searchClientOptions,
    searchUserOptions,
    searchProductOptions,
  } = useSalesHistory();
  const { storeId } = useCurrentStore();
  const [detail, setDetail] = useState<OrderDetailDto | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
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
  } = useIndexSearch<SalesHistoryFilters, "search">({
    search: searchSales,
    initialFilters: {
      search: "",
      status: "",
      paymentMethod: "",
      from: "",
      to: "",
      channel: TOrderChannel.Counter,
      clientId: "",
      userId: "",
      productId: "",
      minTotal: "",
      maxTotal: "",
    },
    quickSearchKey: "search",
    perPageInitial: 10,
    debounceMs: 400,
    onError: (error) => handleError(error, "Erro ao buscar vendas"),
    refreshKey: storeId,
  });

  const openDetail = useCallback(
    async (sale: OrderListItemDto) => {
      setLoadingId(sale.id);
      try {
        setDetail(await getSale(sale.id));
      } catch (error) {
        handleError(error, "Erro ao carregar a venda");
      } finally {
        setLoadingId(null);
      }
    },
    [getSale]
  );

  const setFilter = (key: keyof SalesHistoryFilters, value: string) =>
    setFilters((prev) => ({ ...prev, [key]: value }));

  const columns = useMemo<ColumnDef<OrderListItemDto>[]>(
    () => [
      {
        accessorKey: "number",
        header: "Nº",
        // O número abre o detalhe da venda.
        cell: ({ row }) => (
          <Button
            variant="link"
            className="h-auto gap-1.5 p-0 font-medium"
            disabled={loadingId != null}
            onClick={() => openDetail(row.original)}
            aria-label={`Visualizar a venda nº ${row.original.number}`}
          >
            {row.original.number}
            {loadingId === row.original.id && <Spinner />}
          </Button>
        ),
      },
      {
        accessorKey: "createdAt",
        header: "Data",
        cell: ({ row }) => formatDateTime(row.original.createdAt),
      },
      {
        accessorKey: "clientName",
        header: "Cliente",
        cell: ({ row }) => row.original.clientName ?? "Consumidor final",
      },
      // Em "Todas as lojas" a loja de cada venda precisa aparecer.
      ...(storeId
        ? []
        : [{ accessorKey: "storeName", header: "Loja" } as const]),
      { accessorKey: "itemCount", header: "Itens" },
      {
        accessorKey: "total",
        header: "Total",
        cell: ({ row }) => formatCurrency(row.original.total),
      },
      {
        accessorKey: "paymentMethods",
        header: "Pagamento",
        cell: ({ row }) => paymentLabels(row.original.paymentMethods),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => <OrderStatusBadge status={row.original.status} />,
      },
      { accessorKey: "userName", header: "Vendedor" },
    ],
    [loadingId, openDetail, storeId]
  );

  return (
    <>
      <EntityIndexPage
        title="Histórico de vendas"
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
                onChange={(e) => setFilter("search", e.target.value)}
                placeholder="Pesquisar por nº ou cliente..."
                aria-label="Pesquisar venda"
              />
            </InputGroup>

            <ListFiltersSheet
              open={isFiltersOpen}
              onOpenChange={handleFiltersOpenChange}
              description="Filtre o histórico de vendas."
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
                <Label>De</Label>
                <DatePicker
                  value={filters.from}
                  onChange={(value) => setFilter("from", value)}
                  placeholder="Início do período"
                />
              </div>
              <div className="grid gap-2">
                <Label>Até</Label>
                <DatePicker
                  value={filters.to}
                  onChange={(value) => setFilter("to", value)}
                  placeholder="Fim do período"
                />
              </div>
              <SearchSelect<IOption>
                field={{
                  value: filters.clientId,
                  onChange: (value) =>
                    setFilter("clientId", value ? String(value) : ""),
                }}
                label="Cliente"
                data={NO_OPTIONS}
                onSearch={searchClientOptions}
                placeholder="Todos"
              />
              <SearchSelect<IOption>
                field={{
                  value: filters.userId,
                  onChange: (value) =>
                    setFilter("userId", value ? String(value) : ""),
                }}
                label="Vendedor"
                data={NO_OPTIONS}
                onSearch={searchUserOptions}
                placeholder="Todos"
              />
              <SearchSelect<IOption>
                field={{
                  value: filters.productId,
                  onChange: (value) =>
                    setFilter("productId", value ? String(value) : ""),
                }}
                label="Produto vendido"
                data={NO_OPTIONS}
                onSearch={searchProductOptions}
                placeholder="Todos"
              />
              <div className="grid grid-cols-2 gap-2">
                <div className="grid gap-2">
                  <Label htmlFor="sales-min-total">Valor mínimo</Label>
                  <Input
                    id="sales-min-total"
                    type="number"
                    min={0}
                    step="0.01"
                    inputMode="decimal"
                    placeholder="R$ 0,00"
                    value={filters.minTotal}
                    onChange={(e) => setFilter("minTotal", e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="sales-max-total">Valor máximo</Label>
                  <Input
                    id="sales-max-total"
                    type="number"
                    min={0}
                    step="0.01"
                    inputMode="decimal"
                    placeholder="Sem limite"
                    value={filters.maxTotal}
                    onChange={(e) => setFilter("maxTotal", e.target.value)}
                  />
                </div>
              </div>
              <SearchSelect<IOption>
                field={{
                  value: filters.paymentMethod,
                  onChange: (value) =>
                    setFilter("paymentMethod", value ? String(value) : ""),
                }}
                label="Forma de pagamento"
                data={paymentOptions}
                placeholder="Todas"
              />
              <SearchSelect<IOption>
                field={{
                  value: filters.status,
                  onChange: (value) =>
                    setFilter("status", value ? String(value) : ""),
                }}
                label="Status"
                data={statusOptions}
                placeholder="Todos"
              />
            </ListFiltersSheet>
          </>
        }
        columns={columns}
        data={sales}
        pagination={pagination}
        onPageChange={handlePageChange}
        onPerPageChange={setPerPage}
      />

      <SaleDetailDialog sale={detail} onClose={() => setDetail(null)} />
    </>
  );
}

export default function SalesHistoryPageWrapper() {
  return (
    <SalesHistoryProvider>
      <SalesHistory />
    </SalesHistoryProvider>
  );
}
