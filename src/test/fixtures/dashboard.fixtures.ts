import type {
  IExpiringLotsSummary,
  IForecastTop,
  ILowStockSummary,
  ISalesChart,
  ISalesKpis,
  IUpcomingEvent,
} from "@/interfaces/dashboard.interface";
import type {
  IForecastRecommendationListItem,
  IForecastRunSummary,
} from "@/interfaces/forecast.interface";
import {
  TForecastConfidence,
  TForecastRunStatus,
  TForecastTrigger,
  TRecommendationAction,
  TRecommendationPriority,
  TRecommendationStatus,
} from "@/types/enums";

export const salesKpis: ISalesKpis = {
  month: "2026-11",
  revenue: 48250.5,
  orderCount: 312,
  averageTicket: 154.65,
  grossMargin: 19300.2,
  grossMarginPercent: 40,
  revenueVsLastYearPercent: 12.5,
  revenueVsLastMonthPercent: -3.2,
};

export const salesChart: ISalesChart = {
  months: [
    { month: "2026-09", revenue: 41000, revenueLastYear: 38000 },
    { month: "2026-10", revenue: 49800, revenueLastYear: 42000 },
    { month: "2026-11", revenue: 48250.5, revenueLastYear: null },
  ],
};

export const lowStock: ILowStockSummary = {
  count: 1,
  items: [
    {
      productId: "p-1",
      productName: "Trufa de Maracujá",
      variantId: "v-1",
      variantLabel: null,
      locationName: "Loja Centro",
      available: 3,
      minQuantity: 20,
    },
  ],
};

export const expiringLots: IExpiringLotsSummary = {
  count: 1,
  totalCostValue: 820.4,
  items: [
    {
      productName: "Brigadeiro Gourmet",
      variantLabel: "Caixa 12 un",
      lotCode: "L-2611-07",
      locationName: "Loja Centro",
      expiresOn: "2026-11-20",
      daysToExpire: 12,
      quantity: 40,
    },
  ],
};

export const upcomingEvents: IUpcomingEvent[] = [
  {
    eventId: "e-1",
    name: "Natal",
    nextDate: "2026-12-25",
    demandStartsOn: "2026-12-01",
    productCount: 18,
  },
];

export const forecastRun: IForecastRunSummary = {
  id: "run-1",
  createdAt: "2026-11-03T06:00:00Z",
  referenceDate: "2026-11-03",
  trigger: TForecastTrigger.Scheduled,
  requestedByName: null,
  horizonMonths: 3,
  horizonStart: "2026-11-01",
  horizonEnd: "2027-01-31",
  status: TForecastRunStatus.Completed,
  aiModel: "claude",
  summary: "Natal puxa a demanda de chocolates a partir de dezembro.",
  errorMessage: null,
  productsAnalyzed: 48,
  productsSentToAi: 48,
  durationMs: 52000,
  finishedAt: "2026-11-03T06:01:00Z",
  batches: { total: 2, completed: 2, failed: 0 },
  counts: {
    buy: 6,
    promote: 2,
    transfer: 0,
    hold: 40,
    pending: 8,
    applied: 0,
    dismissed: 0,
    expired: 0,
  },
  nextScheduledAt: "2026-11-10T06:00:00Z",
};

export const topRecommendation: IForecastRecommendationListItem = {
  id: "rec-1",
  forecastRunId: "run-1",
  productId: "p-2",
  productName: "Panetone Trufado",
  imageUrl: null,
  categoryPath: "Sazonais > Natal",
  abcClass: "A",
  action: TRecommendationAction.Buy,
  priority: TRecommendationPriority.High,
  confidence: TForecastConfidence.High,
  status: TRecommendationStatus.Pending,
  currentStock: 12,
  incomingStock: 0,
  coverageDays: 9,
  projectedDemand: 260,
  saleUnit: "un",
  decimalPlaces: 0,
  suggestedQuantity: 240,
  suggestedDiscountPercent: null,
  suggestedPromotionDays: null,
  transfer: null,
  deadline: "2026-11-15",
  preferredSupplierId: "s-1",
  preferredSupplierName: "Doces Serra",
  reasonShort: "Estoque cobre 9 dias e o Natal começa em 1º/12.",
  aiAdjusted: false,
  appliedLink: null,
};

export const forecastTop: IForecastTop = {
  run: forecastRun,
  recommendations: [topRecommendation],
};
