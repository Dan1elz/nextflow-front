import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { useAuth } from "@/hooks/use-auth";
import {
  ForecastRunContext,
  type ForecastFilterOptions,
  type ForecastRecommendationQuery,
} from "@/contexts/forecast-run.context";
import type {
  IForecastRecommendationFilters,
  IForecastRecommendationListItem,
  IForecastRunProgress,
  IForecastRunSummary,
} from "@/interfaces/forecast.interface";
import { ApiError } from "@/services/api.service";
import { forecastRunService } from "@/services/forecast-run.service";
import { productService } from "@/services/product.service";
import { TForecastRunStatus } from "@/types/enums";
import { handleError } from "@/utils/toast.helpers";

/** De quanto em quanto tempo a tela consulta o `/status` da análise em andamento (L-DF1). */
export const FORECAST_STATUS_POLL_MS = 5_000;

/** A lista abre nas pendentes, que são as que pedem decisão. */
const DEFAULT_RECOMMENDATION_QUERY: ForecastRecommendationQuery = {
  page: 1,
  perPage: 20,
  filters: { status: "Pending" },
};

const RUN_ERROR = "Não foi possível carregar a última análise.";
const LIST_ERROR = "Não foi possível carregar as recomendações.";

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

type ForecastRunProviderProps = {
  children: ReactNode;
  /** Só os testes encurtam o intervalo. */
  pollIntervalMs?: number;
};

