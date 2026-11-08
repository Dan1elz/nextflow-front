import { ApiService } from "./api.service";
import { BaseService } from "./base.service";
import type { IIndexParams, PaginationDto } from "@/interfaces/api.interface";
import type {
  IApplyPromotionRequest,
  IForecastAiBatch,
  IForecastSettings,
  IForecastSettingsRequest,
  IApplyPromotionResult,
  IApplyPurchaseRequest,
  IApplyPurchaseResult,
  IDismissRecommendationRequest,
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

  /** POST /api/forecasts/recommendations/{id}/promotion (T-DF6, Admin); 422 `confirm` abaixo do custo. */
  applyPromotion(
    id: string,
    request: IApplyPromotionRequest,
    token?: string
  ): Promise<IApplyPromotionResult> {
    return apiService.post<IApplyPromotionResult>(
      `forecasts/recommendations/${id}/promotion`,
      request,
      token
    );
  },

  /** POST /api/forecasts/recommendations/{id}/dismiss (T-DF8): exige corpo, mesmo vazio; devolve a linha. */
  dismiss(
    id: string,
    request: IDismissRecommendationRequest,
    token?: string
  ): Promise<IForecastRecommendationListItem> {
    return apiService.post<IForecastRecommendationListItem>(
      `forecasts/recommendations/${id}/dismiss`,
      request,
      token
    );
  },

  /** GET /api/forecasts?offset&limit&filters (T-DF9): status, trigger, from, to. */
  getAll(
    params?: IIndexParams,
    token?: string
  ): Promise<PaginationDto<IForecastRunSummary>> {
    return apiService.get<PaginationDto<IForecastRunSummary>>(
      "forecasts",
      BaseService.toQuery(params),
      token
    );
  },

  /** GET /api/forecasts/{runId} */
  getById(runId: string, token?: string): Promise<IForecastRunSummary> {
    return apiService.get<IForecastRunSummary>(
      `forecasts/${runId}`,
      undefined,
      token
    );
  },

  /** GET /api/forecasts/{runId}/batches */
  getBatches(runId: string, token?: string): Promise<IForecastAiBatch[]> {
    return apiService.get<IForecastAiBatch[]>(
      `forecasts/${runId}/batches`,
      undefined,
      token
    );
  },

  /** GET /api/settings/forecast (T-DF11) */
  getSettings(token?: string): Promise<IForecastSettings> {
    return apiService.get<IForecastSettings>(
      "settings/forecast",
      undefined,
      token
    );
  },

  /** PUT /api/settings/forecast: devolve o agendamento salvo com a próxima execução. */
  updateSettings(
    request: IForecastSettingsRequest,
    token?: string
  ): Promise<IForecastSettings> {
    return apiService.put<IForecastSettings>(
      "settings/forecast",
      request,
      token
    );
  },
};
