import type {
  TLegacyForecastConfidence,
  TLegacyForecastRunStatus,
  TLegacyRecommendationAction,
  TLegacyRecommendationPriority,
  TLegacyRecommendationStatus,
  TUnitType,
} from "@/types/enums";
import type { IPurchaseOrder } from "./purchase-order.interface";

export interface IForecastRunCounts {
  buy: number;
  promote: number;
  hold: number;
  pending: number;
}

/** `ForecastRunSummaryDto` */
export interface IForecastRunSummary {
  id: string;
  createAt: string;
  requestedByUserId: string;
  requestedByName: string;
  horizonMonths: number;
  status: TLegacyForecastRunStatus;
  aiProvider?: string | null;
  aiModel?: string | null;
  summary?: string | null;
  errorMessage?: string | null;
  durationMs: number;
  productsAnalyzed: number;
  counts: IForecastRunCounts;
}

/** `ForecastRunDto` */
export interface IForecastRun extends IForecastRunSummary {
  recommendations: IForecastRecommendation[];
}

/** Snapshot do produto embutido na recomendação. */
export interface IForecastRecommendationProduct {
  id: string;
  name: string;
  productCode: string;
  brand?: string | null;
  unitType: TUnitType;
  price: number;
  effectivePrice: number;
  costPrice?: number | null;
  quantity: number;
  supplierId: string;
  supplierName: string;
}

/** `ForecastRecommendationDto` */
export interface IForecastRecommendation {
  id: string;
  forecastRunId: string;
  productId: string;
  product: IForecastRecommendationProduct;
  action: TLegacyRecommendationAction;
  priority: TLegacyRecommendationPriority;
  confidence: TLegacyForecastConfidence;
  status: TLegacyRecommendationStatus;
  suggestedQuantity?: number | null;
  suggestedDiscountPercent?: number | null;
  suggestedPromotionDays?: number | null;
  deadline?: string | null;
  reason: string;
  currentStock: number;
  incomingStock: number;
  projectedDemand: number;
  nextMonthDemand: number;
  coverageDays?: number | null;
  nextMonthSeasonalIndex: number;
  appliedAt?: string | null;
  purchaseOrderId?: string | null;
  promotionId?: string | null;
  dismissReason?: string | null;
}

export interface IForecastHistoryPoint {
  year: number;
  month: number;
  /** "MM/yyyy" */
  label: string;
  quantitySold: number;
  revenue: number;
}

export interface IForecastProjectionPoint {
  year: number;
  month: number;
  /** "MM/yyyy" */
  label: string;
  projectedQuantity: number;
}

export interface ISeasonalityPoint {
  /** 1..12 */
  month: number;
  seasonalIndex: number;
}

/** `ProductForecastDto` */
export interface IProductForecast {
  productId: string;
  productName: string;
  history: IForecastHistoryPoint[];
  projection: IForecastProjectionPoint[];
  seasonality: ISeasonalityPoint[];
  latestRecommendation?: IForecastRecommendation | null;
}

/** Body de `POST /api/forecasts/generate` */
export interface IGenerateForecastRequest {
  horizonMonths: number;
}

export interface IApplyPurchaseItem {
  recommendationId: string;
  quantity: number;
  costPrice: number;
}

/** `ApplyPurchaseRequestDto` */
export interface IApplyPurchaseRequest {
  items: IApplyPurchaseItem[];
  note?: string;
}

/** `ApplyPurchaseResultDto` */
export interface IApplyPurchaseResult {
  purchaseOrders: IPurchaseOrder[];
  recommendations: IForecastRecommendation[];
}

/** `ApplyPromotionRequestDto` */
export interface IApplyPromotionRequest {
  discountPercent: number;
  startDate: string;
  endDate: string;
  reason?: string;
}

export interface IDismissRecommendationRequest {
  reason?: string;
}
