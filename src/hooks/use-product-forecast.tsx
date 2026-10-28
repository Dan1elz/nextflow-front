import { useCallback, useEffect, useState } from "react";
import { useForecast } from "@/hooks/use-forecast";
import type { IProductForecast } from "@/interfaces/forecast.interface";

type ProductForecastResult = {
  key: string;
  data: IProductForecast | null;
  error: string | null;
};

/**
 * Carrega `GET /forecasts/products/{productId}` (histórico + projeção + sazonalidade).
 * Deve ser usado dentro de um ForecastProvider.
 */
export function useProductForecast(productId: string | null, months = 24) {
  const { getProductForecast } = useForecast();
  const [reloadToken, setReloadToken] = useState(0);
  const [result, setResult] = useState<ProductForecastResult | null>(null);

  const requestKey = productId ? `${productId}:${months}:${reloadToken}` : "";

  useEffect(() => {
    if (!productId) return;
    let cancelled = false;
    const key = `${productId}:${months}:${reloadToken}`;

    getProductForecast(productId, months)
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
                : "Erro ao carregar a previsão do produto",
          });
      });

    return () => {
      cancelled = true;
    };
  }, [productId, months, reloadToken, getProductForecast]);

  const reload = useCallback(() => setReloadToken((n) => n + 1), []);

  const isCurrent = !!result && result.key === requestKey;

  return {
    data: isCurrent ? result.data : null,
    error: isCurrent ? result.error : null,
    loading: !!productId && !isCurrent,
    reload,
  };
}
