import type {
  IForecastRecommendation,
  IForecastRun,
} from "@/interfaces/forecast.interface";
import {
  TLegacyRecommendationAction,
  TLegacyRecommendationStatus,
  TUnitType,
} from "@/types/enums";
import { formatNumber } from "./format.helpers";

const UNIT_SHORT_LABELS: Record<number, string> = {
  [TUnitType.Unit]: "un",
  [TUnitType.Kilogram]: "kg",
  [TUnitType.Liter]: "L",
  [TUnitType.Meter]: "m",
};

/** Abreviação da unidade de medida (un, kg, L, m). */
export function getUnitShortLabel(unitType?: number | null): string {
  if (unitType === undefined || unitType === null) return "un";
  return UNIT_SHORT_LABELS[Number(unitType)] ?? "un";
}

/** Formata quantidade com unidade, usando casas decimais apenas quando necessário. */
export function formatQuantity(
  value: number | null | undefined,
  unitType?: number | null
): string {
  const n = Number(value ?? 0);
  const decimals = Number.isInteger(n) ? 0 : 2;
  return `${formatNumber(n, decimals)} ${getUnitShortLabel(unitType)}`;
}

/** Formata cobertura de estoque em dias ("—" quando não há demanda prevista). */
export function formatCoverageDays(days?: number | null): string {
  if (days === undefined || days === null || !Number.isFinite(Number(days)))
    return "—";
  const n = Math.round(Number(days));
  return `${formatNumber(n)} ${n === 1 ? "dia" : "dias"}`;
}

/** Formata percentual de desconto como "−15%". */
export function formatDiscount(percent?: number | null): string {
  if (percent === undefined || percent === null) return "—";
  const n = Number(percent);
  return `−${formatNumber(n, Number.isInteger(n) ? 0 : 1)}%`;
}

/** Formata índice sazonal (1,00 = média). */
export function formatSeasonalIndex(index?: number | null): string {
  if (index === undefined || index === null) return "—";
  return `${formatNumber(Number(index), 2)}×`;
}

export function isPendingRecommendation(rec: IForecastRecommendation): boolean {
  return rec.status === TLegacyRecommendationStatus.Pending;
}

export function isActionableRecommendation(
  rec: IForecastRecommendation
): boolean {
  return (
    isPendingRecommendation(rec) &&
    (rec.action === TLegacyRecommendationAction.Buy ||
      rec.action === TLegacyRecommendationAction.Promote)
  );
}

/**
 * Top N recomendações pendentes de Comprar/Promover, por prioridade (desc)
 * e, em empate, pelo prazo (deadline) mais próximo.
 */
export function getTopActionableRecommendations(
  recommendations: IForecastRecommendation[],
  limit = 5
): IForecastRecommendation[] {
  return recommendations
    .filter(isActionableRecommendation)
    .sort((a, b) => {
      if (b.priority !== a.priority) return b.priority - a.priority;
      const da = a.deadline ?? "9999-12-31";
      const db = b.deadline ?? "9999-12-31";
      return da.localeCompare(db);
    })
    .slice(0, limit);
}

/**
 * Substitui no run as recomendações atualizadas (retornadas pela API após uma ação)
 * e recalcula o contador de pendentes — mesma regra do backend (`counts.pending`):
 * apenas Comprar/Promover ainda pendentes (Manter não conta).
 */
export function mergeRecommendationsIntoRun(
  run: IForecastRun,
  updated: IForecastRecommendation[]
): IForecastRun {
  if (updated.length === 0) return run;
  const byId = new Map(updated.map((r) => [r.id, r]));
  const recommendations = run.recommendations.map((r) => byId.get(r.id) ?? r);
  return {
    ...run,
    recommendations,
    counts: {
      ...run.counts,
      pending: recommendations.filter(isActionableRecommendation).length,
    },
  };
}
