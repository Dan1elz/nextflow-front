import { useMemo, useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { ColumnDef } from "@tanstack/react-table";
import { Search, Banknote } from "lucide-react";

import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SaleCheckoutDrawer } from "@/components/app/sale-checkout-drawer";
import { EntityIndexPage } from "@/components/app/entity-index-page";
import { ListFiltersSheet } from "@/components/app/list-filters-sheet";
import { NavActionColumn } from "@/components/app/nav-action-column";
import { SearchSelect } from "@/components/app/search-select";

import { handleError, handleSuccess } from "@/utils/toast.helpers";
import { formatDateTime, formatCurrency } from "@/utils";
import { useOrders } from "@/hooks/use-orders";
import { useIndexSearch } from "@/hooks/use-index-search";
import { useSearchOptions } from "@/hooks/use-search-options";

import type { IOrder } from "@/interfaces/order.interface";
import type { IClient } from "@/interfaces/client.interface";
import type { IUser } from "@/interfaces/user.interface";

import { OrdersProvider } from "@/providers/orders.provider";
import { ClientsProvider } from "@/providers/clients.provider";
import { UsersProvider } from "@/providers/users.provider";
import { SalesProvider } from "@/providers/sales.provider";

import { useClients } from "@/hooks/use-clients";
import { useUsers } from "@/hooks/use-users";
import { Badge } from "@/components/ui/badge";
import type { IOption } from "@/interfaces/api.interface";
import {
  ORDER_STATUS_LABELS,
  ORDER_TYPE_LABELS,
  TOrderStatus,
  PAYMENT_METHOD_LABELS,
  TPaymentMethod,
} from "@/types/enums";

type OrderFilters = {
  search: string;
  statusGroup: string;
  clientId: string;
  userId: string;
  minAmount: string;
  maxAmount: string;
  minUpdateAt: string;
  maxUpdateAt: string;
};

import { useAuth } from "@/hooks/use-auth";

