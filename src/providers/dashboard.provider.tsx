import { useCallback, useMemo, useState, type ReactNode } from "react";
import { useAuth } from "@/hooks/use-auth";
import { dashboardService } from "@/services/dashboard.service";
import {
  DashboardContext,
  type DashboardBlock,
} from "@/contexts/dashboard.context";

type BlockState<T> = Omit<DashboardBlock<T>, "reload">;

const BLOCK_ERROR = "Não foi possível carregar este bloco.";

/** Um bloco do painel: começa carregando e guarda o próprio erro. */
function useDashboardBlock<T>(
  loader: (token?: string) => Promise<T>,
  token?: string
): DashboardBlock<T> {
  const [state, setState] = useState<BlockState<T>>({
    data: null,
    loading: true,
    error: null,
  });

  const reload = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const data = await loader(token);
      setState({ data, loading: false, error: null });
    } catch (error) {
      setState({
        data: null,
        loading: false,
        error:
          error instanceof Error && error.message ? error.message : BLOCK_ERROR,
      });
    }
  }, [loader, token]);

  return useMemo(() => ({ ...state, reload }), [state, reload]);
}

export function DashboardProvider({ children }: { children: ReactNode }) {
  const { token } = useAuth();
  const authToken = token ?? undefined;

  const salesKpis = useDashboardBlock(dashboardService.getSalesKpis, authToken);
  const salesChart = useDashboardBlock(
    dashboardService.getSalesChart,
    authToken
  );
  const lowStock = useDashboardBlock(dashboardService.getLowStock, authToken);
  const expiringLots = useDashboardBlock(
    dashboardService.getExpiringLots,
    authToken
  );
  const upcomingEvents = useDashboardBlock(
    dashboardService.getUpcomingEvents,
    authToken
  );
  const forecastTop = useDashboardBlock(
    dashboardService.getForecastTop,
    authToken
  );

  const loading = [
    salesKpis,
    salesChart,
    lowStock,
    expiringLots,
    upcomingEvents,
    forecastTop,
  ].some((block) => block.loading);

  const reloadSalesKpis = salesKpis.reload;
  const reloadSalesChart = salesChart.reload;
  const reloadLowStock = lowStock.reload;
  const reloadExpiringLots = expiringLots.reload;
  const reloadUpcomingEvents = upcomingEvents.reload;
  const reloadForecastTop = forecastTop.reload;

  const fetchAll = useCallback(async () => {
    await Promise.all([
      reloadSalesKpis(),
      reloadSalesChart(),
      reloadLowStock(),
      reloadExpiringLots(),
      reloadUpcomingEvents(),
      reloadForecastTop(),
    ]);
  }, [
    reloadSalesKpis,
    reloadSalesChart,
    reloadLowStock,
    reloadExpiringLots,
    reloadUpcomingEvents,
    reloadForecastTop,
  ]);

  return (
    <DashboardContext.Provider
      value={{
        salesKpis,
        salesChart,
        lowStock,
        expiringLots,
        upcomingEvents,
        forecastTop,
        loading,
        fetchAll,
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
}
