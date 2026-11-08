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

/** Loja do topo como filtro: `null` (todas as lojas) não manda o parâmetro. */
const storeQuery = (storeId?: string | null) =>
  storeId ? { storeId } : undefined;

/** Painel inicial (T-DF1): um método por bloco, cada um na sua rota. */
export const dashboardService = {
  /** GET /api/dashboard/sales-kpis?storeId= */
  getSalesKpis(token?: string, storeId?: string | null): Promise<ISalesKpis> {
    return apiService.get<ISalesKpis>(
      "dashboard/sales-kpis",
      storeQuery(storeId),
      token
    );
  },

  /** GET /api/dashboard/sales-chart?storeId= */
  getSalesChart(token?: string, storeId?: string | null): Promise<ISalesChart> {
    return apiService.get<ISalesChart>(
      "dashboard/sales-chart",
      storeQuery(storeId),
      token
    );
  },

  /** GET /api/dashboard/low-stock?storeId= */
  getLowStock(
    token?: string,
    storeId?: string | null
  ): Promise<ILowStockSummary> {
    return apiService.get<ILowStockSummary>(
      "dashboard/low-stock",
      storeQuery(storeId),
      token
    );
  },

  /** GET /api/dashboard/expiring-lots?days=30&storeId= */
  getExpiringLots(
    token?: string,
    storeId?: string | null
  ): Promise<IExpiringLotsSummary> {
    return apiService.get<IExpiringLotsSummary>(
      "dashboard/expiring-lots",
      { days: EXPIRING_LOTS_DAYS, ...storeQuery(storeId) },
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

  /** GET /api/forecasts/latest/top?limit=5&storeId= (a loja só acrescenta o estoque dela em cada linha) */
  getForecastTop(
    token?: string,
    storeId?: string | null
  ): Promise<IForecastTop> {
    return apiService.get<IForecastTop>(
      "forecasts/latest/top",
      { limit: FORECAST_TOP_LIMIT, ...storeQuery(storeId) },
      token
    );
  },
};
