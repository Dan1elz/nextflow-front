import type { ProductSupplierResponseDto } from "@/interfaces/product.interface";
import { createContext } from "react";
import type {
  IIndexParams,
  IPaginationInfo,
  Option,
} from "@/interfaces/api.interface";
import type {
  PurchaseItemSuggestionDto,
  PurchaseOrderDetailDto,
  PurchaseOrderFormDto,
  PurchaseOrderListItemDto,
  PurchaseVariantOptionDto,
  ReceivePurchaseOrderDto,
  SavePurchaseOrderDto,
} from "@/interfaces/purchase-order.interface";
import type { LocationOptionDto } from "@/interfaces/store.interface";

export type PurchaseOrdersContextType = {
  purchaseOrders: PurchaseOrderListItemDto[];
  pagination: IPaginationInfo | null;
  /** Listagem da loja selecionada no topo (T-CP1). */
  searchPurchaseOrders: (query?: IIndexParams) => Promise<void>;
  getPurchaseOrder: (id: string) => Promise<PurchaseOrderDetailDto>;
  getPurchaseOrderForm: (id: string) => Promise<PurchaseOrderFormDto>;
  createPurchaseOrder: (
    dto: SavePurchaseOrderDto
  ) => Promise<PurchaseOrderDetailDto>;
  updatePurchaseOrder: (
    id: string,
    dto: SavePurchaseOrderDto
  ) => Promise<PurchaseOrderDetailDto>;
  sendPurchaseOrder: (
    id: string,
    version: number
  ) => Promise<PurchaseOrderDetailDto>;
  cancelPurchaseOrder: (
    id: string,
    version: number,
    reason: string
  ) => Promise<PurchaseOrderDetailDto>;
  receivePurchaseOrder: (
    id: string,
    dto: ReceivePurchaseOrderDto
  ) => Promise<PurchaseOrderDetailDto>;
  getItemSuggestion: (
    supplierId: string,
    variantId: string,
    storeId: string
  ) => Promise<PurchaseItemSuggestionDto>;
  searchVariantOptions: (
    supplierId: string,
    search: string,
    onlyLinked: boolean
  ) => Promise<PurchaseVariantOptionDto[]>;
  /** Combo de fornecedor ativo. */
  searchSupplierOptions: (search: string) => Promise<Option[]>;
  getLocationOptions: () => Promise<LocationOptionDto[]>;
  /** Local de entrega padrão da loja (`stores.defaultReceiveLocationId`, RN-CP07). */
  getDefaultReceiveLocationId: (storeId: string) => Promise<string | null>;
  /** Fornecedores do produto: o pedido aberto pelo painel já vem com o preferido. */
  getProductSuppliers: (
    productId: string
  ) => Promise<ProductSupplierResponseDto[]>;
};

export const PurchaseOrdersContext =
  createContext<PurchaseOrdersContextType | null>(null);
