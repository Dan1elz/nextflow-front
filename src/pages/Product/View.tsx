import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowRightLeft,
  History,
  ImageOff,
  PackagePlus,
  Pencil,
} from "lucide-react";

import { ManualMovementDrawer } from "@/components/app/manual-movement-drawer";
import { StockTransferDialog } from "@/components/app/stock-transfer-dialog";
import { ProductLotsTab } from "@/components/app/product-lots-tab";
import { ProductForecastTab } from "@/components/app/product-forecast-tab";
import { ProductPromotionsTab } from "@/components/app/product-promotions-tab";
import { EntityTabsLayout } from "@/components/layouts/EntityTabsLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader } from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useCurrentStore } from "@/hooks/use-current-store";
import { useProducts } from "@/hooks/use-products";
import type {
  PriceHistoryResponseDto,
  ProductResponseDto,
  ProductSupplierResponseDto,
  ProductVariantResponseDto,
  LotBalanceDto,
  StockMatrixDto,
} from "@/interfaces/product.interface";
import { ProductsProvider } from "@/providers/products.provider";
import {
  LIFECYCLE_LABELS,
  PRODUCT_TYPE_LABELS,
  SALE_UNIT_LABELS,
  TLifecycle,
  TMovementReason,
  TMovementType,
} from "@/types/enums";
import {
  formatCurrency,
  formatDateOnly,
  formatNumber,
  formatPercentage,
} from "@/utils/format.helpers";
import { formatPriceRange, SALE_UNIT_SHORT } from "@/utils/product.helpers";
import { handleError } from "@/utils/toast.helpers";

function Detail({
  label,
  value,
  wide,
  valueClassName,
}: {
  label: string;
  value: string;
  /** Texto longo: ocupa a linha inteira no celular (duas colunas). */
  wide?: boolean;
  valueClassName?: string;
}) {
  return (
    <div
      className={`flex min-w-0 flex-col gap-0.5 ${wide ? "col-span-2 sm:col-span-1" : ""}`}
    >
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className={`text-sm wrap-anywhere ${valueClassName ?? ""}`}>
        {value}
      </dd>
    </div>
  );
}

const formatCost = (value?: number | null) =>
  value == null ? "-" : formatCurrency(value);

function formatCostRange(min?: number | null, max?: number | null) {
  if (min == null || max == null) return "-";
  return min === max
    ? formatCurrency(min)
    : `${formatCurrency(min)} a ${formatCurrency(max)}`;
}

/**
 * Margem do produto no topo: a faixa das margens que a API calcula por variação (preço efetivo − custo médio, sobre o
 * preço). Nulo sem custo médio em nenhuma variação.
 */
function marginRange(variants: ProductVariantResponseDto[]) {
  const margins = variants
    .filter((variant) => variant.isActive && variant.marginPercent != null)
    .map((variant) => variant.marginPercent!);
  if (margins.length === 0) return null;
  const min = Math.min(...margins);
  const max = Math.max(...margins);
  return {
    min,
    text:
      min === max
        ? formatPercentage(min)
        : `${formatPercentage(min)} a ${formatPercentage(max)}`,
  };
}

