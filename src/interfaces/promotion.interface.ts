import type { TPromotionSource, TPromotionStatus } from "@/types/enums";

/** Promoção vigente mostrada em outras telas (`PromotionSummaryDto`): seletor de venda, variações do produto. */
export interface PromotionSummaryDto {
  id: string;
  discountPercent: number;
  endDate: string;
}

/**
 * Linha do T-VD7 (`PromotionListItemDto`). Status calculado pela API na data de negócio (RN-VD12); faixas de preço sobre
 * as variações do escopo, com o promocional já calculado (RN-VD02).
 */
export interface PromotionListItemDto {
  id: string;
  productId: string;
  productName: string;
  /** Nulo = todas as variações do produto. */
  variantId?: string | null;
  variantLabel?: string | null;
  discountPercent: number;
  minListPrice: number;
  maxListPrice: number;
  minPromoPrice: number;
  maxPromoPrice: number;
  startDate: string;
  endDate: string;
  status: TPromotionStatus;
  source: TPromotionSource;
  forecastRecommendationId?: string | null;
  reason?: string | null;
  createdByName: string;
  belowCostConfirmed: boolean;
  isActive: boolean;
}

/** Linha da prévia (`GET /api/promotions/preview`). */
export interface PromotionPreviewVariantDto {
  variantId: string;
  variantLabel?: string | null;
  listPrice: number;
  promoPrice: number;
  averageCost?: number | null;
  marginPercent?: number | null;
  belowCost: boolean;
}

export interface PromotionPreviewDto {
  variants: PromotionPreviewVariantDto[];
}

/** Body de `POST /api/promotions`. */
export interface PromotionRequestDto {
  productId: string;
  variantId?: string | null;
  discountPercent: number;
  startDate: string;
  endDate: string;
  reason?: string | null;
  confirmWarnings?: boolean;
}

/** Filtros da listagem: status, origem, produto e período que cruza `from`–`to`. */
export interface PromotionFilters {
  status?: TPromotionStatus;
  source?: TPromotionSource;
  productId?: string;
  from?: string;
  to?: string;
}
