import { BaseService } from "./base.service";
import type {
  PromotionListItemDto,
  PromotionPreviewDto,
  PromotionRequestDto,
} from "@/interfaces/promotion.interface";

/** Promoções (T-VD7). Cancelar é `POST /{id}/cancel`; não há editar nem reativar (RN-VD12). */
class PromotionService extends BaseService<
  PromotionListItemDto,
  PromotionRequestDto,
  PromotionListItemDto
> {
  preview(
    productId: string,
    variantId: string | null | undefined,
    discountPercent: number,
    token?: string
  ): Promise<PromotionPreviewDto> {
    return this.apiService.get<PromotionPreviewDto>(
      `${this.endpoint}/preview`,
      {
        productId,
        discountPercent,
        ...(variantId ? { variantId } : {}),
      },
      token
    );
  }

  cancel(id: string, token?: string): Promise<void> {
    return this.apiService.post<void>(
      `${this.endpoint}/${id}/cancel`,
      {},
      token
    );
  }
}

export const promotionService = new PromotionService("promotions");
