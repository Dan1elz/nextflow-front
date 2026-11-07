import type { TMovementReason, TMovementType } from "@/types/enums";

/**
 * T9: ajuste, perda ou saldo de abertura (`POST /api/stock-movements/manual`). Quantidade positiva; o sentido vem de
 * `type`. Só o saldo de abertura informa custo. Produto com lote (F1.7): `lotId` (existente) ou `newLot` (só na
 * entrada); na saída sem lote a API baixa pelo lote que vence primeiro (FEFO).
 */
export interface ManualMovementDto {
  variantId: string;
  locationId: string;
  lotId?: string | null;
  newLot?: { code: string; expiresOn: string } | null;
  type: TMovementType;
  reason: TMovementReason;
  quantity: number;
  unitCost?: number | null;
  note?: string | null;
}

/** Lote da variação com o saldo no local (`GET /api/stock/lots/options`, F1.7). */
export interface LotOptionDto {
  id: string;
  code: string;
  expiresOn: string;
  quantity: number;
}
