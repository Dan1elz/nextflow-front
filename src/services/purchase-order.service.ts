import { ApiService } from "./api.service";
import { BaseService } from "./base.service";
import type { IIndexParams, PaginationDto } from "@/interfaces/api.interface";
import type { LocationOptionDto } from "@/interfaces/store.interface";
import type {
  PurchaseItemSuggestionDto,
  PurchaseOrderDetailDto,
  PurchaseOrderFormDto,
  PurchaseOrderListItemDto,
  PurchaseVariantOptionDto,
  ReceivePurchaseOrderDto,
  SavePurchaseOrderDto,
} from "@/interfaces/purchase-order.interface";

const endpoint = "purchase-orders";
const apiService = new ApiService();

/** Pedido de compra (T-CP1, T-CP2, T-CP3, T-CP5). Sem estado: o token vem de quem chama. */
export const purchaseOrderService = {
  getAll: (
    params: IIndexParams | undefined,
    storeId: string | null,
    token?: string
  ) =>
    apiService.get<PaginationDto<PurchaseOrderListItemDto>>(
      endpoint,
      { ...BaseService.toQuery(params), storeId: storeId ?? undefined },
      token
    ),

  getById: (id: string, token?: string) =>
    apiService.get<PurchaseOrderDetailDto>(
      `${endpoint}/${id}`,
      undefined,
      token
    ),

  getForm: (id: string, token?: string) =>
    apiService.get<PurchaseOrderFormDto>(
      `${endpoint}/${id}/form`,
      undefined,
      token
    ),

  create: (dto: SavePurchaseOrderDto, token?: string) =>
    apiService.post<PurchaseOrderDetailDto>(endpoint, dto, token),

  update: (id: string, dto: SavePurchaseOrderDto, token?: string) =>
    apiService.put<PurchaseOrderDetailDto>(`${endpoint}/${id}`, dto, token),

  send: (id: string, version: number, token?: string) =>
    apiService.post<PurchaseOrderDetailDto>(
      `${endpoint}/${id}/send`,
      { version },
      token
    ),

  cancel: (id: string, version: number, reason: string, token?: string) =>
    apiService.post<PurchaseOrderDetailDto>(
      `${endpoint}/${id}/cancel`,
      { version, reason },
      token
    ),

  receive: (id: string, dto: ReceivePurchaseOrderDto, token?: string) =>
    apiService.post<PurchaseOrderDetailDto>(
      `${endpoint}/${id}/receive`,
      dto,
      token
    ),

  itemSuggestion: (
    supplierId: string,
    variantId: string,
    storeId: string,
    token?: string
  ) =>
    apiService.get<PurchaseItemSuggestionDto>(
      `${endpoint}/item-suggestion`,
      { supplierId, variantId, storeId },
      token
    ),

  /** Locais ativos de lojas ativas para o combo de entrega (T7). */
  locationOptions: (token?: string) =>
    apiService.get<LocationOptionDto[]>(
      "stock-locations/options",
      undefined,
      token
    ),

  variantOptions: (
    supplierId: string,
    search: string,
    onlyLinked: boolean,
    token?: string
  ) =>
    apiService.get<PurchaseVariantOptionDto[]>(
      `${endpoint}/variant-options`,
      { supplierId, search, onlyLinked, limit: 20 },
      token
    ),
};
