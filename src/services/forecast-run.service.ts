import { ApiService } from "./api.service";
import { BaseService } from "./base.service";
import type { IIndexParams, PaginationDto } from "@/interfaces/api.interface";
import type {
  IApplyPurchaseRequest,
  IApplyPurchaseResult,
  IForecastRecommendationDetail,
  IForecastRecommendationListItem,
  IForecastRunProgress,
  IForecastRunSummary,
  IProductForecast,
} from "@/interfaces/forecast.interface";

const apiService = new ApiService();

/** Análise da previsão, a lista de recomendações (T-DF2) e o detalhe (T-DF3, T-DF5). */
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

  /** GET /api/forecasts/recommendations/{id} (T-DF3) */
  getRecommendation(
    id: string,
    token?: string
  ): Promise<IForecastRecommendationDetail> {
    return apiService.get<IForecastRecommendationDetail>(
      `forecasts/recommendations/${id}`,
      undefined,
      token
    );
  },

  /** GET /api/forecasts/products/{productId}?months=24 (T-DF5): não exige recomendação. */
  getProductForecast(
    productId: string,
    months = 24,
    token?: string
  ): Promise<IProductForecast> {
    return apiService.get<IProductForecast>(
      `forecasts/products/${productId}`,
      { months },
      token
    );
  },

  /** POST /api/forecasts/recommendations/purchase (T-DF4): um pedido em Orçamento por fornecedor. */
  applyPurchase(
    request: IApplyPurchaseRequest,
    token?: string
  ): Promise<IApplyPurchaseResult> {
    return apiService.post<IApplyPurchaseResult>(
      "forecasts/recommendations/purchase",
      request,
      token
    );
  },
};
