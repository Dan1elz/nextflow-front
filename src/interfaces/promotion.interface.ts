import type { TLegacyPromotionSource, TLegacyPromotionStatus } from "@/types/enums";
import type { IProduct } from "./product.interface";

/** Resumo da promoção vigente embutido no produto (`ProductResponseDto.activePromotion`). */
export interface IPromotionSummary {
  id: string;
  discountPercent: number;
  startDate: string;
  endDate: string;
  promotionalPrice: number;
}

/** `PromotionResponseDto` */
export interface IPromotion {
  id: string;
  productId: string;
  product?: IProduct | null;
  discountPercent: number;
  startDate: string;
  endDate: string;
  reason?: string | null;
  source: TLegacyPromotionSource;
  forecastRecommendationId?: string | null;
  createdByUserId: string;
  isActive: boolean;
  status: TLegacyPromotionStatus;
  originalPrice: number;
  promotionalPrice: number;
  createAt: string;
}

/** Body de `POST /api/promotions` */
export interface ICreatePromotion {
  productId: string;
  discountPercent: number;
  startDate: string;
  endDate: string;
  reason?: string;
}
