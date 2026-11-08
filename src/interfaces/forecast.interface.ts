/**
 * Tipos da API nova da previsão (`nextflow.Domain/Dtos/Forecasts` e `Dtos/Notifications`), iguais ao `contract.md`
 * de demand-forecast. Datas `DateOnly` chegam como "yyyy-MM-dd", meses como "yyyy-MM" e `DateTime` em ISO.
 * As telas antigas ainda usam `legacy-forecast.interface.ts` até a migração (F3.8b a F3.8i).
 */
import type {
  TAiBatchStatus,
  TDismissReason,
  TForecastBias,
  TForecastConfidence,
  TForecastRunStatus,
  TForecastTrigger,
  TLeadTimeSource,
  TNotificationType,
  TRecommendationAction,
  TRecommendationPriority,
  TRecommendationStatus,
} from "@/types/enums";

// ---------- Análise (T-DF1, T-DF2, T-DF9) ----------

/** `ForecastBatchProgressDto` */
export interface IForecastBatchProgress {
  total: number;
  completed: number;
  failed: number;
}

/** `ForecastRecommendationCountsDto` */
export interface IForecastRecommendationCounts {
  buy: number;
  promote: number;
  transfer: number;
  hold: number;
  pending: number;
  applied: number;
  dismissed: number;
  expired: number;
}

/** `ForecastRunSummaryDto` */
export interface IForecastRunSummary {
  id: string;
  createdAt: string;
  referenceDate: string;
  trigger: TForecastTrigger;
  requestedByName: string | null;
  horizonMonths: number;
  horizonStart: string | null;
  horizonEnd: string | null;
  status: TForecastRunStatus;
  aiModel: string | null;
  summary: string | null;
  errorMessage: string | null;
  productsAnalyzed: number;
  productsSentToAi: number;
  durationMs: number | null;
  finishedAt: string | null;
  batches: IForecastBatchProgress;
  counts: IForecastRecommendationCounts;
  nextScheduledAt: string | null;
}

/** `ForecastRunProgressDto` */
export interface IForecastRunProgress {
  id: string;
  status: TForecastRunStatus;
  batches: IForecastBatchProgress;
  percent: number;
}

/** `ForecastAiBatchDto`: lote enviado à IA (T-DF9). */
export interface IForecastAiBatch {
  batchNumber: number;
  productsCount: number;
  status: TAiBatchStatus;
  errorMessage: string | null;
  durationMs: number | null;
}

// ---------- Recomendações (T-DF2, T-DF3) ----------

/** `filters` de `GET /forecasts/{runId}/recommendations` (nomes do back; vazio = sem filtro). */
export interface IForecastRecommendationFilters {
  action?: string;
  priority?: string;
  status?: string;
  confidence?: string;
  abcClass?: string;
  categoryId?: string;
  supplierId?: string;
  eventId?: string;
  aiAdjusted?: string;
  search?: string;
}

/** `ForecastAppliedLinkDto`: documento gerado ao aplicar. */
/** `ForecastTransferDto`: "Transferir" (RN-DF16), de onde para onde e quanto (somando as variações). */
export interface IForecastTransfer {
  fromLocationId: string;
  fromLocationName: string;
  toLocationId: string;
  toLocationName: string;
  quantity: number;
}

export interface IForecastAppliedLink {
  type: "PurchaseOrder" | "Promotion" | "Transfer";
  id: string;
  number: number | null;
}

/** `ForecastRecommendationListItemDto` */
/** `ForecastStoreQuantityDto`: quanto da compra recomendada vai para cada loja (RN-DF27). */
export interface IForecastStoreQuantity {
  storeId: string;
  storeName: string;
  sharePercent: number;
  shortfall: number;
  quantity: number;
}

