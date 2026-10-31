import { useCallback, useState, type ReactNode } from "react";

import { CategoriesContext } from "@/contexts/categories.context";
import { useAuth } from "@/hooks/use-auth";
import type { IIndexParams } from "@/interfaces/api.interface";
import type {
  CategoryNodeDto,
  CategoryRequestDto,
} from "@/interfaces/category.interface";
import { categoryService } from "@/services/category.service";

/** Toda alteração recarrega a árvore: a API devolve as contagens e a ordem prontas. */
export function CategoriesProvider({ children }: { children: ReactNode }) {
  const { token } = useAuth();
  const auth = token ?? undefined;
  const [tree, setTree] = useState<CategoryNodeDto[]>([]);
  const [loading, setLoading] = useState(true);

  const loadTree = useCallback(async () => {
    try {
      setTree(await categoryService.tree(auth));
    } finally {
      setLoading(false);
    }
  }, [auth]);

  const searchParentOptions = useCallback(
    async (search?: string) => {
      const options = await categoryService.categoryOptions(search, true, auth);
      return options.map((option) => ({
        value: option.id,
        label: option.path,
      }));
    },
    [auth]
  );

  const createCategory = useCallback(
    async (dto: CategoryRequestDto) => {
      await categoryService.create(dto, auth);
      await loadTree();
    },
    [auth, loadTree]
  );

  const updateCategory = useCallback(
    async (id: string, dto: CategoryRequestDto) => {
      await categoryService.update(id, dto, auth);
      await loadTree();
    },
    [auth, loadTree]
  );

  const deleteCategory = useCallback(
    async (id: string) => {
      await categoryService.delete(id, auth);
      await loadTree();
    },
    [auth, loadTree]
  );

  const reactivateCategory = useCallback(
    async (id: string) => {
      await categoryService.reactivate(id, auth);
      await loadTree();
    },
    [auth, loadTree]
  );

  const searchCategoriesForOptions = useCallback(
    async (query?: IIndexParams) => {
      const options = await categoryService.categoryOptions(
        query?.filters?.search,
        false,
        auth
      );
      return {
        data: options.map((option) => ({
          id: option.id,
          description: option.path,
        })),
        totalItems: options.length,
      };
    },
    [auth]
  );

  const getCategoryById = useCallback(
    async (id: string) => {
      const category = await categoryService.getById(id, auth);
      return { id: category.id, description: category.name };
    },
    [auth]
  );

  return (
    <CategoriesContext.Provider
      value={{
        tree,
        loading,
        loadTree,
        searchParentOptions,
        createCategory,
        updateCategory,
        deleteCategory,
        reactivateCategory,
        searchCategoriesForOptions,
        getCategoryById,
      }}
    >
      {children}
    </CategoriesContext.Provider>
  );
}
