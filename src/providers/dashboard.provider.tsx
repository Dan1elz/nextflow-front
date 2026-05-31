import { useState, useCallback, type ReactNode } from "react";
import { useAuth } from "@/hooks/use-auth";
import { dashboardService } from "@/services/dashboard.service";
import type { IDashboardStats } from "@/interfaces/dashboard.interface";
import { DashboardContext } from "@/contexts/dashboard.context";
import { handleError } from "@/utils/toast.helpers";

export function DashboardProvider({ children }: { children: ReactNode }) {
  const [stats, setStats] = useState<IDashboardStats | null>(null);
  const [loading, setLoading] = useState(false);
  const { token } = useAuth();

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      const data = await dashboardService.getStats(token ?? undefined);
      setStats(data);
    } catch (error) {
      handleError(error, "Erro ao carregar dados do dashboard");
    } finally {
      setLoading(false);
    }
  }, [token]);

  return (
    <DashboardContext.Provider value={{ stats, loading, fetchStats }}>
      {children}
    </DashboardContext.Provider>
  );
}
