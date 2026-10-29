import { useState, useCallback, type ReactNode } from "react";
import type { IPaginationInfo, IIndexParams } from "@/interfaces/api.interface";
import { useAuth } from "@/hooks/use-auth";
import type {
  ICreatePromotion,
  IPromotion,
} from "@/interfaces/promotion.interface";
import { PromotionsContext } from "@/contexts/promotions.context";
import { promotionService } from "@/services/promotion.service";

export function PromotionsProvider({ children }: { children: ReactNode }) {
  const [promotions, setPromotions] = useState<IPromotion[]>([]);
  const [pagination, setPagination] = useState<IPaginationInfo | null>(null);
  const { token } = useAuth();

  const searchPromotions = useCallback(
    async (query?: IIndexParams) => {
      const page = query?.page ?? 1;
      const perPage = query?.perPage ?? 10;

      const response = await promotionService.getAll(query, token ?? undefined);
      setPromotions(response.items || []);
      setPagination({
        currentPage: page,
        lastPage: Math.ceil((response.total || 0) / perPage) || 1,
        total: response.total || 0,
        perPage,
      });
    },
    [token]
  );

  const getPromotionById = useCallback(
    async (id: string): Promise<IPromotion> => {
      return promotionService.getById(id, token ?? undefined);
    },
    [token]
  );

  const createPromotion = useCallback(
    async (data: ICreatePromotion): Promise<IPromotion> => {
      return promotionService.create(data, token ?? undefined);
    },
    [token]
  );

  const cancelPromotion = useCallback(
    async (id: string): Promise<void> => {
      await promotionService.cancel(id, token ?? undefined);
    },
    [token]
  );

  return (
    <PromotionsContext.Provider
      value={{
        promotions,
        pagination,
        searchPromotions,
        getPromotionById,
        createPromotion,
        cancelPromotion,
      }}
    >
      {children}
    </PromotionsContext.Provider>
  );
}
