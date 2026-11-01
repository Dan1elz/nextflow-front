import { BaseService } from "./base.service";
import type {
  ProductFormDto,
  ProductImageResponseDto,
  PriceHistoryResponseDto,
  ProductListItemDto,
  ProductRequestDto,
  ProductResponseDto,
  ProductSupplierResponseDto,
  ProductVariantResponseDto,
} from "@/interfaces/product.interface";
import type { TLifecycle } from "@/types/enums";

class ProductService extends BaseService<
  ProductResponseDto,
  ProductRequestDto,
  ProductListItemDto
> {
  /** Sem `id`, só as opções do formulário, para a criação. */
  form(id?: string, token?: string): Promise<ProductFormDto> {
    return this.apiService.get<ProductFormDto>(
      id ? `${this.endpoint}/${id}/form` : `${this.endpoint}/form`,
      undefined,
      token
    );
  }

  variants(id: string, token?: string): Promise<ProductVariantResponseDto[]> {
    return this.apiService.get<ProductVariantResponseDto[]>(
      `${this.endpoint}/${id}/variants`,
      undefined,
      token
    );
  }

  suppliers(id: string, token?: string): Promise<ProductSupplierResponseDto[]> {
    return this.apiService.get<ProductSupplierResponseDto[]>(
      `${this.endpoint}/${id}/suppliers`,
      undefined,
      token
    );
  }

  priceHistory(id: string, token?: string): Promise<PriceHistoryResponseDto[]> {
    return this.apiService.get<PriceHistoryResponseDto[]>(
      `${this.endpoint}/${id}/price-history`,
      undefined,
      token
    );
  }

  changeLifecycle(
    id: string,
    lifecycle: TLifecycle,
    token?: string
  ): Promise<void> {
    return this.apiService.patch<void>(
      `${this.endpoint}/${id}/lifecycle`,
      { lifecycle },
      token
    );
  }

  uploadImage(
    id: string,
    image: File,
    token?: string
  ): Promise<ProductImageResponseDto> {
    const data = new FormData();
    data.append("image", image);
    return this.apiService.post<ProductImageResponseDto>(
      `${this.endpoint}/${id}/image`,
      data,
      token,
      true
    );
  }

  removeImage(id: string, token?: string): Promise<void> {
    return this.apiService.delete<void>(`${this.endpoint}/${id}/image`, token);
  }
}

export const productService = new ProductService("products");
