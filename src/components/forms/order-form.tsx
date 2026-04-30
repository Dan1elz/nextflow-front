import { useState, useMemo, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Minus,
  Trash2,
  ArrowLeft,
  ShoppingCart,
  Check,
  Ban,
  RotateCcw,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
  CardDescription,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";

import { SearchSelect } from "@/components/app/search-select";
import { handleError, handleSuccess } from "@/utils/toast.helpers";
import { formatCurrency } from "@/utils";

import { useOrders } from "@/hooks/use-orders";
import { useClients } from "@/hooks/use-clients";
import { useProducts } from "@/hooks/use-products";
import { useSearchOptions } from "@/hooks/use-search-options";

import type { IClient } from "@/interfaces/client.interface";
import type { IProduct } from "@/interfaces/product.interface";
import type { IOrder, IOrderItem } from "@/interfaces/order.interface";
import type { ISale, IPayment } from "@/interfaces/sale.interface";
import {
  TOrderType,
  TOrderStatus,
  ORDER_STATUS_LABELS,
  ORDER_TYPE_LABELS,
  PAYMENT_METHOD_LABELS,
  TPaymentMethod,
} from "@/types/enums";
import { API_URL } from "@/configs/api";
import type { IOption } from "@/interfaces/api.interface";
import { SaleCheckoutDrawer } from "@/components/app/sale-checkout-drawer";

type CartItem = {
  id: string;
  product: IProduct;
  quantity: number;
  discount: number;
};

type OrderFormMode = "create" | "edit" | "view";

interface OrderFormProps {
  mode?: OrderFormMode;
  orderId?: string;
  onFetchAssociatedSale?: (orderId: string) => Promise<ISale | null>;
}

const CANCEL_REASON_OPTIONS = [
  "Cliente desistiu da compra",
  "Produto indisponível",
  "Erro no pedido",
  "Pedido duplicado",
  "Prazo de entrega não atendido",
];

const REFUND_REASON_OPTIONS = [
  "Produto com defeito",
  "Produto divergente do anunciado",
  "Insatisfação do cliente",
  "Entrega com atraso",
  "Cobrança indevida",
];

export function OrderForm({ mode = "create", orderId, onFetchAssociatedSale }: OrderFormProps) {
  const navigate = useNavigate();
  const { createOrder, updateOrder, getOrderById, cancelOrder, refundOrder } =
    useOrders();
  const { searchClientsForOptions, getClientById } = useClients();
  const { searchProductsForOptions, getProductById } = useProducts();

  const isView = mode === "view";
  const isEdit = mode === "edit";
  const isCreate = mode === "create";

  // Order Info
  const [clientId, setClientId] = useState<string>("");
  const [orderType, setOrderType] = useState<number>(TOrderType.Budget);
  const [orderStatus, setOrderStatus] = useState<number>(TOrderStatus.Budget);
  const [loadedOrder, setLoadedOrder] = useState<IOrder | null>(null);
  const [loading, setLoading] = useState(false);
  const [associatedSale, setAssociatedSale] = useState<ISale | null>(null);

  // Cart Management
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  // Mini-form state for adding product
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [selectedProductData, setSelectedProductData] =
    useState<IProduct | null>(null);
  const [inputQuantity, setInputQuantity] = useState<number>(1);
  const [inputDiscount, setInputDiscount] = useState<number>(0);

  // Cancel/Refund modal
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [showCheckoutDrawer, setShowCheckoutDrawer] = useState(false);
  const [actionReason, setActionReason] = useState("");
  const [actionPreset, setActionPreset] = useState("");

  // Search options
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

  const { options: productOptions, handleSearch: handleSearchProducts } =
    useSearchOptions<IProduct>({
      searchFn: searchProductsForOptions,
      mapFn: (prod) => ({
        value: prod.id ?? "",
        label: `${prod.productCode} - ${prod.name}`,
      }),
      selectFn: async (id) => {
        const prod = await getProductById(id);
        setSelectedProductData(prod);
        return prod;
      },
      errorLabel: "produtos",
      autoLoad: false,
      perPage: 50,
    });

  // Load existing order for edit/view
  useEffect(() => {
    if ((isEdit || isView) && orderId) {
      setLoading(true);
      getOrderById(orderId)
        .then(async (order) => {
          setLoadedOrder(order);
          setClientId(order.clientId);
          setOrderType(order.type);
          setOrderStatus(order.status ?? TOrderStatus.Budget);

          // Map order items to cart items
          if (order.orderItems && order.orderItems.length > 0) {
            const items: CartItem[] = [];
            for (const oi of order.orderItems) {
              let product: IProduct;
              if (oi.product) {
                product = oi.product;
              } else {
                product = await getProductById(oi.productId);
              }
              items.push({
                id: oi.id ?? crypto.randomUUID(),
                product,
                quantity: Number(oi.quantity),
                discount: Number(oi.discount),
              });
            }
            setCartItems(items);
          }
        })
        .catch((err) => handleError(err, "Erro ao carregar pedido"))
        .finally(() => setLoading(false));
    }
  }, [isEdit, isView, orderId, getOrderById, getProductById]);

  useEffect(() => {
    if (loadedOrder?.id && orderStatus === TOrderStatus.PaymentConfirmed && onFetchAssociatedSale) {
      onFetchAssociatedSale(loadedOrder.id).then((sale) => {
        if (sale) {
          setAssociatedSale(sale);
        }
      });
    }
  }, [loadedOrder?.id, orderStatus, onFetchAssociatedSale]);

  const handleProductSelect = useCallback(
    async (val: string | number | boolean | undefined) => {
      const id = String(val ?? "");
      setSelectedProductId(id);
      if (!id) {
        setSelectedProductData(null);
      } else {
        const prod = await getProductById(id);
        setSelectedProductData(prod);
      }

      setInputQuantity(1);
      setInputDiscount(0);
    },
    [getProductById]
  );

  const handleAddToCart = () => {
    if (!selectedProductId || !selectedProductData) {
      handleError(new Error("Selecione um produto primeiro."), "");
      return;
    }
    if (inputQuantity <= 0) {
      handleError(new Error("A quantidade deve ser maior que zero."), "");
      return;
    }
    if (inputDiscount < 0) {
      handleError(new Error("Desconto não pode ser negativo."), "");
      return;
    }

    setCartItems((prev) => {
      const existing = prev.find(
        (i) => i.product.id === selectedProductData.id
      );
      if (existing) {
        return prev.map((i) =>
          i.product.id === selectedProductData.id
            ? {
                ...i,
                quantity: i.quantity + inputQuantity,
                discount: i.discount + inputDiscount,
              }
            : i
        );
      }
      return [
        ...prev,
        {
          id: crypto.randomUUID(),
          product: selectedProductData,
          quantity: inputQuantity,
          discount: inputDiscount,
        },
      ];
    });

    setSelectedProductId("");
    setSelectedProductData(null);
    setInputQuantity(1);
    setInputDiscount(0);
  };

  const updateCartItemQuantity = (id: string, delta: number) => {
    setCartItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const newQ = Math.max(1, item.quantity + delta);
          return { ...item, quantity: newQ };
        }
        return item;
      })
    );
  };

  const removeCartItem = (id: string) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
  };

  const calculateTotals = useMemo(() => {
    let subtotal = 0;
    let totalDiscount = 0;
    cartItems.forEach((item) => {
      const itemPrice = Number(item.product.price || 0);
      subtotal += itemPrice * item.quantity;
      totalDiscount += Number(item.discount || 0);
    });

    return {
      subtotal,
      totalDiscount,
      total: subtotal - totalDiscount,
      itemsCount: cartItems.reduce((acc, obj) => acc + obj.quantity, 0),
    };
  }, [cartItems]);

  const prepareAndSaveOrder = async (): Promise<IOrder | undefined> => {
    try {
      if (!clientId) throw new Error("Por favor, selecione o cliente.");
      if (cartItems.length === 0)
        throw new Error("Adicione pelo menos um produto ao pedido.");

      if (isCreate) {
        const payload: Omit<IOrder, "orderItems"> & {
          items: Partial<IOrderItem>[];
        } = {
          clientId,
          type: orderType as TOrderType,
          items: cartItems.map((c) => ({
            productId: c.product.id!,
            quantity: c.quantity,
            discount: c.discount,
          })),
        };

        const created = await createOrder(payload);
        handleSuccess("Pedido salvo com sucesso!");
        return created;
      } else if (isEdit && orderId) {
        const items: IOrderItem[] = cartItems.map((c) => ({
          productId: c.product.id!,
          quantity: c.quantity,
          discount: c.discount,
        }));

        const updated = await updateOrder(orderId, { items });
        handleSuccess("Pedido atualizado com sucesso!");
        return updated;
      }
      return loadedOrder || undefined;
    } catch (error) {
      handleError(error, "Erro ao salvar o pedido");
      throw error;
    }
  };

  const handleSaveOrder = async () => {
    try {
      await prepareAndSaveOrder();
      navigate("/orders");
    } catch {
      // Error handled inside
    }
  };

  const handleCancelOrder = async () => {
    if (!orderId || !actionReason.trim()) return;
    try {
      await cancelOrder(orderId, actionReason);
      handleSuccess("Pedido cancelado com sucesso!");
      navigate("/orders");
    } catch (error) {
      handleError(error, "Erro ao cancelar pedido");
    }
  };

  const handleRefundOrder = async () => {
    if (!orderId || !actionReason.trim()) return;
    try {
      await refundOrder(orderId, actionReason);
      handleSuccess("Pedido reembolsado com sucesso!");
      navigate("/orders");
    } catch (error) {
      handleError(error, "Erro ao reembolsar pedido");
    }
  };

  const handlePresetChange = (value: string) => {
    setActionPreset(value);
    if (value !== "__other__") {
      setActionReason(value);
    } else {
      setActionReason("");
    }
  };

  // Determine which actions are available based on status
  const canCancel =
    orderStatus === TOrderStatus.PendingPayment ||
    orderStatus === TOrderStatus.Budget;
  const canRefund = orderStatus === TOrderStatus.PaymentConfirmed;
  const isFinalized =
    orderStatus === TOrderStatus.Canceled ||
    orderStatus === TOrderStatus.Refunded ||
    orderStatus === TOrderStatus.PaymentConfirmed;
  const canFinalizeCheckout = !isFinalized;

  const handleFinalizeSale = async () => {
    try {
      if (isCreate || isEdit) {
        const savedOrder = await prepareAndSaveOrder();
        if (savedOrder) {
          setLoadedOrder(savedOrder);
          setShowCheckoutDrawer(true);
        }
      } else {
        setShowCheckoutDrawer(true);
      }
    } catch {
      // error handled in prepareAndSaveOrder
    }
  };

  // Titles
  const pageTitle = isCreate
    ? "Novo Pedido / Orçamento"
    : isEdit
      ? "Editar Pedido"
      : "Visualizar Pedido";
  const pageDescription = isCreate
    ? "Selecione o cliente e os produtos desejados"
    : isEdit
      ? "Modifique os itens do pedido"
      : "Detalhes do pedido";

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        Carregando pedido...
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 h-full pb-10">
      {/* Left: Items and Form */}
      <div className="col-span-1 md:col-span-8 flex flex-col gap-6">
        <Card className="shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3 flex-wrap">
                <div>
                  <CardTitle className="text-xl">{pageTitle}</CardTitle>
                  <CardDescription>{pageDescription}</CardDescription>
                </div>
                {!isCreate && (
                  <div className="flex gap-2">
                    <Badge variant="outline">
                      {ORDER_TYPE_LABELS[orderType as TOrderType] ??
                        "Desconhecido"}
                    </Badge>
                    <Badge
                      variant={
                        orderStatus === TOrderStatus.PaymentConfirmed
                          ? "default"
                          : orderStatus === TOrderStatus.Canceled ||
                              orderStatus === TOrderStatus.Refunded
                            ? "destructive"
                            : "secondary"
                      }
                    >
                      {ORDER_STATUS_LABELS[orderStatus as TOrderStatus] ??
                        "Desconhecido"}
                    </Badge>
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                {/* Cancel/Refund Buttons for view/edit */}
                {!isCreate && canCancel && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      setActionReason("");
                      setActionPreset("");
                      setShowCancelModal(true);
                    }}
                  >
                    <Ban className="w-4 h-4 mr-2" />
                    Cancelar Pedido
                  </Button>
                )}
                {!isCreate && canRefund && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      setActionReason("");
                      setActionPreset("");
                      setShowRefundModal(true);
                    }}
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Reembolsar
                  </Button>
                )}

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Voltar
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Deseja mesmo sair?</AlertDialogTitle>
                      <AlertDialogDescription>
                        {isView
                          ? "Você será redirecionado para a listagem de pedidos."
                          : "Todos os dados não salvos deste formulário serão perdidos."}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>
                        {isView ? "Continuar" : "Continuar Editando"}
                      </AlertDialogCancel>
                      <AlertDialogAction onClick={() => navigate("/orders")}>
                        Sim, Sair
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                {isView ? (
                  <div className="grid gap-2">
                    <Label>Cliente</Label>
                    <Input
                      disabled
                      value={
                        loadedOrder?.client
                          ? `${loadedOrder.client.name} ${loadedOrder.client.lastName}`
                          : clientId
                      }
                    />
                  </div>
                ) : (
                  <SearchSelect<IOption>
                    field={{
                      value: clientId,
                      onChange: (val) => setClientId(String(val ?? "")),
                    }}
                    data={clientOptions}
                    onSearch={handleSearchClients}
                    placeholder="Selecione um cliente..."
                    label="Cliente"
                    disabled={isEdit}
                  />
                )}
              </div>
              <div className="grid gap-2">
                <Label>Tipo de Pedido</Label>
                {isView || isEdit ? (
                  <Input
                    disabled
                    value={
                      ORDER_TYPE_LABELS[orderType as TOrderType] ??
                      "Desconhecido"
                    }
                  />
                ) : (
                  <Select
                    value={String(orderType)}
                    onValueChange={(v) => setOrderType(Number(v))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={String(TOrderType.Budget)}>
                        Orçamento
                      </SelectItem>
                      <SelectItem value={String(TOrderType.Sale)}>
                        Venda
                      </SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>

            {/* Loss reason if finalized */}
            {(orderStatus === TOrderStatus.Canceled ||
              orderStatus === TOrderStatus.Refunded) &&
              loadedOrder?.lossReason && (
                <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-4">
                  <Label className="text-destructive font-semibold">
                    Motivo:{" "}
                  </Label>
                  <span className="text-sm">{loadedOrder.lossReason}</span>
                </div>
              )}

            {/* Payment Methods Visualizer */}
            {associatedSale &&
              associatedSale.payments &&
              associatedSale.payments.length > 0 && (
                <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex flex-col gap-3">
                  <h3 className="font-semibold text-sm">
                    Métodos de Pagamento Utilizados
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {associatedSale.payments.map((p: IPayment) => (
                      <div
                        key={p.id}
                        className="flex flex-col bg-background border p-3 rounded-lg"
                      >
                        <span className="text-xs text-muted-foreground">
                          Método
                        </span>
                        <span className="font-medium">
                          {PAYMENT_METHOD_LABELS[
                            p.paymentMethod as TPaymentMethod
                          ] ?? p.paymentMethod}
                        </span>
                        <span className="font-bold text-primary mt-1">
                          {formatCurrency(p.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            <Separator />

            {/* Mini form for adding product - hidden in view mode or when finalized */}
            {!isView && !isFinalized && (
              <div className="bg-muted/30 p-4 rounded-xl border border-dashed flex flex-col gap-4">
                <h3 className="font-semibold text-sm">Adicionar Produto</h3>
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-end">
                  <div className="xl:col-span-6 grid gap-2">
                    <SearchSelect<IOption>
                      field={{
                        value: selectedProductId,
                        onChange: handleProductSelect,
                      }}
                      data={productOptions}
                      onSearch={handleSearchProducts}
                      placeholder="Buscar Produto..."
                      label="Produto"
                    />
                  </div>
                  <div className="xl:col-span-6 grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                    <div className="grid gap-2">
                      <Label>Quantidade</Label>
                      <Input
                        type="number"
                        min="1"
                        value={inputQuantity}
                        onChange={(e) =>
                          setInputQuantity(Number(e.target.value))
                        }
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>Desconto ($)</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={inputDiscount}
                        onChange={(e) =>
                          setInputDiscount(Number(e.target.value))
                        }
                      />
                    </div>
                    <Button
                      onClick={handleAddToCart}
                      className="w-full"
                      variant="secondary"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Incluir
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Cart List */}
            <div className="flex flex-col gap-4 mt-2">
              <h3 className="font-semibold text-lg">
                Itens {isView ? "" : "Adicionados"} ({cartItems.length})
              </h3>
              {cartItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 text-center bg-muted/20 border-2 border-dashed rounded-xl">
                  <ShoppingCart className="w-12 h-12 text-muted-foreground/30 mb-3" />
                  <p className="text-muted-foreground">
                    Nenhum produto foi adicionado ao pedido ainda.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {cartItems.map((item) => {
                    const price = isView
                      ? Number(
                          (item as Partial<IOrderItem>).unitPrice ??
                            item.product.price ??
                            0
                        )
                      : Number(item.product.price || 0);
                    const lineTotal = price * item.quantity - item.discount;

                    let imgUrl: string | null = null;
                    if (typeof item.product.image === "string") {
                      imgUrl = item.product.image.startsWith("http")
                        ? item.product.image
                        : `${API_URL}/assets/${item.product.image}`;
                    } else if (item.product.image instanceof File) {
                      imgUrl = URL.createObjectURL(item.product.image);
                    }

                    return (
                      <div
                        key={item.id}
                        className="relative bg-card border rounded-xl p-4 shadow-sm hover:shadow transition-shadow"
                      >
                        {/* Remove button - hidden in view mode */}
                        {!isView && !isFinalized && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="absolute top-2 right-2 text-muted-foreground hover:text-destructive shrink-0 h-8 w-8 z-10"
                            onClick={() => removeCartItem(item.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}

                        <div className="flex flex-col sm:flex-row gap-4">
                          {/* Image + Info */}
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            <div className="w-14 h-14 bg-muted rounded-md overflow-hidden shrink-0 flex items-center justify-center border">
                              {imgUrl ? (
                                <img
                                  src={imgUrl}
                                  alt={item.product.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <ShoppingCart className="w-6 h-6 text-muted-foreground/40" />
                              )}
                            </div>
                            <div className="flex flex-col min-w-0 pr-8">
                              <span className="font-semibold text-sm truncate">
                                {item.product.name}
                              </span>
                              <span className="text-xs text-muted-foreground truncate">
                                Cod: {item.product.productCode}
                              </span>
                              <span className="text-sm font-medium text-primary mt-0.5">
                                {formatCurrency(price)}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                Estoque: {Number(item.product.quantity ?? 0)}{" "}
                                un.
                              </span>
                            </div>
                          </div>

                          {/* Controls row */}
                          <div className="flex items-center justify-between sm:justify-end gap-4 sm:gap-6 border-t sm:border-t-0 pt-3 sm:pt-0 sm:pr-6">
                            <div className="flex flex-col items-center">
                              <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mb-1">
                                Qtd
                              </span>
                              {isView || isFinalized ? (
                                <span className="text-sm font-medium">
                                  {item.quantity}
                                </span>
                              ) : (
                                <div className="flex items-center gap-1.5 bg-muted/50 rounded-full px-2 py-1 border">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 rounded-full hover:bg-background"
                                    onClick={() =>
                                      updateCartItemQuantity(item.id, -1)
                                    }
                                  >
                                    <Minus className="w-3 h-3" />
                                  </Button>
                                  <span className="w-6 text-center text-sm font-medium">
                                    {item.quantity}
                                  </span>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 rounded-full hover:bg-background"
                                    onClick={() =>
                                      updateCartItemQuantity(item.id, 1)
                                    }
                                  >
                                    <Plus className="w-3 h-3" />
                                  </Button>
                                </div>
                              )}
                            </div>

                            <div className="flex flex-col items-center sm:items-end opacity-90">
                              <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mb-1">
                                Desconto
                              </span>
                              <span className="text-sm font-medium text-destructive">
                                -{formatCurrency(item.discount)}
                              </span>
                            </div>

                            <div className="flex flex-col items-center sm:items-end">
                              <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mb-1">
                                Total
                              </span>
                              <span className="text-base font-bold whitespace-nowrap">
                                {formatCurrency(Math.max(0, lineTotal))}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Right: Summary and Totals */}
      <div className="col-span-1 md:col-span-4 flex flex-col gap-6">
        <Card className="shadow-sm sticky top-6">
          <CardHeader className="bg-muted/20 border-b">
            <CardTitle>Resumo do Pedido</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 flex flex-col gap-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Produtos ({calculateTotals.itemsCount})
              </span>
              <span className="font-semibold">
                {isView && loadedOrder
                  ? formatCurrency(
                      Number(loadedOrder.totalAmount ?? 0) +
                        Number(loadedOrder.totalDiscount ?? 0)
                    )
                  : formatCurrency(calculateTotals.subtotal)}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Descontos (Total)</span>
              <span className="font-semibold text-destructive">
                -
                {isView && loadedOrder
                  ? formatCurrency(Number(loadedOrder.totalDiscount ?? 0))
                  : formatCurrency(calculateTotals.totalDiscount)}
              </span>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <span className="font-bold text-lg">Total</span>
              <span className="font-bold text-2xl text-primary">
                {isView && loadedOrder
                  ? formatCurrency(Number(loadedOrder.totalAmount ?? 0))
                  : formatCurrency(Math.max(0, calculateTotals.total))}
              </span>
            </div>
          </CardContent>
          {!isView && !isFinalized && (
            <CardFooter className="flex flex-col gap-3 bg-muted/10 pt-4 rounded-b-xl">
              <Button
                className="w-full py-6 text-sm font-bold shadow transition-all duration-300 hover:shadow-primary/20 hover:scale-[1.02]"
                onClick={handleSaveOrder}
              >
                <Check className="w-5 h-5 mr-2" />
                {isEdit
                  ? "Salvar Alterações"
                  : orderType === TOrderType.Sale
                    ? "Salvar Pedido"
                    : "Salvar Orçamento"}
              </Button>
              {canFinalizeCheckout && (
                <Button
                  variant="outline"
                  className="w-full bg-background border-primary text-primary hover:bg-primary/5 hover:text-primary transition-all duration-300"
                  onClick={handleFinalizeSale}
                >
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Finalizar Venda
                </Button>
              )}
            </CardFooter>
          )}
        </Card>
      </div>

      {loadedOrder && (
        <SaleCheckoutDrawer
          open={showCheckoutDrawer}
          onOpenChange={setShowCheckoutDrawer}
          order={loadedOrder}
          onSuccess={() => {
            handleSuccess("Venda confirmada!");
            navigate("/orders");
          }}
        />
      )}

      {/* Cancel Modal */}
      <AlertDialog open={showCancelModal} onOpenChange={setShowCancelModal}>
        <AlertDialogContent>
          <AlertDialogHeader className="text-left">
            <AlertDialogTitle>Cancelar Pedido</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação cancelará o pedido e retornará os itens ao estoque (se
              aplicável). Esta ação não pode ser desfeita.
            </AlertDialogDescription>
            <div className="grid gap-3 mt-4 py-2">
              <Label>Motivo do cancelamento:</Label>
              <Select value={actionPreset} onValueChange={handlePresetChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um motivo..." />
                </SelectTrigger>
                <SelectContent>
                  {CANCEL_REASON_OPTIONS.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                  <SelectItem value="__other__">Outros</SelectItem>
                </SelectContent>
              </Select>
              {actionPreset === "__other__" && (
                <Input
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  placeholder="Descreva o motivo..."
                />
              )}
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={handleCancelOrder}
              disabled={!actionReason.trim()}
            >
              Confirmar Cancelamento
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Refund Modal */}
      <AlertDialog open={showRefundModal} onOpenChange={setShowRefundModal}>
        <AlertDialogContent>
          <AlertDialogHeader className="text-left">
            <AlertDialogTitle>Reembolsar Pedido</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação reembolsará o pedido e retornará os itens ao estoque. O
              reembolso só é permitido até 7 dias após o pagamento.
            </AlertDialogDescription>
            <div className="grid gap-3 mt-4 py-2">
              <Label>Motivo do reembolso:</Label>
              <Select value={actionPreset} onValueChange={handlePresetChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um motivo..." />
                </SelectTrigger>
                <SelectContent>
                  {REFUND_REASON_OPTIONS.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                  <SelectItem value="__other__">Outros</SelectItem>
                </SelectContent>
              </Select>
              {actionPreset === "__other__" && (
                <Input
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  placeholder="Descreva o motivo..."
                />
              )}
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={handleRefundOrder}
              disabled={!actionReason.trim()}
            >
              Confirmar Reembolso
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
