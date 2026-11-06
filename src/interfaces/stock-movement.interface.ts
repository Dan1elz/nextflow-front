import type {
  TMovementReason,
  TMovementType,
  TSourceType,
} from "@/types/enums";

/** Documento que gerou a movimentação. `number` entra com cada documento (F2); lançamento manual vem sem origem. */
export interface StockMovementSourceDto {
  type: TSourceType;
  id: string;
  number?: number | null;
}

/**
 * Linha do kardex (T8). `quantity` leva o sinal (entrada positiva, saída negativa) e `balanceAfter` é o saldo da
 * variação no local logo depois do lançamento, gravado pela API (RN-CE01). Lote entra na F1.7.
 */
export interface StockMovementListItemDto {
  id: string;
  createdAt: string;
  productId: string;
  productName: string;
  variantId: string;
  variantLabel: string;
  locationId: string;
  locationName: string;
  lotCode?: string | null;
  type: TMovementType;
  reason: TMovementReason;
  quantity: number;
  unitCost?: number | null;
  balanceAfter: number;
  source?: StockMovementSourceDto | null;
  userName: string;
  note?: string | null;
}
