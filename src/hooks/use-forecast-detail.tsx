import { useCallback, useEffect, useState } from "react";

import { useAuth } from "@/hooks/use-auth";
import { useSelectedStoreId } from "@/hooks/use-selected-store-id";
import type {
  IForecastRecommendationDetail,
  IProductForecast,
} from "@/interfaces/forecast.interface";
import { forecastRunService } from "@/services/forecast-run.service";

type Loaded<T> = { key: string; data: T | null; error: string | null };

/** Carrega um recurso por chave; troca de chave descarta a resposta antiga. */
function useKeyedLoad<T>(
  id: string | null,
  load: (id: string, token?: string) => Promise<T>,
  fallbackError: string
) {
  const { token } = useAuth();
  const [reloadToken, setReloadToken] = useState(0);
  const [result, setResult] = useState<Loaded<T> | null>(null);
  const requestKey = id ? `${id}:${reloadToken}` : "";

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    const key = `${id}:${reloadToken}`;
    load(id, token ?? undefined)
      .then((data) => {
        if (!cancelled) setResult({ key, data, error: null });
      })
      .catch((error: unknown) => {
        if (!cancelled)
          setResult({
            key,
            data: null,
            error:
              error instanceof Error && error.message
                ? error.message
                : fallbackError,
          });
      });
    return () => {
      cancelled = true;
    };
  }, [id, reloadToken, token, load, fallbackError]);

  const reload = useCallback(() => setReloadToken((n) => n + 1), []);
  const isCurrent = !!result && result.key === requestKey;

  return {
    data: isCurrent ? result.data : null,
    error: isCurrent ? result.error : null,
    loading: !!id && !isCurrent,
    reload,
  };
}

const loadProductForecast = (productId: string, token?: string) =>
  forecastRunService.getProductForecast(productId, 24, token);

/** `GET /forecasts/recommendations/{id}?storeId=` (T-DF3). `null` não carrega nada; trocar a loja do topo recarrega. */
export function useRecommendationDetail(id: string | null) {
  const storeId = useSelectedStoreId();
  const loadRecommendation = useCallback(
    (recommendationId: string, token?: string) =>
      forecastRunService.getRecommendation(recommendationId, token, storeId),
    [storeId]
  );
  return useKeyedLoad<IForecastRecommendationDetail>(
    id,
    loadRecommendation,
    "Erro ao carregar o detalhe da recomendação"
  );
}

/** `GET /forecasts/products/{productId}?months=24` (T-DF5). */
export function useProductForecast(productId: string | null) {
  return useKeyedLoad<IProductForecast>(
    productId,
    loadProductForecast,
    "Erro ao carregar a previsão do produto"
  );
}
