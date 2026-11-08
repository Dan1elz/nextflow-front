import { ApiService } from "./api.service";
import type {
  IExpiringLotsSummary,
  IForecastTop,
  ILowStockSummary,
  ISalesChart,
  ISalesKpis,
  IUpcomingEvent,
} from "@/interfaces/dashboard.interface";

const apiService = new ApiService();

/** Janela dos lotes vencendo no painel (RN-CE15). */
export const EXPIRING_LOTS_DAYS = 30;
/** Janela das próximas datas comemorativas no painel. */
export const UPCOMING_EVENTS_DAYS = 90;
/** Recomendações mostradas no card do painel. */
export const FORECAST_TOP_LIMIT = 5;

/** Painel inicial (T-DF1): um método por bloco, cada um na sua rota. */
export const dashboardService = {
  /** GET /api/dashboard/sales-kpis */
  getSalesKpis(token?: string): Promise<ISalesKpis> {
    return apiService.get<ISalesKpis>("dashboard/sales-kpis", undefined, token);
  },

  /** GET /api/dashboard/sales-chart */
  getSalesChart(token?: string): Promise<ISalesChart> {
    return apiService.get<ISalesChart>(
      "dashboard/sales-chart",
      undefined,
      token
    );
  },

  /** GET /api/dashboard/low-stock */
  getLowStock(token?: string): Promise<ILowStockSummary> {
    return apiService.get<ILowStockSummary>(
      "dashboard/low-stock",
      undefined,
      token
    );
  },

  /** GET /api/dashboard/expiring-lots?days=30 */
  getExpiringLots(token?: string): Promise<IExpiringLotsSummary> {
    return apiService.get<IExpiringLotsSummary>(
      "dashboard/expiring-lots",
      { days: EXPIRING_LOTS_DAYS },
      token
    );
  },

  /** GET /api/dashboard/upcoming-events?days=90 */
  getUpcomingEvents(token?: string): Promise<IUpcomingEvent[]> {
    return apiService.get<IUpcomingEvent[]>(
      "dashboard/upcoming-events",
      { days: UPCOMING_EVENTS_DAYS },
      token
    );
  },

  /** GET /api/forecasts/latest/top?limit=5 */
  getForecastTop(token?: string): Promise<IForecastTop> {
    return apiService.get<IForecastTop>(
      "forecasts/latest/top",
      { limit: FORECAST_TOP_LIMIT },
      token
    );
  },
};
