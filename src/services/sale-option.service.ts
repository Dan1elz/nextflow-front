import type {
  StockAvailabilityDto,
  VariantSaleOptionDto,
  VariantSaleOptionsParams,
} from "@/interfaces/sale-option.interface";
import { ApiService } from "./api.service";

const apiService = new ApiService();

/** Seletor de venda (T-VD1) e aviso de falta (T-VD1a). */
export const saleOptionService = {
  getVariantOptions(
    params: VariantSaleOptionsParams,
    token?: string
  ): Promise<VariantSaleOptionDto[]> {
    return apiService.get<VariantSaleOptionDto[]>(
      "sales/variant-options",
      {
        search: params.search,
        storeId: params.storeId,
        locationId: params.locationId,
        limit: params.limit,
      },
      token
    );
  },

  getAvailability(
    variantId: string,
    excludeLocationId: string,
    token?: string
  ): Promise<StockAvailabilityDto> {
    return apiService.get<StockAvailabilityDto>(
      "stock/availability",
      { variantId, excludeLocationId },
      token
    );
  },
};
