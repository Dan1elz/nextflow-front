import { BaseService } from "./base.service";
import type {
  CategoryNodeDto,
  CategoryOptionDto,
  CategoryRequestDto,
  CategoryResponseDto,
} from "@/interfaces/category.interface";

class CategoryService extends BaseService<
  CategoryResponseDto,
  CategoryRequestDto
> {
  tree(token?: string): Promise<CategoryNodeDto[]> {
    return this.apiService.get<CategoryNodeDto[]>(
      `${this.endpoint}/tree`,
      undefined,
      token
    );
  }

  /** Combo de categoria; `rootsOnly` deixa só as que podem ser pai (RN-CE23). */
  categoryOptions(
    search?: string,
    rootsOnly = false,
    token?: string
  ): Promise<CategoryOptionDto[]> {
    return this.apiService.get<CategoryOptionDto[]>(
      `${this.endpoint}/options`,
      {
        search,
        filters: rootsOnly ? JSON.stringify({ rootsOnly: "true" }) : undefined,
      },
      token
    );
  }
}

export const categoryService = new CategoryService("categories");
