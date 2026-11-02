import { createContext } from "react";

import type { IIndexParams, IPaginationInfo } from "@/interfaces/api.interface";
import type {
  ProductFormDto,
  PriceHistoryResponseDto,
  ProductListItemDto,
  ProductRequestDto,
  ProductResponseDto,
  ProductSupplierResponseDto,
  ProductVariantResponseDto,
  StockMatrixDto,
} from "@/interfaces/product.interface";
import type { TLifecycle } from "@/types/enums";

export type ProductsContextType = {
  products: ProductListItemDto[];
  pagination: IPaginationInfo | null;
  searchProducts: (query?: IIndexParams) => Promise<void>;
  getProduct: (id: string) => Promise<ProductResponseDto>;
  getVariants: (id: string) => Promise<ProductVariantResponseDto[]>;
  getStock: (id: string, storeId?: string | null) => Promise<StockMatrixDto>;
  getSuppliers: (id: string) => Promise<ProductSupplierResponseDto[]>;
  getPriceHistory: (id: string) => Promise<PriceHistoryResponseDto[]>;
  getForm: (id?: string) => Promise<ProductFormDto>;
  createProduct: (dto: ProductRequestDto) => Promise<ProductResponseDto>;
  updateProduct: (
    id: string,
    dto: ProductRequestDto
  ) => Promise<ProductResponseDto>;
  deleteProduct: (id: string) => Promise<void>;
  reactivateProduct: (id: string) => Promise<void>;
  changeLifecycle: (id: string, lifecycle: TLifecycle) => Promise<void>;
  uploadImage: (id: string, image: File) => Promise<void>;
  removeImage: (id: string) => Promise<void>;
};

export const ProductsContext = createContext<ProductsContextType | null>(null);
