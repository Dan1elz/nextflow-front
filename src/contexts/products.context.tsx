import { createContext } from "react";
import type { IProduct } from "@/interfaces/product.interface";
import type { IIndexParams, IPaginationInfo } from "@/interfaces/api.interface";

export type ProductsContextType = {
  products: IProduct[];
  selectedProduct: IProduct | null;
  pagination: IPaginationInfo | null;
  searchProducts: (query?: IIndexParams) => Promise<void>;
  searchProductsForOptions: (
    query?: IIndexParams
  ) => Promise<{ data: IProduct[]; totalItems: number }>;
  selectProduct: (id: string) => Promise<void>;
  getProductById: (id: string) => Promise<IProduct>;
  createProduct: (product: IProduct) => Promise<IProduct>;
  updateProduct: (id: string, product: IProduct) => Promise<IProduct>;
  deleteProduct: (id: string) => Promise<void>;
};

export const ProductsContext = createContext<ProductsContextType | null>(null);
