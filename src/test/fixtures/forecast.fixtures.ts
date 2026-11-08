import type { PaginationDto } from "@/interfaces/api.interface";
import type {
  IForecastRecommendationDetail,
  IForecastRecommendationListItem,
  IForecastRunProgress,
  IForecastRunSummary,
  IProductForecast,
} from "@/interfaces/forecast.interface";

/** Última análise concluída (T-DF2): semanal, 6 meses, 8 lotes. */
export const runCompleted: IForecastRunSummary = {
  id: "run-1",
  createdAt: "2026-11-01T09:00:00Z",
  referenceDate: "2026-11-01",
  trigger: "Scheduled",
  requestedByName: null,
  horizonMonths: 6,
  horizonStart: "2026-11",
  horizonEnd: "2027-04",
  status: "Completed",
  aiModel: "claude",
  summary: "O Natal puxa as trufas; reforce o estoque antes de dezembro.",
  errorMessage: null,
  productsAnalyzed: 48,
  productsSentToAi: 40,
  durationMs: 95_000,
  finishedAt: "2026-11-01T09:01:35Z",
  batches: { total: 8, completed: 8, failed: 0 },
  counts: {
    buy: 2,
    promote: 1,
    transfer: 0,
    hold: 1,
    pending: 3,
    applied: 1,
    dismissed: 0,
    expired: 0,
  },
  nextScheduledAt: "2026-11-15T09:00:00Z",
};

/** Análise que o "Gerar nova análise" acabou de enfileirar. */
export const runRunning: IForecastRunSummary = {
  ...runCompleted,
  id: "run-2",
  createdAt: "2026-11-08T10:00:00Z",
  referenceDate: "2026-11-08",
  trigger: "Manual",
  requestedByName: "Daniel",
  horizonMonths: 0,
  horizonStart: null,
  horizonEnd: null,
  status: "Running",
  summary: null,
  productsAnalyzed: 0,
  productsSentToAi: 0,
  durationMs: null,
  finishedAt: null,
  batches: { total: 0, completed: 0, failed: 0 },
  counts: {
    buy: 0,
    promote: 0,
    transfer: 0,
    hold: 0,
    pending: 0,
    applied: 0,
    dismissed: 0,
    expired: 0,
  },
};

/** A mesma análise depois de terminar. */
export const runFinished: IForecastRunSummary = {
  ...runCompleted,
  id: "run-2",
  createdAt: "2026-11-08T10:00:00Z",
  referenceDate: "2026-11-08",
  trigger: "Manual",
  requestedByName: "Daniel",
  summary: "Panetone parado: vale uma promoção.",
};

export function progress(
  completed: number,
  total: number,
  status: IForecastRunProgress["status"] = "Running"
): IForecastRunProgress {
  return {
    id: "run-2",
    status,
    batches: { total, completed, failed: 0 },
    percent: total ? Math.round((completed / total) * 100) : 0,
  };
}

const baseItem: IForecastRecommendationListItem = {
  id: "rec-1",
  forecastRunId: "run-1",
  productId: "prod-1",
  productName: "Trufa de Maracujá",
  imageUrl: null,
  categoryPath: "Chocolates > Trufas",
  abcClass: "A",
  action: "Buy",
  priority: "High",
  confidence: "High",
  status: "Pending",
  currentStock: 12,
  incomingStock: 0,
  coverageDays: 6,
  projectedDemand: 320,
  saleUnit: "un",
  decimalPlaces: 0,
  suggestedQuantity: 240,
  suggestedDiscountPercent: null,
  suggestedPromotionDays: null,
  transfer: null,
  storeSplit: [],
  deadline: "2026-11-20",
  preferredSupplierId: "sup-1",
  preferredSupplierName: "Cacau Sul",
  reasonShort: "Cobertura de 6 dias com o Natal chegando.",
  aiAdjusted: true,
  appliedLink: null,
};

export const recommendationsRun1: PaginationDto<IForecastRecommendationListItem> =
  {
    items: [baseItem],
    total: 1,
  };

export const recommendationsRun2: PaginationDto<IForecastRecommendationListItem> =
  {
    items: [
      {
        ...baseItem,
        id: "rec-2",
        forecastRunId: "run-2",
        productId: "prod-2",
        productName: "Panetone Trufado",
        categoryPath: "Sazonais",
        abcClass: "B",
        action: "Promote",
        priority: "Medium",
        confidence: "Medium",
        suggestedQuantity: null,
        suggestedDiscountPercent: 15,
        suggestedPromotionDays: 10,
        deadline: null,
        reasonShort: "Estoque parado há 40 dias.",
        aiAdjusted: false,
      },
    ],
    total: 1,
  };

