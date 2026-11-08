import type { TRecommendationAction } from "@/types/enums";
/**
 * Painel inicial (T-DF1, F3.5 no back): cada bloco vem de uma rota própria (`nextflow.Domain/Dtos/Dashboard`).
 * Meses chegam como "yyyy-MM" e `DateOnly` como "yyyy-MM-dd".
 */
import type {
  IForecastRecommendationListItem,
  IForecastRunSummary,
} from "@/interfaces/forecast.interface";

/** `SalesKpisDto`: GET /api/dashboard/sales-kpis */
export interface ISalesKpis {
  month: string;
  revenue: number;
  orderCount: number;
  averageTicket: number;
  grossMargin: number;
  grossMarginPercent: number;
  revenueVsLastYearPercent: number | null;
  revenueVsLastMonthPercent: number | null;
}

/** `SalesChartMonthDto` */
export interface ISalesChartMonth {
  month: string;
  revenue: number;
  revenueLastYear: number | null;
}

/** `SalesChartDto`: GET /api/dashboard/sales-chart */
export interface ISalesChart {
  months: ISalesChartMonth[];
}

/** `LowStockItemDto` */
export interface ILowStockItem {
  productId: string;
  productName: string;
  variantId: string;
  variantLabel: string | null;
  locationId: string;
  locationName: string;
  /** Loja do local: as ações do "ver mais" trocam a loja do topo para ela. */
  storeId: string;
  storeName: string;
  available: number;
  minQuantity: number;
  /** Recomendação pendente da previsão para o produto (menos "Manter"); nula sem uma. */
  recommendationId: string | null;
  recommendationAction: TRecommendationAction | null;
}

/** `LowStockSummaryDto`: GET /api/dashboard/low-stock */
export interface ILowStockSummary {
  count: number;
  items: ILowStockItem[];
}

/** `ExpiringLotItemDto` */
export interface IExpiringLotItem {
  productId: string;
  variantId: string;
  productName: string;
  variantLabel: string | null;
  lotId: string;
  lotCode: string;
  locationId: string;
  locationName: string;
  /** Loja do local: as ações do "ver mais" trocam a loja do topo para ela. */
  storeId: string;
  storeName: string;
  recommendationId: string | null;
  recommendationAction: TRecommendationAction | null;
  expiresOn: string;
  daysToExpire: number;
  quantity: number;
}

/** `ExpiringLotsSummaryDto`: GET /api/dashboard/expiring-lots?days=30 */
export interface IExpiringLotsSummary {
  count: number;
  totalCostValue: number;
  items: IExpiringLotItem[];
}

/** `UpcomingEventDto`: GET /api/dashboard/upcoming-events?days=90 devolve a lista. */
export interface IUpcomingEvent {
  eventId: string;
  name: string;
  nextDate: string;
  demandStartsOn: string;
  productCount: number;
}

/** `ForecastTopDto`: GET /api/forecasts/latest/top?limit=5 (`run` nulo quando nunca houve análise). */
export interface IForecastTop {
  run: IForecastRunSummary | null;
  recommendations: IForecastRecommendationListItem[];
}
