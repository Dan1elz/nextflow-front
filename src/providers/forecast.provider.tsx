import { useState, useCallback, type ReactNode } from "react";
import { useAuth } from "@/hooks/use-auth";
import { forecastService } from "@/services/forecast.service";
import { ForecastContext } from "@/contexts/forecast.context";
import type {
  IApplyPromotionRequest,
  IApplyPurchaseRequest,
  IForecastRecommendation,
  IForecastRun,
} from "@/interfaces/forecast.interface";
import { mergeRecommendationsIntoRun } from "@/utils/forecast.helpers";

export function ForecastProvider({ children }: { children: ReactNode }) {
  const [latestRun, setLatestRun] = useState<IForecastRun | null>(null);
  const [latestLoaded, setLatestLoaded] = useState(false);
  const [loadingLatest, setLoadingLatest] = useState(false);
  const [latestError, setLatestError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const { token } = useAuth();

  const mergeIntoLatest = useCallback((updated: IForecastRecommendation[]) => {
    setLatestRun((prev) =>
      prev ? mergeRecommendationsIntoRun(prev, updated) : prev
    );
  }, []);

  const fetchLatest = useCallback(async () => {
    try {
      setLoadingLatest(true);
      setLatestError(null);
      const data = await forecastService.getLatest(token ?? undefined);
      setLatestRun(data);
    } catch (error) {
      setLatestError(
        error instanceof Error && error.message
          ? error.message
          : "Erro ao carregar a análise de demanda"
      );
    } finally {
      setLoadingLatest(false);
      setLatestLoaded(true);
    }
  }, [token]);

  const generateForecast = useCallback(
    async (horizonMonths: number): Promise<IForecastRun> => {
      try {
        setGenerating(true);
        const data = await forecastService.generate(
          horizonMonths,
          token ?? undefined
        );
        setLatestRun(data);
        setLatestError(null);
        setLatestLoaded(true);
        return data;
      } finally {
        setGenerating(false);
      }
    },
    [token]
  );

  const getProductForecast = useCallback(
    async (productId: string, months = 24) => {
      return forecastService.getProductForecast(
        productId,
        months,
        token ?? undefined
      );
    },
    [token]
  );

  const applyPurchase = useCallback(
    async (request: IApplyPurchaseRequest) => {
      const result = await forecastService.applyPurchase(
        request,
        token ?? undefined
      );
      mergeIntoLatest(result.recommendations ?? []);
      return result;
    },
    [token, mergeIntoLatest]
  );

  const applyPromotion = useCallback(
    async (recommendationId: string, request: IApplyPromotionRequest) => {
      const updated = await forecastService.applyPromotion(
        recommendationId,
        request,
        token ?? undefined
      );
      mergeIntoLatest([updated]);
      return updated;
    },
    [token, mergeIntoLatest]
  );

  const dismissRecommendation = useCallback(
    async (recommendationId: string, reason?: string) => {
      const updated = await forecastService.dismiss(
        recommendationId,
        reason,
        token ?? undefined
      );
      mergeIntoLatest([updated]);
      return updated;
    },
    [token, mergeIntoLatest]
  );

  return (
    <ForecastContext.Provider
      value={{
        latestRun,
        latestLoaded,
        loadingLatest,
        latestError,
        generating,
        fetchLatest,
        generateForecast,
        getProductForecast,
        applyPurchase,
        applyPromotion,
        dismissRecommendation,
      }}
    >
      {children}
    </ForecastContext.Provider>
  );
}
