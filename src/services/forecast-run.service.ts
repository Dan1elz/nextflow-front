import { ApiService } from "./api.service";
import { BaseService } from "./base.service";
import type { IIndexParams, PaginationDto } from "@/interfaces/api.interface";
import type {
  IApplyPromotionRequest,
  IForecastAccuracyProduct,
  IForecastAccuracySummary,
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
  IPromotionSuggestion,
  IPurchaseSuggestion,
  IStoreSplit,
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
    token?: string,
    storeId?: string | null
  ): Promise<PaginationDto<IForecastRecommendationListItem>> {
    return apiService.get<PaginationDto<IForecastRecommendationListItem>>(
      `forecasts/${runId}/recommendations`,
      { ...BaseService.toQuery(params), ...(storeId ? { storeId } : {}) },
      token
    );
  },

  /** GET /api/forecasts/recommendations/{id}?storeId= (T-DF3) */
  /** GET /forecasts/suggestions/purchase: quanto comprar da variação no local; `ai=false` só o cálculo (RN-DF30). */
  getPurchaseSuggestion(
    variantId: string,
    locationId: string,
    ai: boolean,
    token?: string
  ): Promise<IPurchaseSuggestion> {
    return apiService.get<IPurchaseSuggestion>(
      "forecasts/suggestions/purchase",
      { variantId, locationId, ai },
      token
    );
  },

  /** GET /forecasts/suggestions/promotion: desconto e dias para escoar o lote no local, pela IA (RN-DF30). */
  getPromotionSuggestion(
    lotId: string,
    locationId: string,
    token?: string
  ): Promise<IPromotionSuggestion> {
    return apiService.get<IPromotionSuggestion>(
      "forecasts/suggestions/promotion",
      { lotId, locationId },
      token
    );
  },

  /** GET /forecasts/recommendations/{id}/store-split: divisão sugerida entre as lojas (RN-DF27). */
  getStoreSplit(id: string, token?: string): Promise<IStoreSplit> {
    return apiService.get<IStoreSplit>(
      `forecasts/recommendations/${id}/store-split`,
      undefined,
      token
    );
  },

  getRecommendation(
    id: string,
    token?: string,
    storeId?: string | null
  ): Promise<IForecastRecommendationDetail> {
    return apiService.get<IForecastRecommendationDetail>(
      `forecasts/recommendations/${id}`,
      storeId ? { storeId } : undefined,
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
  /** POST /forecasts/recommendations/{id}/transfer: gera a transferência sugerida (F3.4b, RN-CE62). */
  applyTransfer(
    id: string,
    token?: string
  ): Promise<IForecastRecommendationListItem> {
    return apiService.post<IForecastRecommendationListItem>(
      `forecasts/recommendations/${id}/transfer`,
      {},
      token
    );
  },

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

  /** GET /api/forecasts/accuracy/summary?months=12 (T-DF10, Admin) */
  getAccuracySummary(
    months = 12,
    token?: string
  ): Promise<IForecastAccuracySummary> {
    return apiService.get<IForecastAccuracySummary>(
      "forecasts/accuracy/summary",
      { months },
      token
    );
  },

  /** GET /api/forecasts/accuracy/products?offset&limit&filters (T-DF10, Admin): search, abcClass, bias. */
  getAccuracyProducts(
    params?: IIndexParams,
    token?: string
  ): Promise<PaginationDto<IForecastAccuracyProduct>> {
    return apiService.get<PaginationDto<IForecastAccuracyProduct>>(
      "forecasts/accuracy/products",
      BaseService.toQuery(params),
      token
    );
  },
};
