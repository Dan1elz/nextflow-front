import { createContext } from "react";
import type {
  IApplyPromotionRequest,
  IApplyPurchaseRequest,
  IApplyPurchaseResult,
  IForecastRecommendation,
  IForecastRun,
  IProductForecast,
} from "@/interfaces/forecast.interface";

export type ForecastContextType = {
  /** Última análise (`null` quando nunca houve análise ou ainda não carregou). */
  latestRun: IForecastRun | null;
  /** `true` após a primeira tentativa de carregar a última análise. */
  latestLoaded: boolean;
  loadingLatest: boolean;
  /** Mensagem de erro ao carregar a última análise (falha isolada, sem toast). */
  latestError: string | null;
  generating: boolean;
  fetchLatest: () => Promise<void>;
  generateForecast: (horizonMonths: number) => Promise<IForecastRun>;
  getProductForecast: (
    productId: string,
    months?: number
  ) => Promise<IProductForecast>;
  applyPurchase: (
    request: IApplyPurchaseRequest
  ) => Promise<IApplyPurchaseResult>;
  applyPromotion: (
    recommendationId: string,
    request: IApplyPromotionRequest
  ) => Promise<IForecastRecommendation>;
  dismissRecommendation: (
    recommendationId: string,
    reason?: string
  ) => Promise<IForecastRecommendation>;
};

export const ForecastContext = createContext<ForecastContextType | null>(null);
