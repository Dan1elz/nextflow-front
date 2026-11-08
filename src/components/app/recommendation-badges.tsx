import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  BadgePercent,
  CheckCircle2,
  Clock,
  Hourglass,
  Minus,
  PauseCircle,
  ShoppingCart,
  Sparkles,
  Truck,
  XCircle,
} from "lucide-react";

import { Pill } from "@/components/app/forecast-badges";
import {
  FORECAST_CONFIDENCE_LABELS,
  FORECAST_RUN_STATUS_LABELS,
  RECOMMENDATION_ACTION_LABELS,
  RECOMMENDATION_PRIORITY_LABELS,
  RECOMMENDATION_STATUS_LABELS,
  TForecastConfidence,
  TForecastRunStatus,
  TRecommendationAction,
  TRecommendationPriority,
  TRecommendationStatus,
} from "@/types/enums";

/** Selos da previsão nova (enums pelo nome, `forecast.interface.ts`). */

export function ActionPill({ action }: { action: TRecommendationAction }) {
  const label = RECOMMENDATION_ACTION_LABELS[action] ?? action;
  if (action === TRecommendationAction.Buy)
    return (
      <Pill tone="indigo" icon={<ShoppingCart />}>
        {label}
      </Pill>
    );
  if (action === TRecommendationAction.Promote)
    return (
      <Pill tone="violet" icon={<BadgePercent />}>
        {label}
      </Pill>
    );
  if (action === TRecommendationAction.Transfer)
    return (
      <Pill tone="sky" icon={<Truck />}>
        {label}
      </Pill>
    );
  return (
    <Pill tone="slate" icon={<PauseCircle />}>
      {label}
    </Pill>
  );
}

export function PriorityPill({
  priority,
}: {
  priority: TRecommendationPriority;
}) {
  const label = RECOMMENDATION_PRIORITY_LABELS[priority] ?? priority;
  if (priority === TRecommendationPriority.High)
    return (
      <Pill tone="rose" icon={<ArrowUp />}>
        {label}
      </Pill>
    );
  if (priority === TRecommendationPriority.Medium)
    return (
      <Pill tone="amber" icon={<Minus />}>
        {label}
      </Pill>
    );
  return (
    <Pill tone="slate" icon={<ArrowDown />}>
      {label}
    </Pill>
  );
}

export function ConfidencePill({
  confidence,
}: {
  confidence: TForecastConfidence;
}) {
  const label = FORECAST_CONFIDENCE_LABELS[confidence] ?? confidence;
  const tone =
    confidence === TForecastConfidence.High
      ? "emerald"
      : confidence === TForecastConfidence.Medium
        ? "amber"
        : "rose";
  return (
    <Pill tone={tone} title="Confiança da previsão (meses de histórico)">
      {label}
    </Pill>
  );
}

export function RecommendationStatusPill({
  status,
}: {
  status: TRecommendationStatus;
}) {
  const label = RECOMMENDATION_STATUS_LABELS[status] ?? status;
  switch (status) {
    case TRecommendationStatus.Applied:
      return (
        <Pill tone="emerald" icon={<CheckCircle2 />}>
          {label}
        </Pill>
      );
    case TRecommendationStatus.Dismissed:
      return (
        <Pill tone="slate" icon={<XCircle />}>
          {label}
        </Pill>
      );
    case TRecommendationStatus.Expired:
      return (
        <Pill tone="slate" icon={<Hourglass />}>
          {label}
        </Pill>
      );
    default:
      return (
        <Pill tone="amber" icon={<Clock />}>
          {label}
        </Pill>
      );
  }
}

export function RunStatusPill({ status }: { status: TForecastRunStatus }) {
  const label = FORECAST_RUN_STATUS_LABELS[status] ?? status;
  if (status === TForecastRunStatus.Running)
    return (
      <Pill tone="sky" icon={<Clock />}>
        {label}
      </Pill>
    );
  if (status === TForecastRunStatus.Failed)
    return (
      <Pill tone="rose" icon={<AlertTriangle />}>
        {label}
      </Pill>
    );
  if (status === TForecastRunStatus.CompletedWithoutAi)
    return (
      <Pill
        tone="amber"
        icon={<AlertTriangle />}
        title="A IA não respondeu; as recomendações vêm só do cálculo."
      >
        {label}
      </Pill>
    );
  return (
    <Pill tone="emerald" icon={<Sparkles />}>
      {label}
    </Pill>
  );
}

export function AiAdjustedPill() {
  return (
    <Pill
      tone="violet"
      icon={<Sparkles />}
      title="A IA mudou a ação ou a quantidade calculada"
    >
      IA ajustou
    </Pill>
  );
}