function VariantsTab({
  variants,
  decimalPlaces,
}: {
  variants: ProductVariantResponseDto[];
  decimalPlaces: number;
}) {
  return (
    <>
      {/* Celular: um card por variação. */}
      <div className="flex flex-col gap-3 md:hidden">
        {variants.map((variant) => (
          <div
            key={variant.id}
            className="flex flex-col gap-3 rounded-xl border p-4"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex min-w-0 flex-col">
                <span className="font-semibold">
                  {variant.label || "Padrão"}
                </span>
                <span className="text-xs text-muted-foreground wrap-anywhere">
                  SKU {variant.sku}
                  {variant.barcode ? ` · ${variant.barcode}` : ""}
                </span>
              </div>
              <Badge variant={variant.isActive ? "default" : "secondary"}>
                {variant.isActive ? "Ativa" : "Inativa"}
              </Badge>
            </div>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
              <div className="col-span-2 flex items-baseline justify-between gap-2">
                <dt className="text-xs text-muted-foreground">Preço efetivo</dt>
                <dd className="flex items-center gap-2 text-lg font-semibold text-primary">
                  {formatCurrency(variant.effectivePrice)}
                  {variant.activePromotion && (
                    <Badge variant="secondary">
                      −
                      {formatNumber(variant.activePromotion.discountPercent, 2)}
                      %
                    </Badge>
                  )}
                </dd>
              </div>
              <Detail label="Preço" value={formatCurrency(variant.price)} />
              <Detail
                label="Disponível"
                value={formatNumber(variant.availableQuantity, decimalPlaces)}
              />
              <Detail
                label="Custo médio"
                value={formatCost(variant.averageCost)}
              />
              <Detail
                label="Último custo"
                value={formatCost(variant.lastCost)}
              />
              <Detail
                label="Margem"
                value={
                  variant.marginPercent == null
                    ? "-"
                    : formatPercentage(variant.marginPercent)
                }
              />
            </dl>
          </div>
        ))}
      </div>
      <div className="hidden overflow-x-auto rounded-lg border md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Variação</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Código de barras</TableHead>
              <TableHead>Preço</TableHead>
              <TableHead>Preço efetivo</TableHead>
              <TableHead>Custo médio</TableHead>
              <TableHead>Último custo</TableHead>
              <TableHead>Margem</TableHead>
              <TableHead>Disponível</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {variants.map((variant) => (
              <TableRow key={variant.id}>
                <TableCell className="font-medium">
                  {variant.label || "Padrão"}
                </TableCell>
                <TableCell>{variant.sku}</TableCell>
                <TableCell>{variant.barcode ?? "-"}</TableCell>
                <TableCell>{formatCurrency(variant.price)}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {formatCurrency(variant.effectivePrice)}
                    {variant.activePromotion && (
                      <Badge variant="secondary">
                        −
                        {formatNumber(
                          variant.activePromotion.discountPercent,
                          2
                        )}
                        %
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>{formatCost(variant.averageCost)}</TableCell>
                <TableCell>{formatCost(variant.lastCost)}</TableCell>
                <TableCell>
                  {variant.marginPercent == null
                    ? "-"
                    : formatPercentage(variant.marginPercent)}
                </TableCell>
                <TableCell>
                  {formatNumber(variant.availableQuantity, decimalPlaces)}
                </TableCell>
                <TableCell>
                  <Badge variant={variant.isActive ? "default" : "secondary"}>
                    {variant.isActive ? "Ativa" : "Inativa"}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}

/** Matriz variação × local. Sem orçamentos ainda, reservado é 0 e disponível = físico (RN-CE08). */
function StockTab({
  matrix,
  decimalPlaces,
  onAdjust,
  onTransfer,
  onOpenKardex,
}: {
  matrix: StockMatrixDto | null;
  decimalPlaces: number;
  onAdjust: () => void;
  onTransfer: () => void;
  onOpenKardex: () => void;
}) {
  if (!matrix) return <Skeleton className="h-32 w-full" />;
  if (matrix.locations.length === 0 || matrix.rows.length === 0) {
    return (
      <Empty className="border">
        <EmptyHeader>
          <EmptyDescription>Nenhum local ativo nesta loja.</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }
  const showStore =
    new Set(matrix.locations.map((location) => location.storeName)).size > 1;
  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-2 gap-2 sm:flex sm:justify-end">
        <Button variant="outline" size="sm" onClick={onOpenKardex}>
          <History data-icon="inline-start" />
          Movimentações
        </Button>
        <Button variant="outline" size="sm" onClick={onTransfer}>
          <ArrowRightLeft data-icon="inline-start" />
          Transferir
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onAdjust}
          className="col-span-2 sm:col-span-1"
        >
          <PackagePlus data-icon="inline-start" />
          Ajuste ou perda
        </Button>
      </div>
      {/* Celular: um card por variação, com uma linha por local. */}
      <div className="flex flex-col gap-3 md:hidden">
        {matrix.rows.map((row) => (
          <div key={row.variantId} className="rounded-xl border">
            <div className="flex items-start justify-between gap-2 p-4 pb-2">
              <div className="flex min-w-0 flex-col">
                <span className="font-semibold">
                  {row.variantLabel || "Padrão"}
                </span>
                <span className="text-xs text-muted-foreground">{row.sku}</span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-xs text-muted-foreground">Total</span>
                <span className="text-lg font-semibold tabular-nums">
                  {formatNumber(
                    row.cells.reduce((sum, cell) => sum + cell.available, 0),
                    decimalPlaces
                  )}
                </span>
              </div>
            </div>
            <div className="divide-y border-t">
              {row.cells.map((cell) => {
                const location = matrix.locations.find(
                  (item) => item.id === cell.locationId
                );
                return (
                  <div
                    key={cell.locationId}
                    className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm"
                  >
                    <div className="flex min-w-0 flex-col">
                      <span>
                        {showStore && location
                          ? `${location.storeName} · ${location.name}`
                          : location?.name}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        Mín. {formatNumber(cell.minQuantity, decimalPlaces)}
                        {cell.isBelowMin && (
                          <Badge variant="destructive">Abaixo</Badge>
                        )}
                      </span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span
                        className={`font-medium tabular-nums ${cell.available < 0 ? "text-destructive" : ""}`}
                      >
                        {formatNumber(cell.available, decimalPlaces)}
                      </span>
                      {cell.reserved !== 0 && (
                        <span className="text-xs text-muted-foreground">
                          Reservado {formatNumber(cell.reserved, decimalPlaces)}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <div className="hidden overflow-x-auto rounded-lg border md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Variação</TableHead>
              {matrix.locations.map((location) => (
                <TableHead key={location.id} className="text-right">
                  {showStore
                    ? `${location.storeName} · ${location.name}`
                    : location.name}
                </TableHead>
              ))}
              <TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {matrix.rows.map((row) => (
              <TableRow key={row.variantId}>
                <TableCell className="font-medium">
                  {row.variantLabel || "Padrão"}
                  <span className="block text-xs text-muted-foreground">
                    {row.sku}
                  </span>
                </TableCell>
                {row.cells.map((cell) => (
                  <TableCell key={cell.locationId} className="text-right">
                    <span
                      className={
                        cell.available < 0 ? "text-destructive" : undefined
                      }
                    >
                      {formatNumber(cell.available, decimalPlaces)}
                    </span>
                    {cell.reserved !== 0 && (
                      <span className="block text-xs text-muted-foreground">
                        Físico {formatNumber(cell.physical, decimalPlaces)} ·
                        Reservado {formatNumber(cell.reserved, decimalPlaces)}
                      </span>
                    )}
                    {/* Mínimo efetivo (do local ou o padrão do produto) e "abaixo" vêm prontos da API (RN-CE33). */}
                    <span className="flex items-center justify-end gap-1 text-xs text-muted-foreground">
                      Mín. {formatNumber(cell.minQuantity, decimalPlaces)}
                      {cell.isBelowMin && (
                        <Badge variant="destructive">Abaixo</Badge>
                      )}
                    </span>
                  </TableCell>
                ))}
                <TableCell className="text-right font-medium">
                  {formatNumber(
                    row.cells.reduce((sum, cell) => sum + cell.available, 0),
                    decimalPlaces
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <p className="text-xs text-muted-foreground">
        Disponível por local. Sem orçamentos em aberto, é igual ao físico.
      </p>
    </div>
  );
}

function SuppliersTab({
  suppliers,
}: {
  suppliers: ProductSupplierResponseDto[];
}) {
  if (suppliers.length === 0) {
    return (
      <Empty className="border">
        <EmptyHeader>
          <EmptyDescription>Nenhum fornecedor vinculado.</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }
  return (
    <>
      {/* Celular: um card por fornecedor. */}
      <div className="flex flex-col gap-3 md:hidden">
        {suppliers.map((supplier) => (
          <div
            key={supplier.supplierId}
            className="flex flex-col gap-3 rounded-xl border p-4"
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="min-w-0 flex-1 font-semibold">
                {supplier.supplierName}
              </span>
              {supplier.isPreferred && <Badge>Preferido</Badge>}
              {!supplier.supplierIsActive && (
                <Badge variant="secondary">Inativo</Badge>
              )}
            </div>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
              <Detail label="Prazo" value={`${supplier.leadTimeDays} dias`} />
              <Detail
                label="Último custo"
                value={
                  supplier.lastCost == null
                    ? "-"
                    : formatCurrency(supplier.lastCost)
                }
              />
              <Detail
                label="Pedido mínimo"
                value={supplier.minOrderQty?.toString() ?? "-"}
              />
              <Detail
                label="Múltiplo"
                value={supplier.orderMultiple?.toString() ?? "-"}
              />
              <Detail
                label="Última compra"
                value={
                  supplier.lastPurchaseOn
                    ? formatDateOnly(supplier.lastPurchaseOn)
                    : "-"
                }
              />
            </dl>
          </div>
        ))}
      </div>
      <div className="hidden overflow-x-auto rounded-lg border md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fornecedor</TableHead>
              <TableHead>Preferido</TableHead>
              <TableHead>Prazo</TableHead>
              <TableHead>Pedido mínimo</TableHead>
              <TableHead>Múltiplo</TableHead>
              <TableHead>Último custo</TableHead>
              <TableHead>Última compra</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {suppliers.map((supplier) => (
              <TableRow key={supplier.supplierId}>
                <TableCell className="font-medium">
                  {supplier.supplierName}
                  {!supplier.supplierIsActive && (
                    <Badge variant="secondary" className="ml-2">
                      Inativo
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  {supplier.isPreferred ? <Badge>Preferido</Badge> : "-"}
                </TableCell>
                <TableCell>{supplier.leadTimeDays} dias</TableCell>
                <TableCell>{supplier.minOrderQty ?? "-"}</TableCell>
                <TableCell>{supplier.orderMultiple ?? "-"}</TableCell>
                <TableCell>
                  {supplier.lastCost == null
                    ? "-"
                    : formatCurrency(supplier.lastCost)}
                </TableCell>
                <TableCell>
                  {supplier.lastPurchaseOn
                    ? formatDateOnly(supplier.lastPurchaseOn)
                    : "-"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}

function PricesTab({ history }: { history: PriceHistoryResponseDto[] }) {
  return (
    <>
      {/* Celular: uma linha por preço, do mais novo ao mais antigo, como a API manda. */}
      <div className="divide-y rounded-xl border md:hidden">
        {history.map((entry) => (
          <div
            key={entry.id}
            className="flex items-center justify-between gap-3 p-4"
          >
            <div className="flex min-w-0 flex-col gap-0.5">
              <span className="flex flex-wrap items-center gap-2 font-medium">
                {entry.variantLabel || entry.sku || "Padrão"}
                {entry.variantRemoved && (
                  <Badge variant="secondary">Removida</Badge>
                )}
                {!entry.validTo && <Badge>Vigente</Badge>}
              </span>
              <span className="text-xs text-muted-foreground">
                {formatDateOnly(entry.validFrom)}
                {entry.validTo
                  ? ` a ${formatDateOnly(entry.validTo)}`
                  : ""} · {entry.changedByName}
              </span>
            </div>
            <span className="font-semibold tabular-nums">
              {formatCurrency(entry.price)}
            </span>
          </div>
        ))}
      </div>
      <div className="hidden overflow-x-auto rounded-lg border md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Variação</TableHead>
              <TableHead>Preço</TableHead>
              <TableHead>De</TableHead>
              <TableHead>Até</TableHead>
              <TableHead>Quem alterou</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {history.map((entry) => (
              <TableRow key={entry.id}>
                <TableCell className="font-medium">
                  {entry.variantLabel || entry.sku || "Padrão"}
                  {entry.variantRemoved && (
                    <Badge variant="secondary" className="ml-2">
                      Removida
                    </Badge>
                  )}
                </TableCell>
                <TableCell>{formatCurrency(entry.price)}</TableCell>
                <TableCell>{formatDateOnly(entry.validFrom)}</TableCell>
                <TableCell>
                  {entry.validTo ? formatDateOnly(entry.validTo) : "Vigente"}
                </TableCell>
                <TableCell>{entry.changedByName}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}

/** T3: só o que já tem dado. Lotes só para o produto que controla lote (F1.7); movimentações e previsão entram nas fatias deles. */
function ViewProduct() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const {
    getProduct,
    getVariants,
    getStock,
    getLots,
    getLotOptions,
    getSuppliers,
    getPriceHistory,
    createManualMovement,
  } = useProducts();
  const { storeId } = useCurrentStore();
  const [stock, setStock] = useState<StockMatrixDto | null>(null);
  const [lots, setLots] = useState<LotBalanceDto[] | null>(null);
  const [product, setProduct] = useState<ProductResponseDto | null>(null);
  const [variants, setVariants] = useState<ProductVariantResponseDto[]>([]);
  const [suppliers, setSuppliers] = useState<ProductSupplierResponseDto[]>([]);
  const [history, setHistory] = useState<PriceHistoryResponseDto[]>([]);
  const [isAdjusting, setIsAdjusting] = useState(false);
  const [isTransferring, setIsTransferring] = useState(false);
  // Lote que abriu o ajuste ("Dar baixa"); nulo = ajuste livre pela aba Estoque.
  const [writeOffLot, setWriteOffLot] = useState<LotBalanceDto | null>(null);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      getProduct(id),
      getVariants(id),
      getSuppliers(id),
      getPriceHistory(id),
    ])
      .then(
        ([loadedProduct, loadedVariants, loadedSuppliers, loadedHistory]) => {
          setProduct(loadedProduct);
          setVariants(loadedVariants);
          setSuppliers(loadedSuppliers);
          setHistory(loadedHistory);
        }
      )
      .catch((error) => handleError(error, "Erro ao abrir o produto"));
  }, [getProduct, getVariants, getSuppliers, getPriceHistory, id]);

  // A matriz segue a loja do topo; "Todas as lojas" mostra todos os locais ativos.
  const loadStock = useCallback(() => {
    if (!id) return;
    getStock(id, storeId)
      .then(setStock)
      .catch((error) => handleError(error, "Erro ao carregar o estoque"));
  }, [getStock, id, storeId]);

  // Aba Lotes (F1.7): segue a loja do topo, como a matriz; só para o produto que controla lote.
  const loadLots = useCallback(() => {
    if (!id || !product?.tracksLots) return;
    getLots(id, storeId)
      .then(setLots)
      .catch((error) => handleError(error, "Erro ao carregar os lotes"));
  }, [getLots, id, storeId, product?.tracksLots]);

  useEffect(() => {
    loadLots();
  }, [loadLots]);

  useEffect(() => {
    loadStock();
  }, [loadStock]);

  // Depois do lançamento ou da promoção: saldo na matriz; disponível, custo médio e preço efetivo no cabeçalho e nas variações.
  const reloadAfterMovement = useCallback(() => {
    if (!id) return;
    loadStock();
    loadLots();
    Promise.all([getProduct(id), getVariants(id)])
      .then(([loadedProduct, loadedVariants]) => {
        setProduct(loadedProduct);
        setVariants(loadedVariants);
      })
      .catch((error) => handleError(error, "Erro ao atualizar o produto"));
  }, [getProduct, getVariants, id, loadStock, loadLots]);

  if (!product) return <Skeleton className="h-96 w-full" />;

  const margin = marginRange(variants);
  const marginClass =
    margin == null
      ? "text-muted-foreground"
      : margin.min < 0
        ? "text-destructive"
        : "text-success";

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 flex-col gap-2">
            <CardTitle className="wrap-anywhere">{product.name}</CardTitle>
            <div className="flex flex-wrap gap-1.5">
              <Badge variant="outline">
                {PRODUCT_TYPE_LABELS[product.productType]}
              </Badge>
              <Badge
                variant={
                  product.lifecycle === TLifecycle.Active
                    ? "default"
                    : "secondary"
                }
              >
                {LIFECYCLE_LABELS[product.lifecycle]}
              </Badge>
              {!product.isActive && (
                <Badge variant="destructive">Inativo</Badge>
              )}
            </div>
          </div>
          {product.isActive && (
            <Button
              variant="outline"
              onClick={() => navigate(`/products/${product.id}/edit`)}
            >
              <Pencil data-icon="inline-start" />
              Editar
            </Button>
          )}
        </CardHeader>
        <CardContent className="flex flex-col gap-6 md:flex-row">
          <div className="flex items-center gap-4 md:block">
            <div className="flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-3xl border bg-muted/50 md:size-36">
              {product.imageUrl ? (
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="size-full object-cover"
                />
              ) : (
                <ImageOff
                  aria-hidden
                  className="size-8 text-muted-foreground"
                />
              )}
            </div>
            {/* Celular: o que mais se consulta fica ao lado da foto. */}
            <div className="flex min-w-0 flex-col gap-1 md:hidden">
              <span className="text-xs text-muted-foreground">
                Preço efetivo
              </span>
              <span className="text-2xl font-semibold text-primary tabular-nums">
                {formatPriceRange(
                  product.minEffectivePrice,
                  product.maxEffectivePrice
                )}
              </span>
              <span className="text-xs text-muted-foreground">
                <span className={`font-medium ${marginClass}`}>
                  {margin ? `Margem ${margin.text}` : "Sem custo médio"}
                </span>
                {" · "}
                {formatNumber(
                  product.availableQuantity,
                  product.decimalPlaces
                )}{" "}
                disponíveis
              </span>
            </div>
          </div>
          <dl className="grid min-w-0 flex-1 grid-cols-2 gap-x-4 gap-y-3 sm:gap-4 lg:grid-cols-3">
            <Detail label="Marca" value={product.brand ?? "-"} />
            <Detail
              label="Categorias"
              value={product.categories.map((c) => c.path).join(", ") || "-"}
              wide
            />
            <Detail label="Coleção" value={product.collection?.label ?? "-"} />
            <Detail
              label="Eventos"
              value={product.events.map((e) => e.label).join(", ") || "-"}
              wide
            />
            <Detail
              label="Unidade"
              value={SALE_UNIT_LABELS[product.saleUnit]}
            />
            <Detail
              label="Preço efetivo"
              value={`${formatPriceRange(
                product.minEffectivePrice,
                product.maxEffectivePrice
              )}${product.activePromotionPercent != null ? ` (promoção de até ${formatNumber(product.activePromotionPercent, 2)}%)` : ""}`}
            />
            <Detail
              label="Custo médio"
              value={formatCostRange(
                product.minAverageCost,
                product.maxAverageCost
              )}
            />
            <Detail
              label="Margem de lucro"
              value={margin?.text ?? "-"}
              valueClassName={`font-medium ${marginClass}`}
            />
            <Detail
              label="Disponível (todas as lojas)"
              value={formatNumber(
                product.availableQuantity,
                product.decimalPlaces
              )}
            />
            <Detail
              label="Lançamento"
              value={
                product.launchedOn ? formatDateOnly(product.launchedOn) : "-"
              }
            />
            <Detail
              wide
              label="Lote e validade"
              value={
                product.tracksLots
                  ? `Controla lote, ${product.shelfLifeDays} dias de vida útil`
                  : "Não controla"
              }
            />
            <Detail
              label="Estoque negativo"
              value={product.allowsNegative ? "Permite" : "Não permite"}
            />
            {product.description && (
              <div className="col-span-2 lg:col-span-3">
                <Detail label="Descrição" value={product.description} />
              </div>
            )}
          </dl>
        </CardContent>
      </Card>

      <EntityTabsLayout
        title={product.hasVariants ? "Grade" : "Código e preço"}
        defaultTab="variants"
        onBack={() => navigate("/products")}
        tabs={[
          {
            value: "variants",
            label: "Variações",
            content: (
              <VariantsTab
                variants={variants}
                decimalPlaces={product.decimalPlaces}
              />
            ),
          },
          {
            value: "stock",
            label: "Estoque",
            content: (
              <StockTab
                matrix={stock}
                decimalPlaces={product.decimalPlaces}
                onAdjust={() => {
                  setWriteOffLot(null);
                  setIsAdjusting(true);
                }}
                onTransfer={() => setIsTransferring(true)}
                onOpenKardex={() =>
                  navigate(`/stock-movements?productId=${product.id}`)
                }
              />
            ),
          },
          ...(product.tracksLots
            ? [
                {
                  value: "lots",
                  label: "Lotes",
                  content: (
                    <ProductLotsTab
                      lots={lots}
                      decimalPlaces={product.decimalPlaces}
                      hasVariants={product.hasVariants}
                      onWriteOff={(lot) => {
                        setWriteOffLot(lot);
                        setIsAdjusting(true);
                      }}
                    />
                  ),
                },
              ]
            : []),
          {
            value: "suppliers",
            label: "Fornecedores",
            content: <SuppliersTab suppliers={suppliers} />,
          },
          {
            value: "prices",
            label: "Preços",
            content: <PricesTab history={history} />,
          },
          {
            value: "promotions",
            label: "Promoções",
            content: (
              <ProductPromotionsTab
                product={product}
                onChanged={reloadAfterMovement}
              />
            ),
          },
          {
            value: "forecast",
            label: "Previsão",
            content: <ProductForecastTab productId={product.id} />,
          },
        ]}
      />
      {stock && (
        <StockTransferDialog
          open={isTransferring}
          onOpenChange={setIsTransferring}
          matrix={stock}
          decimalPlaces={product.decimalPlaces}
          saleUnit={SALE_UNIT_SHORT[product.saleUnit]}
          onDone={reloadAfterMovement}
        />
      )}
      {stock && (
        <ManualMovementDrawer
          open={isAdjusting}
          onOpenChange={setIsAdjusting}
          matrix={stock}
          decimalPlaces={product.decimalPlaces}
          tracksLots={product.tracksLots}
          loadLotOptions={getLotOptions}
          onSubmit={createManualMovement}
          onSuccess={reloadAfterMovement}
          {...(writeOffLot && {
            // Vencido sai como "Vencido"; os demais como perda por ajuste, que o usuário pode trocar.
            title: `Baixa do lote ${writeOffLot.code}`,
            description: `${writeOffLot.locationName} · saldo ${formatNumber(writeOffLot.quantity, product.decimalPlaces)}. A saída fica no livro-razão com o motivo escolhido.`,
            initialValues: {
              variantId: writeOffLot.variantId,
              locationId: writeOffLot.locationId,
              lotId: writeOffLot.lotId,
              reason: writeOffLot.isExpired
                ? TMovementReason.Expired
                : TMovementReason.Adjustment,
              type: TMovementType.Out,
              quantity: formatNumber(
                writeOffLot.quantity,
                product.decimalPlaces
              ),
              note: writeOffLot.isExpired
                ? `Descarte do lote ${writeOffLot.code} vencido`
                : "",
            },
          })}
        />
      )}
    </div>
  );
}

export default function ViewProductPageWrapper() {
  return (
    <ProductsProvider>
      <ViewProduct />
    </ProductsProvider>
  );
}
