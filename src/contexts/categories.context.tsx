import { createContext } from "react";

import type { ICategory } from "@/interfaces/category.interface";
import type { IIndexParams, IPaginationInfo } from "@/interfaces/api.interface";

export type CategoriesContextType = {
  categories: ICategory[];
  selectedCategory: ICategory | null;
  pagination: IPaginationInfo | null;
  searchCategories: (query?: IIndexParams) => Promise<void>;
  searchCategoriesForOptions: (
    query?: IIndexParams
  ) => Promise<{ data: ICategory[]; totalItems: number }>;
  selectCategory: (id: string) => Promise<void>;
  getCategoryById: (id: string) => Promise<ICategory>;
  createCategory: (category: ICategory) => Promise<ICategory>;
  updateCategory: (id: string, category: ICategory) => Promise<ICategory>;
  deleteCategory: (id: string) => Promise<void>;
};

export const CategoriesContext = createContext<CategoriesContextType | null>(
  null
);
