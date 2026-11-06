import { useCallback, useState, type ReactNode } from "react";

import { StockMovementsContext } from "@/contexts/stock-movements.context";
import { useAuth } from "@/hooks/use-auth";
import type { IIndexParams, IPaginationInfo } from "@/interfaces/api.interface";
import type { StockMovementListItemDto } from "@/interfaces/stock-movement.interface";
import { productService } from "@/services/product.service";
import { stockMovementService } from "@/services/stock-movement.service";

export function StockMovementsProvider({ children }: { children: ReactNode }) {
  const [stockMovements, setStockMovements] = useState<
    StockMovementListItemDto[]
  >([]);
  const [pagination, setPagination] = useState<IPaginationInfo | null>(null);
  const { token } = useAuth();
  const auth = token ?? undefined;

  const searchStockMovements = useCallback(
    async (query?: IIndexParams) => {
      const page = query?.page ?? 1;
      const perPage = query?.perPage ?? 20;
      const response = await stockMovementService.getAll(query, auth);
      setStockMovements(response.items || []);
      setPagination({
        currentPage: page,
        lastPage: Math.ceil(response.total / perPage) || 1,
        total: response.total,
        perPage,
      });
    },
    [auth]
  );

  const getLocationOptions = useCallback(
    (search?: string, storeId?: string | null) =>
      stockMovementService.locationOptions(search, storeId, auth),
    [auth]
  );

  const searchProductOptions = useCallback(
    async (search: string) => {
      const page = await productService.getAll(
        { page: 1, perPage: 20, filters: search ? { search } : {} },
        auth
      );
      return page.items.map((product) => ({
        value: product.id,
        label: product.name,
      }));
    },
    [auth]
  );

  const getVariantOptions = useCallback(
    async (productId: string) => {
      const variants = await productService.variants(productId, auth);
      return variants.map((variant) => ({
        value: variant.id,
        label: variant.label
          ? `${variant.label} (${variant.sku})`
          : variant.sku,
      }));
    },
    [auth]
  );

  return (
    <StockMovementsContext.Provider
      value={{
        stockMovements,
        pagination,
        searchStockMovements,
        getLocationOptions,
        searchProductOptions,
        getVariantOptions,
      }}
    >
      {children}
    </StockMovementsContext.Provider>
  );
}
