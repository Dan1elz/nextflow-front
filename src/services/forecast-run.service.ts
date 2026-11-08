import { ApiService } from "./api.service";
import { BaseService } from "./base.service";
import type { IIndexParams, PaginationDto } from "@/interfaces/api.interface";
import type {
  IForecastRecommendationListItem,
  IForecastRunProgress,
  IForecastRunSummary,
} from "@/interfaces/forecast.interface";

const apiService = new ApiService();

/** Análise da previsão e a lista de recomendações (T-DF2). */
export const forecastRunService = {
  /** GET /api/forecasts/latest: `null` quando nunca houve análise. */
  async getLatest(token?: string): Promise<IForecastRunSummary | null> {
    const run = await apiService.get<IForecastRunSummary | null>(
      "forecasts/latest",
      undefined,
      token
    );
    return run ?? null;
  },

  /** POST /api/forecasts/generate (Admin): sem horizonte; devolve a análise em andamento, 409 se já houver uma. */
  generate(token?: string): Promise<IForecastRunSummary> {
    return apiService.post<IForecastRunSummary>(
      "forecasts/generate",
      {},
      token
    );
  },

  /** GET /api/forecasts/{runId}/status */
  getStatus(runId: string, token?: string): Promise<IForecastRunProgress> {
    return apiService.get<IForecastRunProgress>(
      `forecasts/${runId}/status`,
      undefined,
      token
    );
  },

  /** GET /api/forecasts/{runId}/recommendations?offset&limit&filters&sort&order */
  getRecommendations(
    runId: string,
    params?: IIndexParams,
    token?: string
  ): Promise<PaginationDto<IForecastRecommendationListItem>> {
    return apiService.get<PaginationDto<IForecastRecommendationListItem>>(
      `forecasts/${runId}/recommendations`,
      BaseService.toQuery(params),
      token
    );
  },
};
