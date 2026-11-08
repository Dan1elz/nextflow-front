import { createContext } from "react";

import type {
  IIndexParams,
  IOption,
  IPaginationInfo,
} from "@/interfaces/api.interface";
import type {
  PromotionListItemDto,
  PromotionPreviewDto,
  PromotionRequestDto,
} from "@/interfaces/promotion.interface";

export type PromotionsContextType = {
  promotions: PromotionListItemDto[];
  pagination: IPaginationInfo | null;
  searchPromotions: (query?: IIndexParams) => Promise<void>;
  previewPromotion: (
    productId: string,
    variantId: string | null | undefined,
    discountPercent: number
  ) => Promise<PromotionPreviewDto>;
  createPromotion: (dto: PromotionRequestDto) => Promise<PromotionListItemDto>;
  /** Só a agendada (a API recusa as demais com 400). */
  updatePromotion: (
    id: string,
    dto: PromotionRequestDto
  ) => Promise<PromotionListItemDto>;
  cancelPromotion: (id: string) => Promise<void>;
  /** Produtos ativos para o combo do dialog (T-VD7: só produto ativo recebe promoção, RN-VD11). */
  searchProductOptions: (search: string) => Promise<IOption[]>;
  /** Variações não removidas do produto, para o escopo. */
  getVariantOptions: (productId: string) => Promise<IOption[]>;
};

export const PromotionsContext = createContext<PromotionsContextType | null>(
  null
);
