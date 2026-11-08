import type { LocationOptionDto } from "./store.interface";
import type { TLifecycle, TPurchaseStatus, TSaleUnit } from "@/types/enums";

/** Contrato de compras (`purchasing/contract.md`, T-CP1, T-CP2, T-CP3 e T-CP5). Recebimento (T-CP4) entra na F2.8. */

/** Linha da listagem (T-CP1). */
export interface PurchaseOrderListItemDto {
  id: string;
  number: number;
  supplierId: string;
  supplierName: string;
  receiveLocationId: string;
  receiveLocationName: string;
  storeName: string;
  status: TPurchaseStatus;
  itemCount: number;
  total: number;
  createdAt: string;
  sentAt?: string | null;
  expectedOn?: string | null;
  receivedAt?: string | null;
  realLeadTimeDays?: number | null;
  isLate: boolean;
  fromForecast: boolean;
}

export interface SavePurchaseItemDto {
  id?: string | null;
  variantId: string;
  quantity: number;
  unitCost: number;
}

/** Criar e editar (T-CP2). `version` obrigatória no update. */
export interface SavePurchaseOrderDto {
  supplierId: string;
  receiveLocationId: string;
  note?: string | null;
  version?: number | null;
  confirmWarnings?: boolean;
  items: SavePurchaseItemDto[];
}

/** Sugestão ao escolher a variação (T-CP2). */
export interface PurchaseItemSuggestionDto {
  variantId: string;
  productId: string;
  productName: string;
  variantLabel: string;
  sku: string;
  supplierSku?: string | null;
  saleUnit: TSaleUnit;
  decimalPlaces: number;
  tracksLots: boolean;
  lifecycle: TLifecycle;
  minOrderQty?: number | null;
  orderMultiple?: number | null;
  lastCostFromSupplier?: number | null;
  lastCost?: number | null;
  averageCost?: number | null;
  availableAtStore: number;
  incomingQuantity: number;
}

/** Resultado da busca de itens (`GET /purchase-orders/variant-options`). */
export interface PurchaseVariantOptionDto {
  variantId: string;
  productId: string;
  productName: string;
  variantLabel: string;
  sku: string;
  isLinked: boolean;
  barcode: string | null;
  imageUrl: string | null;
  /** Custo médio da variação; nulo sem entrada com custo. */
  averageCost: number | null;
}

export interface PurchaseOrderFormItemDto extends PurchaseItemSuggestionDto {
  id: string;
  quantity: number;
  unitCost: number;
  subtotal: number;
}

/** Formulário de edição (T-CP2). */
export interface PurchaseOrderFormDto {
  id: string;
  number: number;
  version: number;
  status: TPurchaseStatus;
  supplierId: string;
  supplierName: string;
  receiveLocationId: string;
  note?: string | null;
  leadTimeDays: number;
  expectedOn?: string | null;
  total: number;
  items: PurchaseOrderFormItemDto[];
  options: { locations: LocationOptionDto[] };
}

export interface PurchaseItemLotDto {
  lotCode: string;
  expiresOn: string;
  quantity: number;
}

export interface PurchaseOrderDetailItemDto {
  id: string;
  variantId: string;
  productId: string;
  productName: string;
  variantLabel: string;
  sku: string;
  supplierSku?: string | null;
  quantity: number;
  unitCost: number;
  subtotal: number;
  tracksLots: boolean;
  lots?: PurchaseItemLotDto[] | null;
  averageCostAfter?: number | null;
}

/** Lote de um item recebido (T-CP4, F1.7): código único por variação; os lotes somam a quantidade do item. */
export interface ReceivePurchaseLotDto {
  code: string;
  expiresOn: string;
  quantity: number;
}

/** Recebimento (T-CP4): cada item do pedido uma vez, sem recebimento parcial. */
export interface ReceivePurchaseOrderDto {
  version: number;
  items: { itemId: string; lots?: ReceivePurchaseLotDto[] | null }[];
}

/** Visualização (T-CP3) e resposta de criar, editar, enviar, cancelar e receber. */
export interface PurchaseOrderDetailDto {
  id: string;
  number: number;
  version: number;
  status: TPurchaseStatus;
  supplier: {
    id: string;
    name: string;
    cnpj: string;
    mainContact?: string | null;
  };
  receiveLocation: LocationOptionDto;
  note?: string | null;
  total: number;
  leadTimeDays: number;
  createdAt: string;
  createdByName: string;
  sentAt?: string | null;
  expectedOn?: string | null;
  receivedAt?: string | null;
  receivedByName?: string | null;
  realLeadTimeDays?: number | null;
  canceledAt?: string | null;
  cancelReason?: string | null;
  forecast?: {
    runId: string;
    recommendationId: string;
    runCreatedAt: string;
  } | null;
  items: PurchaseOrderDetailItemDto[];
}