export function ForecastRunProvider({
  children,
  pollIntervalMs = FORECAST_STATUS_POLL_MS,
}: ForecastRunProviderProps) {
  const { token } = useAuth();
  const authToken = token ?? undefined;

  const [run, setRun] = useState<IForecastRunSummary | null>(null);
  const [runLoaded, setRunLoaded] = useState(false);
  const [runError, setRunError] = useState<string | null>(null);
  const [progress, setProgress] = useState<IForecastRunProgress | null>(null);
  const [generating, setGenerating] = useState(false);
  const [conflictMessage, setConflictMessage] = useState<string | null>(null);

  const [items, setItems] = useState<IForecastRecommendationListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [recommendationsLoading, setRecommendationsLoading] = useState(false);
  const [recommendationsError, setRecommendationsError] = useState<
    string | null
  >(null);
  const [query, setQueryState] = useState(DEFAULT_RECOMMENDATION_QUERY);

  const reloadRun = useCallback(async () => {
    try {
      setRun(await forecastRunService.getLatest(authToken));
      setRunError(null);
    } catch (error) {
      setRunError(errorMessage(error, RUN_ERROR));
    } finally {
      setRunLoaded(true);
    }
  }, [authToken]);

  useEffect(() => {
    void reloadRun();
  }, [reloadRun]);

  // ---------- Análise em andamento: consulta o /status até terminar e então relê o cabeçalho ----------

  const runningId = run?.status === TForecastRunStatus.Running ? run.id : null;
  const pollingRef = useRef(false);

  const pollStatus = useCallback(
    async (runId: string) => {
      if (pollingRef.current) return;
      pollingRef.current = true;
      try {
        const current = await forecastRunService.getStatus(runId, authToken);
        if (current.status === TForecastRunStatus.Running) {
          setProgress(current);
          return;
        }
        setProgress(null);
        setConflictMessage(null);
        await reloadRun();
      } catch {
        // Falha de rede no meio da análise: tenta de novo no próximo ciclo.
      } finally {
        pollingRef.current = false;
      }
    },
    [authToken, reloadRun]
  );

  useEffect(() => {
    if (!runningId) return;
    void pollStatus(runningId);
    const timer = window.setInterval(() => {
      void pollStatus(runningId);
    }, pollIntervalMs);
    return () => window.clearInterval(timer);
  }, [runningId, pollIntervalMs, pollStatus]);

  const generate = useCallback(async () => {
    setGenerating(true);
    setConflictMessage(null);
    try {
      const started = await forecastRunService.generate(authToken);
      setProgress(null);
      setRun(started);
      setQueryState((prev) => ({ ...prev, page: 1 }));
    } catch (error) {
      if (error instanceof ApiError && error.isConflict) {
        // RN-DF23: já há uma em andamento; mostra o progresso dela.
        setConflictMessage(error.message);
        await reloadRun();
      } else {
        handleError(error, "Não foi possível gerar a análise.");
      }
    } finally {
      setGenerating(false);
    }
  }, [authToken, reloadRun]);

  // ---------- Recomendações da análise concluída ----------

  const listRunId =
    run && run.status !== TForecastRunStatus.Running ? run.id : null;
  const requestRef = useRef(0);

  const reloadRecommendations = useCallback(async () => {
    const requestId = ++requestRef.current;
    if (!listRunId) {
      setItems([]);
      setTotal(0);
      return;
    }
    setRecommendationsLoading(true);
    try {
      const filters = Object.fromEntries(
        Object.entries(query.filters).filter(([, value]) => value?.trim())
      ) as Record<string, string>;
      const page = await forecastRunService.getRecommendations(
        listRunId,
        { page: query.page, perPage: query.perPage, filters },
        authToken
      );
      if (requestId !== requestRef.current) return;
      setItems(page.items);
      setTotal(page.total);
      setRecommendationsError(null);
    } catch (error) {
      if (requestId !== requestRef.current) return;
      setRecommendationsError(errorMessage(error, LIST_ERROR));
    } finally {
      if (requestId === requestRef.current) setRecommendationsLoading(false);
    }
  }, [listRunId, query, authToken]);

  useEffect(() => {
    void reloadRecommendations();
  }, [reloadRecommendations]);

  const setFilters = useCallback(
    (filters: IForecastRecommendationFilters, replace = false) =>
      setQueryState((prev) => ({
        ...prev,
        page: 1,
        filters: replace ? filters : { ...prev.filters, ...filters },
      })),
    []
  );

  const setPage = useCallback(
    (page: number) => setQueryState((prev) => ({ ...prev, page })),
    []
  );

  const setPerPage = useCallback(
    (perPage: number) =>
      setQueryState((prev) => ({ ...prev, page: 1, perPage })),
    []
  );

  // ---------- Combos do painel de filtros: carregam na primeira abertura ----------

  const [filterOptions, setFilterOptions] =
    useState<ForecastFilterOptions | null>(null);

  const loadFilterOptions = useCallback(async () => {
    if (filterOptions) return;
    try {
      const { options } = await productService.form(undefined, authToken);
      setFilterOptions({
        categories: options.categories.map((category) => ({
          value: category.id,
          label: category.path,
        })),
        suppliers: options.suppliers.map((supplier) => ({
          value: supplier.id,
          label: supplier.name,
        })),
        events: options.events.map((event) => ({
          value: event.value,
          label: event.label,
        })),
      });
    } catch (error) {
      handleError(error, "Não foi possível carregar os filtros.");
    }
  }, [filterOptions, authToken]);

  const value = useMemo(
    () => ({
      run,
      runLoaded,
      runError,
      reloadRun,
      progress,
      generating,
      generate,
      conflictMessage,
      recommendations: items,
      total,
      recommendationsLoading,
      recommendationsError,
      reloadRecommendations,
      query,
      setFilters,
      setPage,
      setPerPage,
      filterOptions,
      loadFilterOptions,
    }),
    [
      run,
      runLoaded,
      runError,
      reloadRun,
      progress,
      generating,
      generate,
      conflictMessage,
      items,
      total,
      recommendationsLoading,
      recommendationsError,
      reloadRecommendations,
      query,
      setFilters,
      setPage,
      setPerPage,
      filterOptions,
      loadFilterOptions,
    ]
  );

  return (
    <ForecastRunContext.Provider value={value}>
      {children}
    </ForecastRunContext.Provider>
  );
}