function Orders() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const { orders, pagination, searchOrders, cancelOrder, refundOrder } = useOrders();
  const { searchClientsForOptions, getClientById } = useClients();
  const { searchUsersForOptions, getUserById } = useUsers();

  const [orderToFinalize, setOrderToFinalize] = useState<IOrder | null>(null);
  const [showCheckoutDrawer, setShowCheckoutDrawer] = useState(false);
  const [saleViewerData, setSaleViewerData] = useState<
    import("@/interfaces/sale.interface").ISale | null
  >(null);

  const customSearch = useCallback(
    async (params?: import("@/interfaces/api.interface").IIndexParams) => {
      const activeFilters = { ...params?.filters } as Record<string, string>;
      if (activeFilters.statusGroup === "all") {
        delete activeFilters.statusGroup;
      }
      await searchOrders({ ...params, filters: activeFilters });
    },
    [searchOrders]
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
  } = useIndexSearch<OrderFilters, "search">({
    search: customSearch,
    initialFilters: {
      search: "",
      statusGroup: "open", // Padrão "Em aberto"
      clientId: "",
      userId: "",
      minAmount: "",
      maxAmount: "",
      minUpdateAt: "",
      maxUpdateAt: "",
    },
    quickSearchKey: "search",
    perPageInitial: 10,
    debounceMs: 400,
    onError: (error) => {
      handleError(error, "Erro ao buscar pedidos");
    },
  });

  const { options: clientOptions, handleSearch: handleSearchClients } =
    useSearchOptions<IClient>({
      searchFn: searchClientsForOptions,
      mapFn: (client) => ({
        value: client.id ?? "",
        label: `${client.name} ${client.lastName}`,
      }),
      selectFn: getClientById,
      errorLabel: "clientes",
      autoLoad: false,
      perPage: 50,
    });

  const { options: userOptions, handleSearch: handleSearchUsers } =
    useSearchOptions<IUser>({
      searchFn: searchUsersForOptions,
      mapFn: (user) => ({
        value: user.id ?? "",
        label: `${user.name} ${user.lastName}`,
      }),
      selectFn: getUserById,
      errorLabel: "usuários",
      autoLoad: false,
      perPage: 50,
    });

  const handleCreate = () => navigate("/orders/create");

  const handleEdit = useCallback(
    (order: IOrder) => navigate(`/orders/${order.id}/edit`),
    [navigate]
  );

  const handleView = useCallback(
    (order: IOrder) => navigate(`/orders/${order.id}/view`),
    [navigate]
  );

  const handleDelete = useCallback(
    async (order: IOrder, reason?: string) => {
      if (!order.id) return;
      try {
        if (!reason) {
          handleError(new Error("Motivo obrigatório."), "");
          return;
        }
        const status = order.status as number;
        if (status === TOrderStatus.PaymentConfirmed) {
          await refundOrder(order.id, reason);
          handleSuccess("Pedido reembolsado com sucesso");
        } else {
          await cancelOrder(order.id, reason);
          handleSuccess("Pedido cancelado com sucesso");
        }
        await handleSearch(1);
      } catch (error) {
        handleError(error, "Erro ao processar pedido");
      }
    },
    [cancelOrder, refundOrder, handleSearch]
  );

  const columns = useMemo<ColumnDef<IOrder>[]>(
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
        id: "client",
        header: "Cliente",
        cell: ({ row }) =>
          row.original.client
            ? `${row.original.client.name} ${row.original.client.lastName}`
            : "-",
      },
      {
        id: "user",
        header: "Vendedor",
        cell: ({ row }) =>
          row.original.user
            ? `${row.original.user.name} ${row.original.user.lastName}`
            : "-",
      },
      {
        accessorKey: "type",
        header: "Tipo",
        cell: ({ row }) => {
          const label =
            ORDER_TYPE_LABELS[row.original.type] ?? row.original.type;
          return <Badge variant="outline">{label}</Badge>;
        },
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
          if (!row.original.status) return "-";
          const label =
            ORDER_STATUS_LABELS[row.original.status] ?? row.original.status;

          let variant: "default" | "secondary" | "destructive" | "outline" =
            "secondary";
          if (row.original.status === TOrderStatus.PaymentConfirmed)
            variant = "default";
          else if (
            row.original.status === TOrderStatus.Canceled ||
            row.original.status === TOrderStatus.Refunded
          )
            variant = "destructive";
          else if (row.original.status === TOrderStatus.PendingPayment)
            variant = "outline";

          return <Badge variant={variant}>{label}</Badge>;
        },
      },
      {
        accessorKey: "totalAmount",
        header: "Valor Total",
        cell: ({ row }) =>
          formatCurrency(Number(row.original.totalAmount || 0)),
      },
      {
        accessorKey: "updateAt",
        header: "Modificado",
        cell: ({ row }) =>
          row.original.updateAt ? formatDateTime(row.original.updateAt) : "-",
      },
      {
        id: "actions",
        header: "Ações",
        cell: ({ row }) => {
          const status = row.original.status as number;
          const isCanceled = status === TOrderStatus.Canceled;
          const isRefunded = status === TOrderStatus.Refunded;
          const isConfirmed = status === TOrderStatus.PaymentConfirmed;
          const canAct = !isCanceled && !isRefunded;
          const canFinalizeCheckout =
            status === TOrderStatus.PendingPayment ||
            status === TOrderStatus.Budget;

          const deleteLabel = isConfirmed ? "Reembolsar" : "Cancelar";
          const dialogTitle = isConfirmed
            ? "Reembolsar Pedido"
            : "Cancelar Pedido";
          const dialogDesc = isConfirmed
            ? "Esta ação reembolsará o pedido e retornará os itens ao estoque. O reembolso só é permitido até 7 dias após o pagamento."
            : "Esta ação cancelará o pedido. Itens de vendas serão retornados ao estoque.";
          const buttonLabel = isConfirmed
            ? "Confirmar Reembolso"
            : "Confirmar Cancelamento";
          const reasonOptions = isConfirmed
            ? [
                "Produto com defeito",
                "Produto divergente do anunciado",
                "Insatisfação do cliente",
                "Entrega com atraso",
                "Cobrança indevida",
              ]
            : [
                "Cliente desistiu da compra",
                "Produto indisponível",
                "Erro no pedido",
                "Pedido duplicado",
                "Prazo de entrega não atendido",
              ];

          const extraActions = [];
          if (canFinalizeCheckout) {
            extraActions.push({
              label: "Finalizar Venda",
              icon: <Banknote className="mr-2 h-4 w-4" />,
              onClick: (obj: IOrder) => {
                setOrderToFinalize(obj);
                setShowCheckoutDrawer(true);
              },
            });
          }
          if (isConfirmed) {
            extraActions.push({
              label: "Ver Pagamentos",
              icon: <Banknote className="mr-2 h-4 w-4" />,
              onClick: (obj: IOrder) => {
                import("@/services/sale.service").then(({ saleService }) => {
                    saleService.getAll({ filters: { orderId: obj.id! }, perPage: 1 }, token || undefined).then(res => {
                        if (res?.data && res.data.length > 0) {
                        setSaleViewerData(res.data[0]);
                      } else {
                        handleError(
                          new Error(
                            "Nenhum pagamento encontrado para este pedido"
                          ),
                          ""
                        );
                      }
                    })
                    .catch((err) =>
                      handleError(err, "Erro ao buscar pagamentos")
                    );
                });
              },
            });
          }

          return (
            <NavActionColumn
              object={row.original}
              onEdit={handleEdit}
              onDelete={canAct ? handleDelete : undefined}
              onView={handleView}
              disableEdit={!canAct}
              deleteRequiresReason={true}
              deleteReasonLabel="Informe o motivo:"
              deleteLabel={deleteLabel}
              deleteDialogTitle={dialogTitle}
              deleteDialogDescription={dialogDesc}
              deleteButtonLabel={buttonLabel}
              deleteReasonOptions={reasonOptions}
              extraActions={extraActions}
            />
          );
        },
        enableSorting: false,
        enableHiding: false,
      },
    ],
    [handleDelete, handleEdit, handleView]
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
            <TabsTrigger value="open">Em Aberto</TabsTrigger>
            <TabsTrigger value="completed">Concluídos</TabsTrigger>
            <TabsTrigger value="budget">Orçamentos</TabsTrigger>
            <TabsTrigger value="expired">Expirados</TabsTrigger>
            <TabsTrigger value="canceled">Cancelados</TabsTrigger>
            <TabsTrigger value="refunded">Reembolsados</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <EntityIndexPage
        title="Gerenciar Pedidos"
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
                placeholder="Buscar (IDs, referências...)"
                aria-label="Pesquisar"
              />
            </InputGroup>

            <ListFiltersSheet
              open={isFiltersOpen}
              onOpenChange={handleFiltersOpenChange}
              description="Filtre os pedidos."
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
                      value: filters.clientId,
                      onChange: (value) =>
                        setFilters((prev) => ({
                          ...prev,
                          clientId: value ? String(value) : "",
                        })),
                    }}
                    data={clientOptions}
                    onSearch={handleSearchClients}
                    placeholder="Selecione um cliente..."
                    label="Cliente"
                  />
                </div>

                <div className="grid gap-2">
                  <SearchSelect<IOption>
                    field={{
                      value: filters.userId,
                      onChange: (value) =>
                        setFilters((prev) => ({
                          ...prev,
                          userId: value ? String(value) : "",
                        })),
                    }}
                    data={userOptions}
                    onSearch={handleSearchUsers}
                    placeholder="Selecione um vendedor..."
                    label="Vendedor (Usuário)"
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
        data={orders}
        pagination={pagination}
        onPageChange={handlePageChange}
        onPerPageChange={setPerPage}
        onCreate={handleCreate}
      />

      {orderToFinalize && (
        <SaleCheckoutDrawer
          open={showCheckoutDrawer}
          onOpenChange={setShowCheckoutDrawer}
          order={orderToFinalize}
          onSuccess={() => {
            handleSuccess("Venda confirmada!");
            handleSearch(1);
          }}
        />
      )}
      {/* Sale Viewer Modal */}
      <Dialog
        open={!!saleViewerData}
        onOpenChange={(open) => !open && setSaleViewerData(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pagamentos deste Pedido</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3 py-4">
            {saleViewerData?.payments?.map(
              (p: import("@/interfaces/sale.interface").IPayment) => (
                <div
                  key={p.id}
                  className="flex justify-between items-center bg-muted/30 border p-3 rounded-lg"
                >
                  <span className="font-semibold">
                    {PAYMENT_METHOD_LABELS[p.paymentMethod as TPaymentMethod] ??
                      p.paymentMethod}
                  </span>
                  <span className="font-bold text-primary">
                    {formatCurrency(p.amount)}
                  </span>
                </div>
              )
            )}
            {!saleViewerData?.payments ||
            saleViewerData.payments.length === 0 ? (
              <span className="text-sm text-muted-foreground text-center py-4">
                Nenhum pagamento encontrado.
              </span>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function OrdersPageWrapper() {
  return (
    <ClientsProvider>
      <UsersProvider>
        <OrdersProvider>
          <SalesProvider>
            <Orders />
          </SalesProvider>
        </OrdersProvider>
      </UsersProvider>
    </ClientsProvider>
  );
}
