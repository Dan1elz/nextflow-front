import type { ReactNode } from "react";
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  BadgePercent,
  Ban,
  CalendarClock,
  CheckCircle2,
  CircleDashed,
  Clock,
  Hourglass,
  Minus,
  PauseCircle,
  ShoppingCart,
  Sparkles,
  XCircle,
} from "lucide-react";

import { cn } from "@/lib/utils";
import type { IForecastRecommendation } from "@/interfaces/forecast.interface";
import { formatDateOnly } from "@/utils/format.helpers";
import { formatDiscount, formatQuantity } from "@/utils/forecast.helpers";
import {
  LEGACY_FORECAST_CONFIDENCE_LABELS,
  LEGACY_FORECAST_RUN_STATUS_LABELS,
  LEGACY_PROMOTION_SOURCE_LABELS,
  LEGACY_PROMOTION_STATUS_LABELS,
  LEGACY_RECOMMENDATION_ACTION_LABELS,
  LEGACY_RECOMMENDATION_PRIORITY_LABELS,
  LEGACY_RECOMMENDATION_STATUS_LABELS,
  TLegacyForecastConfidence,
  TLegacyForecastRunStatus,
  TLegacyPromotionSource,
  TLegacyPromotionStatus,
  TLegacyRecommendationAction,
  TLegacyRecommendationPriority,
  TLegacyRecommendationStatus,
} from "@/types/enums";

type Tone =
  | "emerald"
  | "amber"
  | "rose"
  | "sky"
  | "indigo"
  | "violet"
  | "slate";

const TONE_CLASSES: Record<Tone, string> = {
  emerald:
    "bg-emerald-50 text-emerald-700 border-emerald-200/50 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800/30",
  amber:
    "bg-amber-50 text-amber-700 border-amber-200/50 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800/30",
  rose: "bg-rose-50 text-rose-700 border-rose-200/50 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-800/30",
  sky: "bg-sky-50 text-sky-700 border-sky-200/50 dark:bg-sky-950/30 dark:text-sky-400 dark:border-sky-800/30",
  indigo:
    "bg-indigo-50 text-indigo-700 border-indigo-200/50 dark:bg-indigo-950/30 dark:text-indigo-400 dark:border-indigo-800/30",
  violet:
    "bg-violet-50 text-violet-700 border-violet-200/50 dark:bg-violet-950/30 dark:text-violet-400 dark:border-violet-800/30",
  slate:
    "bg-slate-100 text-slate-700 border-slate-200/60 dark:bg-slate-800/40 dark:text-slate-300 dark:border-slate-700/40",
};

type PillProps = {
  tone: Tone;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
  title?: string;
};

export function Pill({ tone, icon, children, className, title }: PillProps) {
  return (
    <span
      title={title}
      className={cn(
        "inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2 py-0.5 text-xs font-medium [&_svg]:h-3 [&_svg]:w-3",
        TONE_CLASSES[tone],
        className
      )}
    >
      {icon}
      {children}
    </span>
  );
}

export function ActionBadge({
  action,
  className,
}: {
  action: TLegacyRecommendationAction;
  className?: string;
}) {
  const label = LEGACY_RECOMMENDATION_ACTION_LABELS[action] ?? String(action);
  if (action === TLegacyRecommendationAction.Buy)
    return (
      <Pill tone="indigo" icon={<ShoppingCart />} className={className}>
        {label}
      </Pill>
    );
  if (action === TLegacyRecommendationAction.Promote)
    return (
      <Pill tone="violet" icon={<BadgePercent />} className={className}>
        {label}
      </Pill>
    );
  return (
    <Pill tone="slate" icon={<PauseCircle />} className={className}>
      {label}
    </Pill>
  );
}

export function PriorityBadge({
  priority,
  className,
}: {
  priority: TLegacyRecommendationPriority;
  className?: string;
}) {
  const label = LEGACY_RECOMMENDATION_PRIORITY_LABELS[priority] ?? String(priority);
  if (priority === TLegacyRecommendationPriority.High)
    return (
      <Pill
        tone="rose"
        icon={<ArrowUp />}
        className={className}
        title="Prioridade"
      >
        {label}
      </Pill>
    );
  if (priority === TLegacyRecommendationPriority.Medium)
    return (
      <Pill
        tone="amber"
        icon={<Minus />}
        className={className}
        title="Prioridade"
      >
        {label}
      </Pill>
    );
  return (
    <Pill
      tone="sky"
      icon={<ArrowDown />}
      className={className}
      title="Prioridade"
    >
      {label}
    </Pill>
  );
}

export function ConfidenceBadge({
  confidence,
  className,
  withPrefix = false,
}: {
  confidence: TLegacyForecastConfidence;
  className?: string;
  withPrefix?: boolean;
}) {
  const label = LEGACY_FORECAST_CONFIDENCE_LABELS[confidence] ?? String(confidence);
  const tone: Tone =
    confidence === TLegacyForecastConfidence.High
      ? "emerald"
      : confidence === TLegacyForecastConfidence.Medium
        ? "sky"
        : "slate";
  return (
    <Pill
      tone={tone}
      icon={<CircleDashed />}
      className={className}
      title="Confiança da previsão (baseada nos meses de histórico)"
    >
      {withPrefix ? `Confiança ${label.toLowerCase()}` : label}
    </Pill>
  );
}

