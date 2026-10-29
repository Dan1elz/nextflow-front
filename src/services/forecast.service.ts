import { BaseService } from "./base.service";
import { ApiService } from "./api.service";
import type {
  IApplyPromotionRequest,
  IApplyPurchaseRequest,
  IApplyPurchaseResult,
  IForecastRecommendation,
  IForecastRun,
  IForecastRunSummary,
  IProductForecast,
} from "@/interfaces/forecast.interface";

const baseService = new BaseService<IForecastRunSummary>("forecasts");
const apiService = new ApiService();

export const forecastService = {
  /** GET /api/forecasts — histórico paginado de análises */
  getAll: baseService.getAll.bind(baseService),

  /** GET /api/forecasts/{id} */
  async getById(id: string, token?: string): Promise<IForecastRun> {
    const response = await apiService.get<IForecastRun>(
      `forecasts/${id}`,
      undefined,
      token
    );
    return response;
  },

  /** POST /api/forecasts/generate (Admin) — pode levar até ~60s */
  async generate(horizonMonths: number, token?: string): Promise<IForecastRun> {
    const response = await apiService.post<IForecastRun>(
      "forecasts/generate",
      { horizonMonths },
      token
    );
    return response;
  },

  /** GET /api/forecasts/latest — `null` quando nunca houve análise */
  async getLatest(token?: string): Promise<IForecastRun | null> {
    const response = await apiService.get<IForecastRun | null>(
      "forecasts/latest",
      undefined,
      token
    );
    return response ?? null;
  },

  /** GET /api/forecasts/products/{productId}?months=24 */
  async getProductForecast(
    productId: string,
    months = 24,
    token?: string
  ): Promise<IProductForecast> {
    const response = await apiService.get<IProductForecast>(
      `forecasts/products/${productId}`,
      { months },
      token
    );
    return response;
  },

  /** POST /api/forecasts/recommendations/purchase */
  async applyPurchase(
    request: IApplyPurchaseRequest,
    token?: string
  ): Promise<IApplyPurchaseResult> {
    const response = await apiService.post<IApplyPurchaseResult>(
      "forecasts/recommendations/purchase",
      request,
      token
    );
    return response;
  },

  /** POST /api/forecasts/recommendations/{id}/promotion (Admin) */
  async applyPromotion(
    recommendationId: string,
    request: IApplyPromotionRequest,
    token?: string
  ): Promise<IForecastRecommendation> {
    const response = await apiService.post<IForecastRecommendation>(
      `forecasts/recommendations/${recommendationId}/promotion`,
      request,
      token
    );
    return response;
  },

  /** POST /api/forecasts/recommendations/{id}/dismiss */
  async dismiss(
    recommendationId: string,
    reason?: string,
    token?: string
  ): Promise<IForecastRecommendation> {
    const response = await apiService.post<IForecastRecommendation>(
      `forecasts/recommendations/${recommendationId}/dismiss`,
      { reason: reason?.trim() ? reason.trim() : null },
      token
    );
    return response;
  },
};
