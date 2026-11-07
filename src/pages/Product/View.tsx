import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { History, ImageOff, PackagePlus, Pencil } from "lucide-react";

import { ManualMovementDrawer } from "@/components/app/manual-movement-drawer";
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
  StockMatrixDto,
} from "@/interfaces/product.interface";
import { ProductsProvider } from "@/providers/products.provider";
import {
  LIFECYCLE_LABELS,
  PRODUCT_TYPE_LABELS,
  SALE_UNIT_LABELS,
  TLifecycle,
} from "@/types/enums";
import {
  formatCurrency,
  formatDateOnly,
  formatNumber,
  formatPercentage,
} from "@/utils/format.helpers";
import { formatPriceRange } from "@/utils/product.helpers";
import { handleError } from "@/utils/toast.helpers";

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm wrap-anywhere">{value}</dd>
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

function VariantsTab({
  variants,
  decimalPlaces,
}: {
  variants: ProductVariantResponseDto[];
  decimalPlaces: number;
}) {
  return (
    <div className="overflow-x-auto rounded-lg border">
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
                      {formatNumber(variant.activePromotion.discountPercent, 2)}
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
  );
}

/** Matriz variação × local. Sem orçamentos ainda, reservado é 0 e disponível = físico (RN-CE08). */
function StockTab({
  matrix,
  decimalPlaces,
  onAdjust,
  onOpenKardex,
}: {
  matrix: StockMatrixDto | null;
  decimalPlaces: number;
  onAdjust: () => void;
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
      <div className="flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={onOpenKardex}>
          <History data-icon="inline-start" />
          Movimentações
        </Button>
        <Button variant="outline" size="sm" onClick={onAdjust}>
          <PackagePlus data-icon="inline-start" />
          Ajuste ou perda
        </Button>
      </div>
      <div className="overflow-x-auto rounded-lg border">
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
    <div className="overflow-x-auto rounded-lg border">
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
  );
}

function PricesTab({ history }: { history: PriceHistoryResponseDto[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border">
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
  );
}

/** T3: só o que já tem dado. Lotes, movimentações e previsão entram nas fatias deles. */
function ViewProduct() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const {
    getProduct,
    getVariants,
    getStock,
    getSuppliers,
    getPriceHistory,
    createManualMovement,
  } = useProducts();
  const { storeId } = useCurrentStore();
  const [stock, setStock] = useState<StockMatrixDto | null>(null);
  const [product, setProduct] = useState<ProductResponseDto | null>(null);
  const [variants, setVariants] = useState<ProductVariantResponseDto[]>([]);
  const [suppliers, setSuppliers] = useState<ProductSupplierResponseDto[]>([]);
  const [history, setHistory] = useState<PriceHistoryResponseDto[]>([]);
  const [isAdjusting, setIsAdjusting] = useState(false);

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

  useEffect(() => {
    loadStock();
  }, [loadStock]);

  // Depois do lançamento ou da promoção: saldo na matriz; disponível, custo médio e preço efetivo no cabeçalho e nas variações.
  const reloadAfterMovement = useCallback(() => {
    if (!id) return;
    loadStock();
    Promise.all([getProduct(id), getVariants(id)])
      .then(([loadedProduct, loadedVariants]) => {
        setProduct(loadedProduct);
        setVariants(loadedVariants);
      })
      .catch((error) => handleError(error, "Erro ao atualizar o produto"));
  }, [getProduct, getVariants, id, loadStock]);

  if (!product) return <Skeleton className="h-96 w-full" />;

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
          <div className="flex size-36 shrink-0 items-center justify-center overflow-hidden rounded-3xl border bg-muted/50">
            {product.imageUrl ? (
              <img
                src={product.imageUrl}
                alt={product.name}
                className="size-full object-cover"
              />
            ) : (
              <ImageOff aria-hidden className="size-8 text-muted-foreground" />
            )}
          </div>
          <dl className="grid min-w-0 flex-1 grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Detail label="Marca" value={product.brand ?? "-"} />
            <Detail
              label="Categorias"
              value={product.categories.map((c) => c.path).join(", ") || "-"}
            />
            <Detail label="Coleção" value={product.collection?.label ?? "-"} />
            <Detail
              label="Eventos"
              value={product.events.map((e) => e.label).join(", ") || "-"}
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
              <div className="sm:col-span-2 lg:col-span-3">
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
                onAdjust={() => setIsAdjusting(true)}
                onOpenKardex={() =>
                  navigate(`/stock-movements?productId=${product.id}`)
                }
              />
            ),
          },
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
        ]}
      />
      {stock && (
        <ManualMovementDrawer
          open={isAdjusting}
          onOpenChange={setIsAdjusting}
          matrix={stock}
          decimalPlaces={product.decimalPlaces}
          onSubmit={createManualMovement}
          onSuccess={reloadAfterMovement}
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