export function RecommendationStatusBadge({
  status,
  className,
}: {
  status: TLegacyRecommendationStatus;
  className?: string;
}) {
  const label = LEGACY_RECOMMENDATION_STATUS_LABELS[status] ?? String(status);
  switch (status) {
    case TLegacyRecommendationStatus.Applied:
      return (
        <Pill tone="emerald" icon={<CheckCircle2 />} className={className}>
          {label}
        </Pill>
      );
    case TLegacyRecommendationStatus.Dismissed:
      return (
        <Pill tone="slate" icon={<XCircle />} className={className}>
          {label}
        </Pill>
      );
    case TLegacyRecommendationStatus.Expired:
      return (
        <Pill tone="slate" icon={<Hourglass />} className={className}>
          {label}
        </Pill>
      );
    default:
      return (
        <Pill tone="amber" icon={<Clock />} className={className}>
          {label}
        </Pill>
      );
  }
}

export function RunStatusBadge({
  status,
  className,
}: {
  status: TLegacyForecastRunStatus;
  className?: string;
}) {
  if (status === TLegacyForecastRunStatus.Completed)
    return (
      <Pill tone="emerald" icon={<Sparkles />} className={className}>
        {LEGACY_FORECAST_RUN_STATUS_LABELS[status]}
      </Pill>
    );
  if (status === TLegacyForecastRunStatus.CompletedWithoutAi)
    return (
      <Pill
        tone="amber"
        icon={<AlertTriangle />}
        className={className}
        title="A IA não respondeu; as recomendações vêm apenas do cálculo estatístico."
      >
        Sem IA
      </Pill>
    );
  return (
    <Pill tone="rose" icon={<XCircle />} className={className}>
      {LEGACY_FORECAST_RUN_STATUS_LABELS[status] ?? String(status)}
    </Pill>
  );
}

export function PromotionStatusBadge({
  status,
  className,
}: {
  status: TLegacyPromotionStatus;
  className?: string;
}) {
  const label = LEGACY_PROMOTION_STATUS_LABELS[status] ?? String(status);
  switch (status) {
    case TLegacyPromotionStatus.Active:
      return (
        <Pill tone="emerald" icon={<CheckCircle2 />} className={className}>
          {label}
        </Pill>
      );
    case TLegacyPromotionStatus.Scheduled:
      return (
        <Pill tone="sky" icon={<CalendarClock />} className={className}>
          {label}
        </Pill>
      );
    case TLegacyPromotionStatus.Canceled:
      return (
        <Pill tone="rose" icon={<Ban />} className={className}>
          {label}
        </Pill>
      );
    default:
      return (
        <Pill tone="slate" icon={<Hourglass />} className={className}>
          {label}
        </Pill>
      );
  }
}

export function PromotionSourceBadge({
  source,
  className,
}: {
  source: TLegacyPromotionSource;
  className?: string;
}) {
  const label = LEGACY_PROMOTION_SOURCE_LABELS[source] ?? String(source);
  if (source === TLegacyPromotionSource.AiRecommendation)
    return (
      <Pill tone="violet" icon={<Sparkles />} className={className}>
        {label}
      </Pill>
    );
  return (
    <Pill tone="slate" className={className}>
      {label}
    </Pill>
  );
}

/** Texto curto da sugestão: "Comprar 240 un até 20/10/2026" / "−15% por 21 dias" / "Manter". */
export function RecommendationSuggestion({
  recommendation,
  className,
}: {
  recommendation: IForecastRecommendation;
  className?: string;
}) {
  const rec = recommendation;
  if (rec.action === TLegacyRecommendationAction.Buy) {
    return (
      <span className={cn("text-sm", className)}>
        <span className="font-semibold">
          {formatQuantity(rec.suggestedQuantity, rec.product.unitType)}
        </span>
        {rec.deadline && (
          <span className="block text-xs text-muted-foreground">
            comprar até {formatDateOnly(rec.deadline)}
          </span>
        )}
      </span>
    );
  }
  if (rec.action === TLegacyRecommendationAction.Promote) {
    return (
      <span className={cn("text-sm", className)}>
        <span className="font-semibold">
          {formatDiscount(rec.suggestedDiscountPercent)}
        </span>
        {rec.suggestedPromotionDays ? (
          <span className="block text-xs text-muted-foreground">
            por {rec.suggestedPromotionDays} dias
          </span>
        ) : null}
      </span>
    );
  }
  return (
    <span className={cn("text-sm text-muted-foreground", className)}>
      Sem ação
    </span>
  );
}

/** Badge "Promoção −X%" usado em listagens/visualização de produto. */
export function PromotionDiscountBadge({
  discountPercent,
  className,
}: {
  discountPercent: number;
  className?: string;
}) {
  const n = Number(discountPercent);
  const text = Number.isInteger(n) ? String(n) : n.toFixed(1).replace(".", ",");
  return (
    <Pill tone="violet" icon={<BadgePercent />} className={className}>
      Promoção −{text}%
    </Pill>
  );
}
