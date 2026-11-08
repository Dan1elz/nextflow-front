import { createContext } from "react";
import type {
  IExpiringLotsSummary,
  IForecastTop,
  ILowStockSummary,
  ISalesChart,
  ISalesKpis,
  IUpcomingEvent,
} from "@/interfaces/dashboard.interface";

/** Estado de um bloco do painel: carrega e falha sozinho, sem derrubar os outros. */
export type DashboardBlock<T> = {
  data: T | null;
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
};

export type DashboardContextType = {
  salesKpis: DashboardBlock<ISalesKpis>;
  salesChart: DashboardBlock<ISalesChart>;
  lowStock: DashboardBlock<ILowStockSummary>;
  expiringLots: DashboardBlock<IExpiringLotsSummary>;
  upcomingEvents: DashboardBlock<IUpcomingEvent[]>;
  forecastTop: DashboardBlock<IForecastTop>;
  /** Algum bloco ainda carregando. */
  loading: boolean;
  /** Recarrega todos os blocos em paralelo. */
  fetchAll: () => Promise<void>;
};

export const DashboardContext = createContext<DashboardContextType | null>(
  null
);