export interface IForecastRecommendationListItem {
  id: string;
  forecastRunId: string;
  productId: string;
  productName: string;
  imageUrl: string | null;
  categoryPath: string | null;
  abcClass: string | null;
  action: TRecommendationAction;
  priority: TRecommendationPriority;
  confidence: TForecastConfidence;
  status: TRecommendationStatus;
  currentStock: number;
  incomingStock: number;
  /** Saldo da loja do topo, lido na consulta; nulo em "todas as lojas" (a análise é da empresa inteira). */
  storeCurrentStock?: number | null;
  /** "A caminho" para a loja do topo; nulo em "todas as lojas". */
  storeIncomingStock?: number | null;
  coverageDays: number | null;
  projectedDemand: number;
  saleUnit: string;
  decimalPlaces: number;
  suggestedQuantity: number | null;
  suggestedDiscountPercent: number | null;
  suggestedPromotionDays: number | null;
  /** Só na ação "Transferir" (F3.4b). */
  transfer: IForecastTransfer | null;
  /** Parte de cada loja no "Comprar", gravada pela análise (RN-DF27); vazio com uma loja só. */
  storeSplit: IForecastStoreQuantity[];
  deadline: string | null;
  preferredSupplierId: string | null;
  preferredSupplierName: string | null;
  reasonShort: string;
  aiAdjusted: boolean;
  appliedLink: IForecastAppliedLink | null;
}

/** `ForecastCalculationDto`: memória do cálculo exibida no detalhe. */
export interface IForecastCalculation {
  leadTimeDays: number;
  leadTimeSource: TLeadTimeSource;
  safetyStock: number;
  purchaseNeed: number | null;
  reservedStock: number;
  targetCoverageDays: number | null;
  shelfLifeDays: number | null;
  minOrderQty: number | null;
  orderMultiple: number | null;
  basedOnLastYear: boolean;
  monthsOfHistory: number;
  nextMonthDemand: number;
  nextMonthSeasonalIndex: number;
}

/** `LocationAvailableDto` */
export interface ILocationAvailable {
  locationId: string;
  locationName: string;
  available: number;
}

/** `VariantSplitDto` */
export interface IVariantSplit {
  variantId: string;
  variantLabel: string | null;
  sharePercent: number;
  suggestedQuantity: number;
  availableByLocation: ILocationAvailable[];
}

/** `ForecastRecommendationDetailDto` */
export interface IForecastRecommendationDetail extends IForecastRecommendationListItem {
  reasonAi: string | null;
  reasonCalculated: string;
  calculatedQuantity: number | null;
  dismissReasonCode: TDismissReason | null;
  dismissNote: string | null;
  calculation: IForecastCalculation;
  variantSplit: IVariantSplit[];
  product: IProductForecast;
}

// ---------- Previsão do produto (T-DF5) ----------

/** `ProductForecastHistoryDto` */
export interface IProductForecastHistory {
  month: string;
  quantitySold: number;
  quantitySoldOnPromo: number;
  daysOutOfStock: number;
  lostDemandQty: number;
  avgPrice: number | null;
  revenue: number;
}

/** `ProductForecastProjectionDto` */
export interface IProductForecastProjection {
  month: string;
  projectedQuantity: number;
}

/** `ProductForecastSeasonalityDto` (mês de 1 a 12). */
export interface IProductForecastSeasonality {
  month: number;
  productIndex: number | null;
  categoryIndex: number | null;
}

/** `ProductForecastEventDto` */
export interface IProductForecastEvent {
  name: string;
  date: string;
  demandStartsOn: string;
  linkedToProduct: boolean;
}

/** `ForecastAccuracyItemDto` */
export interface IForecastAccuracyItem {
  month: string;
  projected: number;
  actual: number;
  errorPercent: number | null;
}

/** `ProductForecastDto` */
export interface IProductForecast {
  productId: string;
  productName: string;
  saleUnit: string;
  decimalPlaces: number;
  history: IProductForecastHistory[];
  projection: IProductForecastProjection[];
  seasonality: IProductForecastSeasonality[];
  monthsOfHistory: number;
  events: IProductForecastEvent[];
  currentStock: number;
  accuracy: IForecastAccuracyItem[];
  latestRecommendationId: string | null;
}

// ---------- Aplicar e descartar (T-DF4, T-DF6, T-DF8) ----------

/** `ApplyPurchaseItemDto` */
export interface IApplyPurchaseItem {
  recommendationId: string;
  variantId: string;
  quantity: number;
  unitCost: number;
}

