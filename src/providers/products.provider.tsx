import { useCallback, useState, type ReactNode } from "react";

import { ProductsContext } from "@/contexts/products.context";
import { useAuth } from "@/hooks/use-auth";
import type { IIndexParams, IPaginationInfo } from "@/interfaces/api.interface";
import type { ManualMovementDto } from "@/interfaces/manual-movement.interface";
import type {
  ProductListItemDto,
  ProductRequestDto,
} from "@/interfaces/product.interface";
import { manualMovementService } from "@/services/manual-movement.service";
import { productService } from "@/services/product.service";
import type { TLifecycle } from "@/types/enums";

export function ProductsProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<ProductListItemDto[]>([]);
  const [pagination, setPagination] = useState<IPaginationInfo | null>(null);
  const { token } = useAuth();
  const auth = token ?? undefined;

  const searchProducts = useCallback(
    async (query?: IIndexParams) => {
      const page = query?.page ?? 1;
      const perPage = query?.perPage ?? 10;
      const response = await productService.getAll(query, auth);
      setProducts(response.items || []);
      setPagination({
        currentPage: page,
        lastPage: Math.ceil(response.total / perPage) || 1,
        total: response.total,
        perPage,
      });
    },
    [auth]
  );

  const getProduct = useCallback(
    (id: string) => productService.getById(id, auth),
    [auth]
  );

  const getVariants = useCallback(
    (id: string) => productService.variants(id, auth),
    [auth]
  );

  const getStock = useCallback(
    (id: string, storeId?: string | null) =>
      productService.stock(id, storeId, auth),
    [auth]
  );

  const getLots = useCallback(
    (id: string, storeId?: string | null) =>
      productService.lots(id, storeId, auth),
    [auth]
  );

  const getLotOptions = useCallback(
    (variantId: string, locationId: string) =>
      manualMovementService.lotOptions(variantId, locationId, auth),
    [auth]
  );

  const getSuppliers = useCallback(
    (id: string) => productService.suppliers(id, auth),
    [auth]
  );

  const getPriceHistory = useCallback(
    (id: string) => productService.priceHistory(id, auth),
    [auth]
  );

  const getForm = useCallback(
    (id?: string) => productService.form(id, auth),
    [auth]
  );

  const createProduct = useCallback(
    (dto: ProductRequestDto) => productService.create(dto, auth),
    [auth]
  );

  const updateProduct = useCallback(
    (id: string, dto: ProductRequestDto) =>
      productService.update(id, dto, auth),
    [auth]
  );

  const deleteProduct = useCallback(
    (id: string) => productService.delete(id, auth),
    [auth]
  );

  const reactivateProduct = useCallback(
    (id: string) => productService.reactivate(id, auth),
    [auth]
  );

  const changeLifecycle = useCallback(
    (id: string, lifecycle: TLifecycle) =>
      productService.changeLifecycle(id, lifecycle, auth),
    [auth]
  );

  const uploadImage = useCallback(
    async (id: string, image: File) => {
      await productService.uploadImage(id, image, auth);
    },
    [auth]
  );

  const removeImage = useCallback(
    (id: string) => productService.removeImage(id, auth),
    [auth]
  );

  const createManualMovement = useCallback(
    (dto: ManualMovementDto) => manualMovementService.create(dto, auth),
    [auth]
  );

  return (
    <ProductsContext.Provider
      value={{
        products,
        pagination,
        searchProducts,
        getProduct,
        getVariants,
        getStock,
        getLots,
        getLotOptions,
        getSuppliers,
        getPriceHistory,
        getForm,
        createProduct,
        updateProduct,
        deleteProduct,
        reactivateProduct,
        changeLifecycle,
        uploadImage,
        removeImage,
        createManualMovement,
      }}
    >
      {children}
    </ProductsContext.Provider>
  );
}
