import { createContext } from "react";
import type {
  ICreatePromotion,
  IPromotion,
} from "@/interfaces/promotion.interface";
import type { IIndexParams, IPaginationInfo } from "@/interfaces/api.interface";

export type PromotionsContextType = {
  promotions: IPromotion[];
  pagination: IPaginationInfo | null;
  searchPromotions: (query?: IIndexParams) => Promise<void>;
  getPromotionById: (id: string) => Promise<IPromotion>;
  createPromotion: (data: ICreatePromotion) => Promise<IPromotion>;
  cancelPromotion: (id: string) => Promise<void>;
};

export const PromotionsContext = createContext<PromotionsContextType | null>(
  null
);
