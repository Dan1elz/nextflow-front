import type { PaginationDto } from "@/interfaces/api.interface";
import type {
  IForecastRecommendationListItem,
  IForecastRunProgress,
  IForecastRunSummary,
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