/** Previsão do produto da rec-1 (T-DF5): 3 meses de histórico, 2 de projeção, Natal no horizonte. */
export const productForecast: IProductForecast = {
  productId: "prod-1",
  productName: "Trufa de Maracujá",
  saleUnit: "un",
  decimalPlaces: 0,
  history: [
    {
      month: "2026-08",
      quantitySold: 100,
      quantitySoldOnPromo: 10,
      daysOutOfStock: 0,
      lostDemandQty: 0,
      avgPrice: 6.5,
      revenue: 650,
    },
    {
      month: "2026-09",
      quantitySold: 80,
      quantitySoldOnPromo: 0,
      daysOutOfStock: 20,
      lostDemandQty: 40,
      avgPrice: 6.5,
      revenue: 520,
    },
    {
      month: "2026-10",
      quantitySold: 120,
      quantitySoldOnPromo: 0,
      daysOutOfStock: 0,
      lostDemandQty: 0,
      avgPrice: 6.9,
      revenue: 828,
    },
  ],
  projection: [
    { month: "2026-11", projectedQuantity: 140 },
    { month: "2026-12", projectedQuantity: 180 },
  ],
  seasonality: Array.from({ length: 12 }, (_, index) => ({
    month: index + 1,
    productIndex: index === 11 ? 1.8 : 1,
    categoryIndex: null,
  })),
  monthsOfHistory: 14,
  events: [
    {
      name: "Natal",
      date: "2026-12-25",
      demandStartsOn: "2026-12-01",
      linkedToProduct: true,
    },
    {
      name: "Dia das Crianças",
      date: "2027-10-12",
      demandStartsOn: "2027-09-28",
      linkedToProduct: false,
    },
  ],
  currentStock: 12,
  accuracy: [
    { month: "2026-08", projected: 110, actual: 100, errorPercent: 10 },
    { month: "2026-09", projected: 95, actual: 80, errorPercent: null },
  ],
  latestRecommendationId: "rec-1",
};

/** Detalhe da rec-1 (T-DF3): a IA subiu de 200 para 240; rateio 60/40 entre as variações. */
export const recommendationDetail: IForecastRecommendationDetail = {
  ...baseItem,
  reasonAi: "Natal puxa as trufas; subi a compra para cobrir dezembro.",
  reasonCalculated: "Cobertura de 6 dias abaixo do alvo de 15 dias.",
  calculatedQuantity: 200,
  dismissReasonCode: null,
  dismissNote: null,
  calculation: {
    leadTimeDays: 7,
    leadTimeSource: "History",
    safetyStock: 20,
    purchaseNeed: 200,
    reservedStock: 3,
    targetCoverageDays: 15,
    shelfLifeDays: 90,
    minOrderQty: 24,
    orderMultiple: 12,
    basedOnLastYear: false,
    monthsOfHistory: 14,
    nextMonthDemand: 140,
    nextMonthSeasonalIndex: 1.2,
  },
  variantSplit: [
    {
      variantId: "var-1",
      variantLabel: "Caixa com 6",
      sharePercent: 60,
      suggestedQuantity: 144,
      availableByLocation: [
        { locationId: "loc-1", locationName: "Loja Centro", available: 5 },
        { locationId: "loc-2", locationName: "Depósito", available: 2 },
      ],
    },
    {
      variantId: "var-2",
      variantLabel: "Caixa com 12",
      sharePercent: 40,
      suggestedQuantity: 96,
      availableByLocation: [
        { locationId: "loc-1", locationName: "Loja Centro", available: 5 },
      ],
    },
  ],
  product: productForecast,
};

/** Compra sem fornecedor preferido (T-DF4 "Escolha o fornecedor"): produto sem grade. */
export const recommendationNoSupplier: IForecastRecommendationListItem = {
  ...baseItem,
  id: "rec-3",
  productId: "prod-3",
  productName: "Bombom de Coco",
  categoryPath: "Chocolates > Bombons",
  suggestedQuantity: 50,
  preferredSupplierId: null,
  preferredSupplierName: null,
  aiAdjusted: false,
};

export const recommendationNoSupplierDetail: IForecastRecommendationDetail = {
  ...recommendationDetail,
  ...recommendationNoSupplier,
  calculation: {
    ...recommendationDetail.calculation,
    minOrderQty: null,
    orderMultiple: null,
  },
  variantSplit: [
    {
      variantId: "var-3",
      variantLabel: null,
      sharePercent: 100,
      suggestedQuantity: 50,
      availableByLocation: [],
    },
  ],
  product: {
    ...productForecast,
    productId: "prod-3",
    productName: "Bombom de Coco",
  },
};
