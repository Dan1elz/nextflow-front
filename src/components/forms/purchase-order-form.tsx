import { useState, useMemo, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Minus,
  Trash2,
  ArrowLeft,
  Package,
  PackagePlus,
  Check,
  Ban,
  PackageCheck,
  RotateCcw,
  ClipboardList,
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
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
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
import { formatCurrency, generateUUID } from "@/utils";

import { usePurchaseOrders } from "@/hooks/use-purchase-orders";
import { useSuppliers } from "@/hooks/use-suppliers";
import { useProducts } from "@/hooks/use-products";
import { useCategories } from "@/hooks/use-categories";
import { useSearchOptions } from "@/hooks/use-search-options";
import { ProductForm } from "@/components/forms/product-form";
import type { ProductSchema } from "@/schemas/product.schema";
import type { ICategory } from "@/interfaces/category.interface";

import type { ISupplier } from "@/interfaces/supplier.interface";
import type { IProduct } from "@/interfaces/product.interface";
import type {
  IPurchaseOrder,
  ICreatePurchaseOrder,
  IUpdatePurchaseOrder,
} from "@/interfaces/purchase-order.interface";
import {
  PURCHASE_STATUS_LABELS,
  TPurchaseStatus,
} from "@/types/enums";
import { API_URL } from "@/configs/api";
import type { IOption } from "@/interfaces/api.interface";

type CartItem = {
  id: string;
  product: IProduct;
  quantity: number;
  discount: number;
  costPrice: number;
};

type PurchaseOrderFormMode = "create" | "edit" | "view";

interface PurchaseOrderFormProps {
  mode?: PurchaseOrderFormMode;
  purchaseOrderId?: string;
}

const CANCEL_REASON_OPTIONS = [
  "Fornecedor não entregou",
  "Produto indisponível",
  "Erro no pedido",
  "Pedido duplicado",
  "Preço divergente",
];

export function PurchaseOrderForm({
  mode = "create",
  purchaseOrderId,
}: PurchaseOrderFormProps) {
  const navigate = useNavigate();
  const {
    createPurchaseOrder,
    updatePurchaseOrder,
    getPurchaseOrderById,
    deletePurchaseOrder,
  } = usePurchaseOrders();
  const { searchSuppliersForOptions, getSupplierById } = useSuppliers();
  const { searchProductsForOptions, getProductById, createProduct } = useProducts();
  const { searchCategoriesForOptions, getCategoryById } = useCategories();

  const isView = mode === "view";
  const isEdit = mode === "edit";
  const isCreate = mode === "create";

  // Purchase Order Info
  const [supplierId, setSupplierId] = useState<string>("");
  const [note, setNote] = useState<string>("");
  const [purchaseStatus, setPurchaseStatus] = useState<number>(
    TPurchaseStatus.Budget
  );
  const [loadedOrder, setLoadedOrder] = useState<IPurchaseOrder | null>(null);
  const [loading, setLoading] = useState(false);

  // Cart Management
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  // Mini-form state for adding product
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [selectedProductData, setSelectedProductData] =
    useState<IProduct | null>(null);
  const [inputQuantity, setInputQuantity] = useState<number>(1);
  const [inputDiscount, setInputDiscount] = useState<number>(0);
  const [inputCostPrice, setInputCostPrice] = useState<number>(0);

  // Cancel modal
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [actionReason, setActionReason] = useState("");

  // New product dialog
  const [showNewProductDialog, setShowNewProductDialog] = useState(false);
  const [isCreatingProduct, setIsCreatingProduct] = useState(false);

  // Search options
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

  const productFilters = useMemo(
    () => (supplierId ? { supplierId } : ({} as Record<string, string>)),
    [supplierId]
  );

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
      initialFilters: productFilters,
      enabled: !!supplierId,
    });

  const { options: categoryOptions, handleSearch: handleSearchCategories } =
    useSearchOptions<ICategory>({
      searchFn: searchCategoriesForOptions,
      mapFn: (c) => ({ value: c.id ?? "", label: c.description || "Categoria" }),
      selectFn: getCategoryById,
      errorLabel: "categorias",
      autoLoad: false,
      perPage: 50,
    });

  // Load existing purchase order for edit/view
  useEffect(() => {
    if ((isEdit || isView) && purchaseOrderId) {
      setLoading(true);
      getPurchaseOrderById(purchaseOrderId)
        .then(async (order) => {
          setLoadedOrder(order);
          setSupplierId(order.supplierId);
          setNote(order.note ?? "");
          setPurchaseStatus(order.status ?? TPurchaseStatus.Budget);

          // Map items to cart items
          if (order.items && order.items.length > 0) {
            const items: CartItem[] = [];
            for (const pi of order.items) {
              let product: IProduct;
              if (pi.product) {
                product = pi.product;
              } else {
                product = await getProductById(pi.productId);
              }
              items.push({
                id: pi.id ?? generateUUID(),
                product,
                quantity: Number(pi.quantity),
                discount: Number(pi.discount),
                costPrice: Number(pi.costPrice),
              });
            }
            setCartItems(items);
          }
        })
        .catch((err) => handleError(err, "Erro ao carregar pedido de compra"))
        .finally(() => setLoading(false));
    }
  }, [isEdit, isView, purchaseOrderId, getPurchaseOrderById, getProductById]);

  const handleProductSelect = useCallback(
    async (val: string | number | boolean | undefined) => {
      const id = String(val ?? "");
      setSelectedProductId(id);
      if (!id) {
        setSelectedProductData(null);
      } else {
        const prod = await getProductById(id);
        setSelectedProductData(prod);
        setInputCostPrice(Number(prod.price || 0));
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
    if (inputCostPrice <= 0) {
      handleError(new Error("O custo unitário deve ser maior que zero."), "");
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
          id: generateUUID(),
          product: selectedProductData,
          quantity: inputQuantity,
          discount: inputDiscount,
          costPrice: inputCostPrice,
        },
      ];
    });

    setSelectedProductId("");
    setSelectedProductData(null);
    setInputQuantity(1);
    setInputDiscount(0);
    setInputCostPrice(0);
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
      subtotal += item.costPrice * item.quantity;
      totalDiscount += Number(item.discount || 0);
    });

    return {
      subtotal,
      totalDiscount,
      total: subtotal - totalDiscount,
      itemsCount: cartItems.reduce((acc, obj) => acc + obj.quantity, 0),
    };
  }, [cartItems]);

  const handleSaveOrder = async (asPending = false) => {
    try {
      if (!supplierId) throw new Error("Por favor, selecione o fornecedor.");
      if (cartItems.length === 0)
        throw new Error("Adicione pelo menos um produto ao pedido.");

      if (isCreate) {
        const payload: ICreatePurchaseOrder = {
          supplierId,
          note: note || undefined,
          items: cartItems.map((c) => ({
            productId: c.product.id!,
            quantity: c.quantity,
            discount: c.discount,
            costPrice: c.costPrice,
          })),
        };

        const created = await createPurchaseOrder(payload);

        // If creating as Pending, update status after creation
        if (asPending && created?.id) {
          await updatePurchaseOrder(created.id, {
            status: TPurchaseStatus.Pending,
          });
        }

        handleSuccess(
          asPending
            ? "Pedido de compra confirmado com sucesso!"
            : "Orçamento salvo com sucesso!"
        );
      } else if (isEdit && purchaseOrderId) {
        const payload: IUpdatePurchaseOrder = {
          note: note || undefined,
          items: cartItems.map((c) => ({
            productId: c.product.id!,
            quantity: c.quantity,
            discount: c.discount,
            costPrice: c.costPrice,
          })),
        };

        await updatePurchaseOrder(purchaseOrderId, payload);
        handleSuccess("Pedido de compra atualizado com sucesso!");
      }
      navigate("/purchase-orders");
    } catch (error) {
      handleError(error, "Erro ao salvar o pedido de compra");
    }
  };

  const handleConfirmPending = async () => {
    if (!purchaseOrderId) return;
    try {
      await updatePurchaseOrder(purchaseOrderId, {
        status: TPurchaseStatus.Pending,
      });
      handleSuccess("Pedido confirmado como pendente!");
      navigate("/purchase-orders");
    } catch (error) {
      handleError(error, "Erro ao confirmar pedido");
    }
  };

  const handleCancelOrder = async () => {
    if (!purchaseOrderId) return;
    try {
      await deletePurchaseOrder(purchaseOrderId);
      handleSuccess("Pedido de compra cancelado com sucesso!");
      navigate("/purchase-orders");
    } catch (error) {
      handleError(error, "Erro ao cancelar pedido de compra");
    }
  };

  const handleConfirmReceived = async () => {
    if (!purchaseOrderId) return;
    try {
      await updatePurchaseOrder(purchaseOrderId, {
        status: TPurchaseStatus.Received,
      });
      handleSuccess("Pedido recebido! Estoque atualizado automaticamente.");
      navigate("/purchase-orders");
    } catch (error) {
      handleError(error, "Erro ao confirmar recebimento");
    }
  };

  const handleCreateProduct = async (data: ProductSchema) => {
    try {
      setIsCreatingProduct(true);
      const productData = { ...data, supplierId } as unknown as Partial<IProduct>;
      const created = await createProduct(productData);
      handleSuccess("Produto criado com sucesso!");
      setShowNewProductDialog(false);
      if (created?.id) {
        const fullProduct = await getProductById(created.id);
        setSelectedProductId(created.id);
        setSelectedProductData(fullProduct);
        setInputCostPrice(Number(fullProduct.price || 0));
        // Refresh product list
        handleSearchProducts("");
      }
    } catch (error) {
      handleError(error, "Erro ao criar produto");
    } finally {
      setIsCreatingProduct(false);
    }
  };

  const canReceive =
    (isEdit || isView) &&
    (purchaseStatus === TPurchaseStatus.Budget ||
      purchaseStatus === TPurchaseStatus.Pending);

  // Determine which actions are available based on status
  const handleResetForm = () => {
    setSupplierId("");
    setNote("");
    setCartItems([]);
    setSelectedProductId("");
    setSelectedProductData(null);
    setInputQuantity(1);
    setInputDiscount(0);
    setInputCostPrice(0);
  };

  const supplierLocked = isCreate && !!supplierId;

  const canCancel =
    purchaseStatus === TPurchaseStatus.Budget ||
    purchaseStatus === TPurchaseStatus.Pending;
  const isFinalized =
    purchaseStatus === TPurchaseStatus.Canceled ||
    purchaseStatus === TPurchaseStatus.Received;

  // Titles
  const pageTitle = isCreate
    ? "Novo Pedido de Compra"
    : isEdit
      ? "Editar Pedido de Compra"
      : "Visualizar Pedido de Compra";
  const pageDescription = isCreate
    ? "Selecione o fornecedor e os produtos desejados"
    : isEdit
      ? "Modifique os itens do pedido de compra"
      : "Detalhes do pedido de compra";

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        Carregando pedido de compra...
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full pb-10">
      {/* Left: Items and Form */}
      <div className="col-span-1 lg:col-span-8 flex flex-col gap-6">
        <Card className="shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3 flex-wrap">
                <div>
                  <CardTitle className="text-xl">{pageTitle}</CardTitle>
                  <CardDescription>{pageDescription}</CardDescription>
                </div>
                {!isCreate && (
                  <Badge
                    variant={
                      purchaseStatus === TPurchaseStatus.Received
                        ? "default"
                        : purchaseStatus === TPurchaseStatus.Canceled
                          ? "destructive"
                          : purchaseStatus === TPurchaseStatus.Pending
                            ? "outline"
                            : "secondary"
                    }
                  >
                    {PURCHASE_STATUS_LABELS[
                      purchaseStatus as TPurchaseStatus
                    ] ?? "Desconhecido"}
                  </Badge>
                )}
              </div>
              <div className="flex gap-2">
                {isCreate && supplierLocked && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleResetForm}
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Limpar
                  </Button>
                )}
                {!isCreate && canCancel && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      setActionReason("");
                      setShowCancelModal(true);
                    }}
                  >
                    <Ban className="w-4 h-4 mr-2" />
                    Cancelar Pedido
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
                          ? "Você será redirecionado para a listagem de pedidos de compra."
                          : "Todos os dados não salvos deste formulário serão perdidos."}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>
                        {isView ? "Continuar" : "Continuar Editando"}
                      </AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => navigate("/purchase-orders")}
                      >
                        Sim, Sair
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            <div className="grid grid-cols-1 gap-4">
              <div className="grid gap-2">
                {isView ? (
                  <div className="grid gap-2">
                    <Label>Fornecedor</Label>
                    <Input
                      disabled
                      value={
                        loadedOrder?.supplier
                          ? loadedOrder.supplier.name
                          : supplierId
                      }
                    />
                  </div>
                ) : (
                  <SearchSelect<IOption>
                    field={{
                      value: supplierId,
                      onChange: (val) => setSupplierId(String(val ?? "")),
                    }}
                    data={supplierOptions}
                    onSearch={handleSearchSuppliers}
                    placeholder="Selecione um fornecedor..."
                    label="Fornecedor"
                    disabled={isEdit || supplierLocked}
                  />
                )}
              </div>
              <div className="grid gap-2">
                <Label>Observação</Label>
                <Textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Observações sobre o pedido..."
                  disabled={isView || isFinalized}
                  rows={2}
                />
              </div>
            </div>

            <Separator />

            {/* Mini form for adding product - hidden in view mode or when finalized */}
            {!isView && !isFinalized && (
              <div className="bg-muted/30 p-4 rounded-xl border border-dashed flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm">Adicionar Produto</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowNewProductDialog(true)}
                  >
                    <PackagePlus className="w-4 h-4 mr-2" />
                    Novo Produto
                  </Button>
                </div>
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-end">
                  <div className="xl:col-span-5 grid gap-2">
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
                  <div className="xl:col-span-7 grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
                    <div className="grid gap-2">
                      <Label>Custo Unit. ($)</Label>
                      <Input
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={inputCostPrice}
                        onChange={(e) =>
                          setInputCostPrice(Number(e.target.value))
                        }
                      />
                    </div>
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
                  <Package className="w-12 h-12 text-muted-foreground/30 mb-3" />
                  <p className="text-muted-foreground">
                    Nenhum produto foi adicionado ao pedido ainda.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {cartItems.map((item) => {
                    const price = Number(item.costPrice || 0);
                    const lineTotal =
                      price * item.quantity - item.discount;

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
                        {/* Remove button */}
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
                                <Package className="w-6 h-6 text-muted-foreground/40" />
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
                                Custo: {formatCurrency(price)}
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
      <div className="col-span-1 lg:col-span-4 flex flex-col gap-6">
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
                        calculateTotals.totalDiscount
                    )
                  : formatCurrency(calculateTotals.subtotal)}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Descontos (Total)</span>
              <span className="font-semibold text-destructive">
                -
                {formatCurrency(calculateTotals.totalDiscount)}
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
              {isCreate ? (
                <>
                  <Button
                    className="w-full py-6 text-sm font-bold shadow transition-all duration-300 hover:shadow-primary/20 hover:scale-[1.02]"
                    onClick={() => handleSaveOrder(true)}
                  >
                    <ClipboardList className="w-5 h-5 mr-2" />
                    Confirmar Pedido
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full bg-background transition-all duration-300"
                    onClick={() => handleSaveOrder(false)}
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Salvar como Orçamento
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    className="w-full py-6 text-sm font-bold shadow transition-all duration-300 hover:shadow-primary/20 hover:scale-[1.02]"
                    onClick={() => handleSaveOrder()}
                  >
                    <Check className="w-5 h-5 mr-2" />
                    Salvar Alterações
                  </Button>
                  {purchaseStatus === TPurchaseStatus.Budget && (
                    <Button
                      variant="outline"
                      className="w-full bg-background border-primary text-primary hover:bg-primary/5 hover:text-primary transition-all duration-300"
                      onClick={handleConfirmPending}
                    >
                      <ClipboardList className="w-4 h-4 mr-2" />
                      Confirmar Pedido
                    </Button>
                  )}
                </>
              )}
              {canReceive && (
                <Button
                  variant="outline"
                  className="w-full bg-background border-emerald-600 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 transition-all duration-300"
                  onClick={() => setShowReceiveModal(true)}
                >
                  <PackageCheck className="w-4 h-4 mr-2" />
                  Confirmar Recebimento
                </Button>
              )}
            </CardFooter>
          )}
          {isView && canReceive && (
            <CardFooter className="flex flex-col gap-3 bg-muted/10 pt-4 rounded-b-xl">
              <Button
                className="w-full py-6 text-sm font-bold shadow transition-all duration-300 hover:shadow-primary/20 hover:scale-[1.02]"
                onClick={() => setShowReceiveModal(true)}
              >
                <PackageCheck className="w-5 h-5 mr-2" />
                Confirmar Recebimento
              </Button>
            </CardFooter>
          )}
        </Card>
      </div>

      {/* Cancel Modal */}
      <AlertDialog open={showCancelModal} onOpenChange={setShowCancelModal}>
        <AlertDialogContent>
          <AlertDialogHeader className="text-left">
            <AlertDialogTitle>Cancelar Pedido de Compra</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação excluirá o pedido de compra. Esta ação não pode ser
              desfeita.
            </AlertDialogDescription>
            <div className="grid gap-3 mt-4 py-2">
              <Label>Motivo do cancelamento:</Label>
              <div className="flex flex-col gap-2">
                {CANCEL_REASON_OPTIONS.map((option) => (
                  <Button
                    key={option}
                    variant={actionReason === option ? "default" : "outline"}
                    size="sm"
                    className="justify-start"
                    onClick={() => setActionReason(option)}
                  >
                    {option}
                  </Button>
                ))}
              </div>
              <Input
                value={
                  CANCEL_REASON_OPTIONS.includes(actionReason)
                    ? ""
                    : actionReason
                }
                onChange={(e) => setActionReason(e.target.value)}
                placeholder="Ou descreva outro motivo..."
              />
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

      {/* Receive Confirmation Modal */}
      <AlertDialog open={showReceiveModal} onOpenChange={setShowReceiveModal}>
        <AlertDialogContent>
          <AlertDialogHeader className="text-left">
            <AlertDialogTitle>Confirmar Recebimento</AlertDialogTitle>
            <AlertDialogDescription>
              Ao confirmar o recebimento, os itens deste pedido serão
              automaticamente adicionados ao estoque. Esta ação não pode ser
              desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <Button onClick={handleConfirmReceived}>
              <PackageCheck className="w-4 h-4 mr-2" />
              Confirmar Recebimento
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* New Product Dialog */}
      <Dialog open={showNewProductDialog} onOpenChange={setShowNewProductDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Cadastrar Novo Produto</DialogTitle>
            <DialogDescription>
              Preencha os dados do produto. Após salvar, ele será selecionado
              automaticamente.
            </DialogDescription>
          </DialogHeader>
          <ProductForm
            onSubmit={handleCreateProduct}
            isLoading={isCreatingProduct}
            onBack={() => setShowNewProductDialog(false)}
            initialData={{ supplierId } as IProduct}
            disabled={false}
            hideSupplier
            supplierOptions={[{ value: supplierId, label: supplierOptions.find(s => s.value === supplierId)?.label || "Fornecedor" }]}
            onSearchSuppliers={async () => {}}
            categoryOptions={categoryOptions}
            onSearchCategory={handleSearchCategories}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
