import type { PromotionSummaryDto } from "@/interfaces/promotion.interface";
import type { TLifecycle, TSaleUnit } from "@/types/enums";

/** Lote que a venda baixaria por FEFO (RN-CE15). Vem nulo até a F1.7. */
export interface SaleOptionLotDto {
  lotId: string;
  code: string;
  expiresOn: string;
  quantity: number;
}

/**
 * Opção do seletor de venda (T-VD1). Preço efetivo calculado pela API (RN-VD02); `availableQuantity` é o disponível no
 * local de venda `locationId` (o informado ou o padrão da loja, RN-CE08).
 */
export interface VariantSaleOptionDto {
  variantId: string;
  productId: string;
  productName: string;
  /** Nulo = variação padrão oculta. */
  variantLabel: string | null;
  sku: string;
  barcode: string | null;
  imageUrl: string | null;
  saleUnit: TSaleUnit;
  decimalPlaces: number;
  allowsNegative: boolean;
  listPrice: number;
  effectivePrice: number;
  /** Promoção vigente (F2.3); nula sem promoção. */
  activePromotion: PromotionSummaryDto | null;
  availableQuantity: number;
  locationId: string;
  nextLot: SaleOptionLotDto | null;
  lifecycle: TLifecycle;
  isActive: boolean;
}

export interface VariantSaleOptionsParams {
  search?: string;
  storeId: string;
  locationId?: string;
  limit?: number;
}

/** Um local com saldo no aviso de falta (T-VD1a). */
export interface StockAvailabilityLocationDto {
  locationId: string;
  locationName: string;
  storeId: string;
  storeName: string;
  sameStore: boolean;
  available: number;
}

export interface StockAvailabilityDto {
  variantId: string;
  byLocation: StockAvailabilityLocationDto[];
}
