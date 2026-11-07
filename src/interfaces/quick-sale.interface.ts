import type {
  TOrderChannel,
  TOrderStatus,
  TPaymentMethod,
  TSaleUnit,
} from "@/types/enums";

/** Linha da venda rápida (T-VD2). O preço cobrado é o efetivo do dia, calculado pela API (RN-VD02). */
export interface QuickSaleItemDto {
  variantId: string;
  quantity: number;
  /** Desconto em R$ da linha (RN-VD03). */
  discount: number;
  lotId?: string | null;
  /** `effectivePrice` que o seletor mostrou; diferente do atual, a API pede confirmação. */
  expectedUnitPrice?: number;
}

export interface QuickSalePaymentDto {
  method: TPaymentMethod;
  amount: number;
}

export interface QuickSaleDto {
  storeId: string;
  saleLocationId?: string | null;
  clientId?: string | null;
  items: QuickSaleItemDto[];
  payments: QuickSalePaymentDto[];
  cashReceived?: number | null;
  confirmWarnings?: boolean;
}

export interface OrderItemPromotionDto {
  id: string;
  discountPercent: number;
}

/** Prévia do rodapé (T-VD2): tudo calculado pela API, nada é gravado. */
export interface QuickSalePreviewDto {
  items: {
    variantId: string;
    listPrice: number;
    unitPrice: number;
    discount: number;
    lineTotal: number;
    promotion: OrderItemPromotionDto | null;
  }[];
  subtotal: number;
  discountTotal: number;
  total: number;
  paid: number;
  remaining: number;
  change: number | null;
}

export interface OrderRefDto {
  id: string;
  name: string;
}

/** Detalhe do pedido (T-VD5); a F2.4 recebe da venda rápida. */
export interface OrderDetailDto {
  id: string;
  number: number;
  status: TOrderStatus;
  channel: TOrderChannel;
  store: OrderRefDto | null;
  saleLocation: OrderRefDto | null;
  client: { id: string; name: string; cpf: string | null } | null;
  user: OrderRefDto | null;
  createdAt: string;
  paidAt: string | null;
  items: {
    id: string;
    productId: string;
    productName: string;
    variantId: string;
    variantLabel: string | null;
    sku: string;
    quantity: number;
    saleUnit: TSaleUnit;
    decimalPlaces: number;
    listPrice: number;
    unitPrice: number;
    discount: number;
    lineTotal: number;
    promotion: OrderItemPromotionDto | null;
    unitCost: number | null;
    marginPercent: number | null;
  }[];
  subtotal: number;
  discountTotal: number;
  total: number;
  cashReceived: number | null;
  change: number | null;
  payments: {
    id: string;
    method: TPaymentMethod;
    amount: number;
    createdAt: string;
  }[];
  allowedActions: string[];
}

/** Linha do histórico de vendas (T-VD3): totais e formas de pagamento vêm prontos da API. */
export interface OrderListItemDto {
  id: string;
  number: number;
  status: TOrderStatus;
  channel: TOrderChannel;
  createdAt: string;
  paidAt: string | null;
  /** Nulo = consumidor final. */
  clientName: string | null;
  storeName: string;
  saleLocationName: string;
  userName: string;
  itemCount: number;
  total: number;
  paymentMethods: TPaymentMethod[];
}
