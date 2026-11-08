import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ImageOff } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import type { ProductListItemDto } from "@/interfaces/product.interface";
import { productService } from "@/services/product.service";
import { formatNumber } from "@/utils/format.helpers";
import { formatPriceRange } from "@/utils/product.helpers";
import { handleError } from "@/utils/toast.helpers";

const LIMIT = 50;

/**
 * Produtos ativos ligados a uma coleção ou a um evento (filtro da listagem de produtos), para os dialogs de visualizar.
 * Cada linha abre o produto. Preço efetivo e disponível vêm prontos da API.
 */
export function LinkedProductsList({
  filters,
  emptyText,
}: {
  filters: Record<string, string>;
  emptyText: string;
}) {
  const { token } = useAuth();
  const navigate = useNavigate();
  const key = JSON.stringify(filters);
  const [loaded, setLoaded] = useState<{
    key: string;
    items: ProductListItemDto[];
    total: number;
  } | null>(null);

  useEffect(() => {
    let ignore = false;
    productService
      .getAll(
        {
          page: 1,
          perPage: LIMIT,
          filters: { ...JSON.parse(key), isActive: "true" },
        },
        token ?? undefined
      )
      .then(
        (page) =>
          !ignore && setLoaded({ key, items: page.items, total: page.total })
      )
      .catch((error) => {
        if (ignore) return;
        setLoaded({ key, items: [], total: 0 });
        handleError(error, "Erro ao buscar os produtos");
      });
    return () => {
      ignore = true;
    };
  }, [key, token]);

  if (loaded?.key !== key) return <Skeleton className="h-24 w-full" />;
  if (loaded.items.length === 0)
    return <p className="text-sm text-muted-foreground">{emptyText}</p>;

  return (
    <div className="flex flex-col gap-2">
      <div className="divide-y rounded-xl border">
        {loaded.items.map((product) => (
          <button
            key={product.id}
            type="button"
            onClick={() => navigate(`/products/${product.id}/view`)}
            className="flex w-full items-center gap-3 p-3 text-left transition-colors hover:bg-muted"
          >
            <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted">
              {product.imageUrl ? (
                <img
                  src={product.imageUrl}
                  alt=""
                  className="size-full object-cover"
                />
              ) : (
                <ImageOff
                  aria-hidden
                  className="size-4 text-muted-foreground"
                />
              )}
            </div>
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-sm font-medium">
                {product.name}
              </span>
              <span className="text-xs text-muted-foreground">
                {formatNumber(product.availableQuantity, product.decimalPlaces)}{" "}
                disponíveis
              </span>
            </div>
            <span className="text-sm font-semibold tabular-nums">
              {formatPriceRange(
                product.minEffectivePrice,
                product.maxEffectivePrice
              )}
            </span>
          </button>
        ))}
      </div>
      {loaded.total > loaded.items.length && (
        <span className="text-xs text-muted-foreground">
          Mostrando {loaded.items.length} de {loaded.total}.
        </span>
      )}
    </div>
  );
}
