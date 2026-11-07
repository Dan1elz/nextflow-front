import { useCallback, useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Search } from "lucide-react";

import { DatePicker } from "@/components/app/date-picker";
import { EntityIndexPage } from "@/components/app/entity-index-page";
import { ListFiltersSheet } from "@/components/app/list-filters-sheet";
import { NavActionColumn } from "@/components/app/nav-action-column";
import { OrderStatusBadge } from "@/components/app/order-status-badge";
import { SearchSelect } from "@/components/app/search-select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import {
  formatCurrency,
  formatDateTime,
  formatNumber,
} from "@/utils/format.helpers";
import { handleError } from "@/utils/toast.helpers";

type SalesHistoryFilters = {
  search: string;
  status: string;
  paymentMethod: string;
  from: string;
  to: string;
  channel: string;
};

const statusOptions: IOption[] = Object.values(TOrderStatus).map((status) => ({
  value: status,
  label: ORDER_STATUS_LABELS[status],
}));

const paymentOptions: IOption[] = Object.values(TPaymentMethod).map(
  (method) => ({ value: method, label: PAYMENT_METHOD_LABELS[method] })
);

const paymentLabels = (methods: TPaymentMethod[]) =>
  methods.length > 0
    ? methods.map((method) => PAYMENT_METHOD_LABELS[method]).join(", ")
    : "-";

/** Histórico das vendas de balcão da loja selecionada no topo, com o detalhe da venda num diálogo. */
function SalesHistory() {
  const { sales, pagination, searchSales, getSale } = useSalesHistory();
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
    },
    quickSearchKey: "search",
    perPageInitial: 10,
    debounceMs: 400,
    onError: (error) => handleError(error, "Erro ao buscar vendas"),
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
      { accessorKey: "number", header: "Nº" },
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
      {
        id: "actions",
        header: "Ações",
        cell: ({ row }) =>
          loadingId === row.original.id ? (
            <Spinner />
          ) : (
            <NavActionColumn object={row.original} onView={openDetail} />
          ),
        enableSorting: false,
        enableHiding: false,
      },
    ],
    [loadingId, openDetail]
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

function SummaryLine({
  label,
  value,
  className,
}: {
  label: string;
  value: number;
  className?: string;
}) {
  return (
    <div className={`flex justify-between ${className ?? ""}`}>
      <span>{label}</span>
      <span>{formatCurrency(value)}</span>
    </div>
  );
}

/** Detalhe da venda (T-VD5): itens, pagamentos e totais como a API gravou. */
function SaleDetailDialog({
  sale,
  onClose,
}: {
  sale: OrderDetailDto | null;
  onClose: () => void;
}) {
  return (
    <Dialog open={sale != null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        {sale && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                Venda nº {sale.number}
                <OrderStatusBadge status={sale.status} />
              </DialogTitle>
              <DialogDescription>
                {formatDateTime(sale.paidAt ?? sale.createdAt)}
                {sale.store ? ` · ${sale.store.name}` : ""}
                {sale.saleLocation ? ` › ${sale.saleLocation.name}` : ""}
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-1 text-sm sm:grid-cols-2">
              <span>
                <span className="text-muted-foreground">Cliente: </span>
                {sale.client
                  ? `${sale.client.name}${sale.client.cpf ? ` (${sale.client.cpf})` : ""}`
                  : "Consumidor final"}
              </span>
              <span>
                <span className="text-muted-foreground">Vendedor: </span>
                {sale.user?.name ?? "-"}
              </span>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead className="text-right">Qtd.</TableHead>
                  <TableHead className="text-right">Preço</TableHead>
                  <TableHead className="text-right">Desconto</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sale.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="font-medium">
                        {item.productName}
                        {item.variantLabel ? ` · ${item.variantLabel}` : ""}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {item.sku}
                        {item.promotion
                          ? ` · promoção ${formatNumber(item.promotion.discountPercent)}%`
                          : ""}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {formatNumber(item.quantity, item.decimalPlaces)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(item.unitPrice)}
                    </TableCell>
                    <TableCell className="text-right">
                      {item.discount > 0 ? formatCurrency(item.discount) : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(item.lineTotal)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <Separator />

            <div className="grid gap-4 text-sm sm:grid-cols-2">
              <div className="grid content-start gap-1">
                <span className="font-medium">Pagamentos</span>
                {sale.payments.map((payment) => (
                  <SummaryLine
                    key={payment.id}
                    label={PAYMENT_METHOD_LABELS[payment.method]}
                    value={payment.amount}
                  />
                ))}
                {sale.cashReceived != null && (
                  <SummaryLine
                    label="Recebido em dinheiro"
                    value={sale.cashReceived}
                    className="text-muted-foreground"
                  />
                )}
                {sale.change != null && sale.change > 0 && (
                  <SummaryLine
                    label="Troco"
                    value={sale.change}
                    className="text-muted-foreground"
                  />
                )}
              </div>
              <div className="grid content-start gap-1">
                <SummaryLine label="Subtotal" value={sale.subtotal} />
                <SummaryLine label="Descontos" value={sale.discountTotal} />
                <SummaryLine
                  label="Total"
                  value={sale.total}
                  className="text-base font-semibold"
                />
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default function SalesHistoryPageWrapper() {
  return (
    <SalesHistoryProvider>
      <SalesHistory />
    </SalesHistoryProvider>
  );
}
