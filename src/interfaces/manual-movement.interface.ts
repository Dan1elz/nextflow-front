import type { TMovementReason, TMovementType } from "@/types/enums";

/**
 * T9: ajuste, perda ou saldo de abertura (`POST /api/stock-movements/manual`). Quantidade positiva; o sentido vem de
 * `type`. Só o saldo de abertura informa custo. `lotId`/`newLot` entram com a F1.7 (lotes); até lá a API recusa.
 */
export interface ManualMovementDto {
  variantId: string;
  locationId: string;
  type: TMovementType;
  reason: TMovementReason;
  quantity: number;
  unitCost?: number | null;
  note?: string | null;
}
