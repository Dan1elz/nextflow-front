import { useState, useCallback, type ReactNode } from "react";
import type { IPaginationInfo, IIndexParams } from "@/interfaces/api.interface";
import { useAuth } from "@/hooks/use-auth";
import type { IProduct } from "@/interfaces/product.interface";
import { ProductsContext } from "@/contexts/products.context";
import { productService } from "@/services/product.service";

export function ProductsProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<IProduct[]>([]);
  const [pagination, setPagination] = useState<IPaginationInfo | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<IProduct | null>(null);
  const { token } = useAuth();

  const searchProducts = useCallback(
    async (query?: IIndexParams) => {
      const page = query?.page ?? 1;
      const perPage = query?.perPage ?? 10;

      const response = await productService.getAll(query, token ?? undefined);
      setProducts(response.data || []);
      setPagination({
        currentPage: page,
        lastPage: Math.ceil(response.totalItems / perPage) || 1,
        total: response.totalItems,
        perPage,
      });
    },
    [token]
  );

  const searchProductsForOptions = useCallback(
    async (
      query?: IIndexParams
    ): Promise<{ data: IProduct[]; totalItems: number }> => {
      const response = await productService.getAll(query, token ?? undefined);
      return {
        data: response.data || [],
        totalItems: response.totalItems,
      };
    },
    [token]
  );

  const selectProduct = useCallback(
    async (id: string): Promise<void> => {
      const data = await productService.getById(id, token ?? undefined);
      setSelectedProduct(data);
    },
    [token]
  );

  const getProductById = useCallback(
    async (id: string): Promise<IProduct> => {
      return productService.getById(id, token ?? undefined);
    },
    [token]
  );

  const createProduct = useCallback(
    async (product: IProduct): Promise<IProduct> => {
      const data = await productService.create(product, token ?? undefined);
      return data;
    },
    [token]
  );

  const updateProduct = useCallback(
    async (id: string, product: IProduct): Promise<IProduct> => {
      const data = await productService.update(id, product, token ?? undefined);
      return data;
    },
    [token]
  );

  const deleteProduct = useCallback(
    async (id: string): Promise<void> => {
      await productService.delete(id, token ?? undefined);
    },
    [token]
  );

  return (
    <ProductsContext.Provider
      value={{
        products,
        pagination,
        selectedProduct,
        searchProducts,
        searchProductsForOptions,
        selectProduct,
        getProductById,
        createProduct,
        updateProduct,
        deleteProduct,
      }}
    >
      {children}
    </ProductsContext.Provider>
  );
}
