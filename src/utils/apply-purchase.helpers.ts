import type {
  IApplyPurchaseRequest,
  IForecastCalculation,
} from "@/interfaces/forecast.interface";

/** Linha editável do "Comprar" (T-DF4): uma por variação do rateio. */
export interface PurchaseLine {
  recommendationId: string;
  variantId: string;
  /** "Produto (variação)" ou só o produto, sem grade. */
  name: string;
  quantity: string;
  unitCost: string;
}

/** Grupo do pedido: um por fornecedor (RN-DF15). */
export interface PurchaseGroupDraft {
  supplierId: string;
  receiveLocationId: string;
  note: string;
  lines: PurchaseLine[];
}

/** Aceita vírgula ou ponto; vazio vira `NaN`. */
export function parseDecimal(value: string): number {
  if (!value.trim()) return NaN;
  return Number(value.replace(",", "."));
}

export function roundUpToMultiple(quantity: number, multiple: number): number {
  if (!(multiple > 0)) return quantity;
  return Math.ceil(quantity / multiple - 1e-9) * multiple;
}

export interface LineWarnings {
  /** Pedido mínimo quando a quantidade fica abaixo (RN-CE27). */
  belowMinimum: number | null;
  /** Múltiplo e a quantidade arredondada para cima (RN-CE30). */
  offMultiple: { multiple: number; rounded: number } | null;
}

/** Avisos que não bloqueiam (o back confirma o pedido gerado por conta própria). */
export function getLineWarnings(
  quantity: number,
  calculation: Pick<IForecastCalculation, "minOrderQty" | "orderMultiple">
): LineWarnings {
  if (!(quantity > 0)) return { belowMinimum: null, offMultiple: null };
  const { minOrderQty, orderMultiple } = calculation;
  const rounded =
    orderMultiple && orderMultiple > 0
      ? roundUpToMultiple(quantity, orderMultiple)
      : quantity;
  return {
    belowMinimum: minOrderQty && quantity < minOrderQty ? minOrderQty : null,
    offMultiple:
      orderMultiple && Math.abs(rounded - quantity) > 1e-9
        ? { multiple: orderMultiple, rounded }
        : null,
  };
}

export function lineKey(
  line: Pick<PurchaseLine, "recommendationId" | "variantId">
) {
  return `${line.recommendationId}:${line.variantId}`;
}

/**
 * Monta o `ApplyPurchaseDto` e o mapa de volta dos índices que o 422 usa:
 * `groups[g].<campo>` → fornecedor e `groups[g].items[k].<campo>` → linha.
 */
export function buildPurchaseRequest(groups: PurchaseGroupDraft[]): {
  request: IApplyPurchaseRequest;
  groupKeys: string[];
  itemKeys: string[][];
} {
  return {
    request: {
      groups: groups.map((group) => ({
        supplierId: group.supplierId,
        receiveLocationId: group.receiveLocationId,
        note: group.note.trim() ? group.note.trim() : null,
        items: group.lines.map((line) => ({
          recommendationId: line.recommendationId,
          variantId: line.variantId,
          quantity: parseDecimal(line.quantity),
          unitCost: parseDecimal(line.unitCost),
        })),
      })),
    },
    groupKeys: groups.map((group) => group.supplierId),
    itemKeys: groups.map((group) => group.lines.map(lineKey)),
  };
}

const FIELD_PATTERN = /^groups\[(\d+)\]\.(?:items\[(\d+)\]\.)?(\w+)$/i;

/** Lê uma chave de `fieldErrors` do 422 do "Comprar" (`groups[1].items[0].quantity`). */
export function parsePurchaseErrorField(
  field: string
): { group: number; item: number | null; name: string } | null {
  const match = FIELD_PATTERN.exec(field);
  if (!match) return null;
  const name = match[3];
  return {
    group: Number(match[1]),
    item: match[2] === undefined ? null : Number(match[2]),
    name: name.charAt(0).toLowerCase() + name.slice(1),
  };
}
