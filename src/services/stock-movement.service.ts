import type { IIndexParams, PaginationDto } from "@/interfaces/api.interface";
import type { StockMovementListItemDto } from "@/interfaces/stock-movement.interface";
import type { LocationOptionDto } from "@/interfaces/store.interface";
import { ApiService } from "./api.service";
import { BaseService } from "./base.service";

const apiService = new ApiService();

/** Kardex (T8): só leitura. Movimentação não é editada nem excluída (RN-CE14). */
export const stockMovementService = {
  getAll(
    params?: IIndexParams,
    token?: string
  ): Promise<PaginationDto<StockMovementListItemDto>> {
    return apiService.get<PaginationDto<StockMovementListItemDto>>(
      "stock-movements",
      BaseService.toQuery(params),
      token
    );
  },

  /** Locais ativos de lojas ativas, até 20; com `storeId`, só os da loja. */
  locationOptions(
    search?: string,
    storeId?: string | null,
    token?: string
  ): Promise<LocationOptionDto[]> {
    return apiService.get<LocationOptionDto[]>(
      "stock-locations/options",
      {
        search,
        filters: storeId ? JSON.stringify({ storeId }) : undefined,
      },
      token
    );
  },
};
