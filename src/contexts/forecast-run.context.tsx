import { createContext } from "react";

import type { IOption } from "@/interfaces/api.interface";
import type {
  IForecastRecommendationFilters,
  IForecastRecommendationListItem,
  IForecastRunProgress,
  IForecastRunSummary,
} from "@/interfaces/forecast.interface";

/** Página, tamanho e filtros da lista de recomendações. */
export type ForecastRecommendationQuery = {
  page: number;
  perPage: number;
  filters: IForecastRecommendationFilters;
};

/** Combos do painel de filtros (vêm de `GET /products/form`). */
export type ForecastFilterOptions = {
  categories: IOption[];
  suppliers: IOption[];
  events: IOption[];
};

export type ForecastRunContextType = {
  /** Última análise (`null` quando nunca houve). */
  run: IForecastRunSummary | null;
  /** `true` depois da primeira tentativa de carregar a última análise. */
  runLoaded: boolean;
  runError: string | null;
  reloadRun: () => Promise<void>;
  /** Análise antiga aberta pelo histórico (T-DF9): sem gerar e sem ações nas linhas. */
  readOnly: boolean;
  /** Progresso da análise em andamento, pelo `/status` (nulo fora do `Running`). */
  progress: IForecastRunProgress | null;
  /** O `POST generate` está no ar. */
  generating: boolean;
  generate: () => Promise<void>;
  /** Mensagem do 409 (já existe análise em andamento); some quando ela termina. */
  conflictMessage: string | null;
  recommendations: IForecastRecommendationListItem[];
  total: number;
  recommendationsLoading: boolean;
  recommendationsError: string | null;
  reloadRecommendations: () => Promise<void>;
  query: ForecastRecommendationQuery;
  /** Junta (ou troca, com `replace`) os filtros e volta para a página 1. */
  setFilters: (
    filters: IForecastRecommendationFilters,
    replace?: boolean
  ) => void;
  setPage: (page: number) => void;
  setPerPage: (perPage: number) => void;
  filterOptions: ForecastFilterOptions | null;
  loadFilterOptions: () => Promise<void>;
};

export const ForecastRunContext = createContext<ForecastRunContextType | null>(
  null
);
