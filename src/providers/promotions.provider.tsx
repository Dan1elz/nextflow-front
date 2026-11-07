import { useCallback, useState, type ReactNode } from "react";

import { PromotionsContext } from "@/contexts/promotions.context";
import { useAuth } from "@/hooks/use-auth";
import type {
  IIndexParams,
  IOption,
  IPaginationInfo,
} from "@/interfaces/api.interface";
import type {
  PromotionListItemDto,
  PromotionRequestDto,
} from "@/interfaces/promotion.interface";
import { productService } from "@/services/product.service";
import { promotionService } from "@/services/promotion.service";

export function PromotionsProvider({ children }: { children: ReactNode }) {
  const [promotions, setPromotions] = useState<PromotionListItemDto[]>([]);
  const [pagination, setPagination] = useState<IPaginationInfo | null>(null);
  const { token } = useAuth();
  const auth = token ?? undefined;

  const searchPromotions = useCallback(
    async (query?: IIndexParams) => {
      const page = query?.page ?? 1;
      const perPage = query?.perPage ?? 10;
      const response = await promotionService.getAll(query, auth);
      setPromotions(response.items || []);
      setPagination({
        currentPage: page,
        lastPage: Math.ceil(response.total / perPage) || 1,
        total: response.total,
        perPage,
      });
    },
    [auth]
  );

  const previewPromotion = useCallback(
    (
      productId: string,
      variantId: string | null | undefined,
      discountPercent: number
    ) => promotionService.preview(productId, variantId, discountPercent, auth),
    [auth]
  );

  const createPromotion = useCallback(
    (dto: PromotionRequestDto) => promotionService.create(dto, auth),
    [auth]
  );

  const cancelPromotion = useCallback(
    (id: string) => promotionService.cancel(id, auth),
    [auth]
  );

  const searchProductOptions = useCallback(
    async (search: string): Promise<IOption[]> => {
      const page = await productService.getAll(
        {
          filters: { isActive: "true", ...(search ? { search } : {}) },
          perPage: 20,
        },
        auth
      );
      return page.items.map((product) => ({
        value: product.id,
        label: product.name,
      }));
    },
    [auth]
  );

  const getVariantOptions = useCallback(
    async (productId: string): Promise<IOption[]> => {
      const variants = await productService.variants(productId, auth);
      return variants.map((variant) => ({
        value: variant.id,
        label: variant.label
          ? `${variant.label} (${variant.sku})`
          : variant.sku,
      }));
    },
    [auth]
  );

  return (
    <PromotionsContext.Provider
      value={{
        promotions,
        pagination,
        searchPromotions,
        previewPromotion,
        createPromotion,
        cancelPromotion,
        searchProductOptions,
        getVariantOptions,
      }}
    >
      {children}
    </PromotionsContext.Provider>
  );
}
