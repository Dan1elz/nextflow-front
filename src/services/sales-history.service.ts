import { ApiService } from "./api.service";
import { BaseService } from "./base.service";
import type { IIndexParams, PaginationDto } from "@/interfaces/api.interface";
import type {
  OrderDetailDto,
  OrderListItemDto,
} from "@/interfaces/quick-sale.interface";

const endpoint = "orders";
const apiService = new ApiService();

/** Histórico de vendas (T-VD3) e detalhe da venda (T-VD5). Sem estado: o token vem de quem chama. */
export const salesHistoryService = {
  getAll: (
    params: IIndexParams | undefined,
    storeId: string | null,
    token?: string
  ) =>
    apiService.get<PaginationDto<OrderListItemDto>>(
      endpoint,
      { ...BaseService.toQuery(params), storeId: storeId ?? undefined },
      token
    ),

  getById: (id: string, token?: string) =>
    apiService.get<OrderDetailDto>(`${endpoint}/${id}`, undefined, token),
};