/** `ApplyPurchaseGroupDto`: um pedido por fornecedor. */
export interface IApplyPurchaseGroup {
  supplierId: string;
  receiveLocationId: string;
  note?: string | null;
  items: IApplyPurchaseItem[];
}

/** `ApplyPurchaseDto` */
export interface IApplyPurchaseRequest {
  groups: IApplyPurchaseGroup[];
}

/** `AppliedPurchaseOrderDto` */
export interface IAppliedPurchaseOrder {
  id: string;
  number: number;
  supplierName: string;
  total: number;
}

/** `ApplyPurchaseResultDto` */
export interface IApplyPurchaseResult {
  purchaseOrders: IAppliedPurchaseOrder[];
  recommendations: IForecastRecommendationListItem[];
}

/** `ApplyPromotionDto` */
export interface IApplyPromotionRequest {
  discountPercent: number;
  startDate: string;
  endDate: string;
  variantIds?: string[] | null;
  confirmWarnings: boolean;
}

/** `ApplyPromotionResultDto` */
export interface IApplyPromotionResult {
  promotionIds: string[];
  recommendation: IForecastRecommendationListItem;
}

/** `DismissRecommendationDto` */
export interface IDismissRecommendationRequest {
  reasonCode: TDismissReason | null;
  note?: string | null;
}

// ---------- Agendamento (T-DF11) ----------

/** `ForecastSettingsDto` (weekday: 0 = domingo, como `DayOfWeek`; time "HH:mm"). */
export interface IForecastSettings {
  scheduleEnabled: boolean;
  weekday: number;
  time: string;
  aiBatchSize: number;
  aiConfigured: boolean;
  nextScheduledAt: string | null;
}

/** `ForecastSettingsRequestDto` */
export interface IForecastSettingsRequest {
  scheduleEnabled: boolean;
  weekday: number;
  time: string;
  aiBatchSize: number;
}

// ---------- Precisão (T-DF10) ----------

/** `ForecastAccuracyMonthDto` */
export interface IForecastAccuracyMonth {
  month: string;
  mapePercent: number | null;
  productsMeasured: number;
}

/** `ForecastAccuracyClassDto` */
export interface IForecastAccuracyClass {
  abcClass: string;
  mapePercent: number;
}

/** `ForecastAccuracyCategoryDto` */
export interface IForecastAccuracyCategory {
  categoryPath: string;
  mapePercent: number;
}

/** `ForecastAccuracySummaryDto` (tolerância ±15%, RN-DF26). */
export interface IForecastAccuracySummary {
  monthly: IForecastAccuracyMonth[];
  byAbcClass: IForecastAccuracyClass[];
  byCategory: IForecastAccuracyCategory[];
  withinTolerancePercent: number | null;
}

/** `ForecastAccuracyLastMonthDto` */
export interface IForecastAccuracyLastMonth {
  month: string;
  projected: number;
  actual: number;
}

/** `ForecastAccuracyProductDto` */
export interface IForecastAccuracyProduct {
  productId: string;
  productName: string;
  abcClass: string | null;
  monthsMeasured: number;
  mapePercent: number;
  bias: TForecastBias;
  lastMonth: IForecastAccuracyLastMonth | null;
}

// ---------- Notificações (T-DF12) ----------

/** `NotificationDto` */
export interface INotification {
  id: string;
  type: TNotificationType;
  title: string;
  message: string;
  link: string | null;
  createdAt: string;
  readAt: string | null;
}

/** `NotificationListDto` */
export interface INotificationList {
  unreadCount: number;
  items: INotification[];
}

/** `StoreSplitDto`: sugestão de divisão da compra entre lojas (RN-DF27, F3.9). */
export interface IStoreSplitStore {
  storeId: string;
  storeName: string;
  receiveLocationId: string | null;
  receiveLocationName: string | null;
  sharePercent: number;
  currentStock: number;
  incomingStock: number;
  shortfall: number;
  quantity: number;
}

export interface IStoreSplitItem {
  variantId: string;
  quantity: number;
  byStore: { storeId: string; quantity: number }[];
}

export interface IStoreSplit {
  recommendationId: string;
  orderMultiple: number | null;
  stores: IStoreSplitStore[];
  items: IStoreSplitItem[];
}
