import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ImageOff, Pencil } from "lucide-react";

import { EntityTabsLayout } from "@/components/layouts/EntityTabsLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useProducts } from "@/hooks/use-products";
import type {
  ProductResponseDto,
  ProductVariantResponseDto,
} from "@/interfaces/product.interface";
import { ProductsProvider } from "@/providers/products.provider";
import {
  LIFECYCLE_LABELS,
  PRODUCT_TYPE_LABELS,
  SALE_UNIT_LABELS,
  TLifecycle,
} from "@/types/enums";
import { formatCurrency, formatDateOnly } from "@/utils/format.helpers";
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

function VariantsTab({ variants }: { variants: ProductVariantResponseDto[] }) {
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
              <TableCell>{formatCurrency(variant.effectivePrice)}</TableCell>
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

/** T3: só o que já tem dado. Estoque, lotes, fornecedores, preços, previsão e promoções entram nas fatias deles. */
function ViewProduct() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { getProduct, getVariants } = useProducts();
  const [product, setProduct] = useState<ProductResponseDto | null>(null);
  const [variants, setVariants] = useState<ProductVariantResponseDto[]>([]);

  useEffect(() => {
    if (!id) return;
    Promise.all([getProduct(id), getVariants(id)])
      .then(([loadedProduct, loadedVariants]) => {
        setProduct(loadedProduct);
        setVariants(loadedVariants);
      })
      .catch((error) => handleError(error, "Erro ao abrir o produto"));
  }, [getProduct, getVariants, id]);

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
              label="Unidade"
              value={SALE_UNIT_LABELS[product.saleUnit]}
            />
            <Detail
              label="Preço efetivo"
              value={formatPriceRange(
                product.minEffectivePrice,
                product.maxEffectivePrice
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
            content: <VariantsTab variants={variants} />,
          },
        ]}
      />
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
