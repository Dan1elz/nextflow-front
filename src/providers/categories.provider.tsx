import { useState, useCallback, type ReactNode } from "react";

import type { IPaginationInfo, IIndexParams } from "@/interfaces/api.interface";
import { useAuth } from "@/hooks/use-auth";
import type { ICategory } from "@/interfaces/category.interface"; 
import { categoryService } from "@/services/category.service";
import { CategoriesContext } from "@/contexts/categories.context";

export function CategoriesProvider({ children }: { children: ReactNode }) {
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [pagination, setPagination] = useState<IPaginationInfo | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<ICategory | null>(null);
  const { token } = useAuth();

  const searchCategories = useCallback(
    async (query?: IIndexParams) => {
      const page = query?.page ?? 1;
      const perPage = query?.perPage ?? 10;

      const response = await categoryService.getAll(query, token ?? undefined);
      setCategories(response.data || []);

      setPagination({
        currentPage: page,
        lastPage: Math.ceil(response.totalItems / perPage) || 1,
        total: response.totalItems,
        perPage,
      });
    },
    [token]
  );

  const searchCategoriesForOptions = useCallback(
    async (
      query?: IIndexParams
    ): Promise<{ data: ICategory[]; totalItems: number }> => {
      const response = await categoryService.getAll(query, token ?? undefined);
      return {
        data: response.data || [],
        totalItems: response.totalItems,
      };
    },
    [token]
  );

  const selectCategory = useCallback(
    async (id: string): Promise<void> => {
      const data = await categoryService.getById(id, token ?? undefined);
      setSelectedCategory(data);
    },
    [token]
  );

  const getCategoryById = useCallback(
    async (id: string): Promise<ICategory> => {
      return await categoryService.getById(id, token ?? undefined);
    },
    [token]
  );

  const createCategory = useCallback(
    async (city: ICategory): Promise<ICategory> => {
      const data = await categoryService.create(city, token ?? undefined);
      return data;
    },
    [token]
  );

  const updateCategory = useCallback(
    async (id: string, city: ICategory): Promise<ICategory> => {
      const data = await categoryService.update(id, city, token ?? undefined);
      return data;
    },
    [token]
  );

  const deleteCategory = useCallback(
    async (id: string): Promise<void> => {
      await categoryService.delete(id, token ?? undefined);
    },
    [token]
  );

  return (
    <CategoriesContext.Provider
      value={{
        categories,
        pagination,
        selectedCategory,
        searchCategories,
        searchCategoriesForOptions,
        selectCategory,
        getCategoryById,
        createCategory,
        updateCategory,
        deleteCategory,
      }}
    >
      {children}
    </CategoriesContext.Provider>
  );
}
