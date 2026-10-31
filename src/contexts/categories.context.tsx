import { createContext } from "react";

import type { IIndexParams, IOption } from "@/interfaces/api.interface";
import type {
  CategoryNodeDto,
  CategoryRequestDto,
  ICategory,
} from "@/interfaces/category.interface";

export type CategoriesContextType = {
  tree: CategoryNodeDto[];
  loading: boolean;
  loadTree: () => Promise<void>;
  searchParentOptions: (search?: string) => Promise<IOption[]>;
  createCategory: (dto: CategoryRequestDto) => Promise<void>;
  updateCategory: (id: string, dto: CategoryRequestDto) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  reactivateCategory: (id: string) => Promise<void>;
  /** Legado: combos das telas antigas de produto e pedido de compra, até a F1.3. */
  searchCategoriesForOptions: (
    query?: IIndexParams
  ) => Promise<{ data: ICategory[]; totalItems: number }>;
  getCategoryById: (id: string) => Promise<ICategory>;
};

export const CategoriesContext = createContext<CategoriesContextType | null>(
  null
);
