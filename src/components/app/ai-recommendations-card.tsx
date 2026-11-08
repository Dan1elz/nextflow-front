import { Link } from "react-router-dom";
import {
  AlertTriangle,
  ArrowDown,
  ArrowRight,
  ArrowUp,
  BadgePercent,
  CheckCircle2,
  Clock,
  Minus,
  PauseCircle,
  ShoppingCart,
  Sparkles,
  Truck,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Pill } from "@/components/app/forecast-badges";
import {
  BlockEmpty,
  BlockError,
  BlockListSkeleton,
} from "@/components/app/dashboard-block";
import { useDashboard } from "@/hooks/use-dashboard";
import type {
  IForecastRecommendationListItem,
  IForecastRunSummary,
} from "@/interfaces/forecast.interface";
import {
  FORECAST_RUN_STATUS_LABELS,
  RECOMMENDATION_ACTION_LABELS,
  RECOMMENDATION_PRIORITY_LABELS,
  TForecastRunStatus,
  TRecommendationAction,
  TRecommendationPriority,
} from "@/types/enums";
import { formatDateTime, formatNumber } from "@/utils/format.helpers";
import { formatCoverageDays, formatDiscount } from "@/utils/forecast.helpers";

function ActionPill({ action }: { action: TRecommendationAction }) {
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

function PriorityPill({ priority }: { priority: TRecommendationPriority }) {
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

function RunStatusPill({ status }: { status: TForecastRunStatus }) {
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
  return (
    <Pill tone="amber" icon={<Sparkles />}>
      {label}
    </Pill>
  );
}

function formatQty(rec: IForecastRecommendationListItem, value: number) {
  return `${formatNumber(value, rec.decimalPlaces)} ${rec.saleUnit}`;
}

/** O que a recomendação sugere, em uma linha: quantidade a comprar ou desconto. */
function Suggestion({ rec }: { rec: IForecastRecommendationListItem }) {
  if (rec.action === TRecommendationAction.Buy && rec.suggestedQuantity)
    return (
      <div className="flex flex-col lg:items-end">
        <span className="text-sm font-semibold tabular-nums">
          {formatQty(rec, rec.suggestedQuantity)}
        </span>
        {rec.preferredSupplierName && (
          <span className="text-xs text-muted-foreground">
            {rec.preferredSupplierName}
          </span>
        )}
      </div>
    );
  if (
    rec.action === TRecommendationAction.Promote &&
    rec.suggestedDiscountPercent
  )
    return (
      <div className="flex flex-col lg:items-end">
        <span className="text-sm font-semibold tabular-nums">
          {formatDiscount(rec.suggestedDiscountPercent)}
        </span>
        {rec.suggestedPromotionDays && (
          <span className="text-xs text-muted-foreground">
            por {rec.suggestedPromotionDays} dias
          </span>
        )}
      </div>
    );
  return null;
}

function describeRun(run: IForecastRunSummary | null | undefined): string {
  if (!run) return "Previsão de demanda com sugestões de compra e promoção.";
  const horizon = `${run.horizonMonths} ${run.horizonMonths === 1 ? "mês" : "meses"}`;
  return `Análise de ${formatDateTime(run.createdAt)} · próximos ${horizon} · ${run.counts.buy} de compra · ${run.counts.promote} de promoção`;
}

function CardBody() {
  const { forecastTop } = useDashboard();
  const { data, loading, error, reload } = forecastTop;

  if (loading && !data) return <BlockListSkeleton />;
  if (error)
    return <BlockError message={error} onRetry={() => void reload()} />;

  const run = data?.run ?? null;
  if (!run)
    return (
      <BlockEmpty icon={<Sparkles />}>
        Nenhuma análise de demanda foi gerada ainda.{" "}
        <Link to="/forecast">Abra a previsão</Link> para gerar a primeira.
      </BlockEmpty>
    );

  if (run.status === TForecastRunStatus.Running) {
    const { total, completed } = run.batches;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
    return (
      <div className="flex flex-col gap-3 py-4">
        <p className="text-sm font-medium">Análise de demanda em andamento.</p>
        <Progress value={percent} className="h-1.5" />
        <p className="text-xs text-muted-foreground">
          {completed} de {total} lotes de produtos analisados.
        </p>
      </div>
    );
  }

  if (run.status === TForecastRunStatus.Failed)
    return (
      <BlockEmpty icon={<AlertTriangle />}>
        A última análise falhou.
        {run.errorMessage ? ` ${run.errorMessage}` : ""}
      </BlockEmpty>
    );

  const recommendations = data?.recommendations ?? [];

  return (
    <div className="flex flex-col gap-4">
      {run.summary && (
        <p
          className="line-clamp-3 rounded-lg border bg-muted/30 p-3 text-sm text-muted-foreground"
          title={run.summary}
        >
          {run.summary}
        </p>
      )}

      {recommendations.length === 0 ? (
        <BlockEmpty icon={<CheckCircle2 />}>
          Nenhuma compra ou promoção pendente. Tudo em dia!
        </BlockEmpty>
      ) : (
        <div className="divide-y divide-border/60">
          {recommendations.map((rec) => (
            <div
              key={rec.id}
              className="flex flex-col gap-3 py-3 first:pt-0 last:pb-0 lg:flex-row lg:items-center lg:justify-between"
            >
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold">
                    {rec.productName}
                  </span>
                  <ActionPill action={rec.action} />
                  <PriorityPill priority={rec.priority} />
                </div>
                <p className="text-xs text-muted-foreground">
                  {rec.categoryPath ? `${rec.categoryPath} · ` : ""}
                  Estoque: {formatQty(rec, rec.currentStock)} · Cobertura:{" "}
                  {formatCoverageDays(rec.coverageDays)}
                </p>
                <p
                  className="line-clamp-2 text-xs text-muted-foreground"
                  title={rec.reasonShort}
                >
                  {rec.reasonShort}
                </p>
              </div>
              <Suggestion rec={rec} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Card "Recomendações da IA" do painel (T-DF1): as 5 primeiras recomendações pendentes da última análise
 * (`GET /api/forecasts/latest/top`). Comprar, promover e descartar ficam na análise completa até a F3.8f/g.
 */
export function AiRecommendationsCard() {
  const { forecastTop } = useDashboard();
  const run = forecastTop.data?.run;

  return (
    <section aria-label="Recomendações da IA">
      <Card className="rounded-none border-0 border-t border-border/70 bg-transparent pt-8 shadow-none">
        <CardHeader className="flex flex-col gap-3 px-0 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-primary/10 p-2 text-primary">
              <Sparkles className="size-5" />
            </div>
            <div>
              <CardTitle className="flex flex-wrap items-center gap-2">
                Recomendações da IA
                {run && run.status !== TForecastRunStatus.Completed && (
                  <RunStatusPill status={run.status} />
                )}
              </CardTitle>
              <CardDescription>{describeRun(run)}</CardDescription>
            </div>
          </div>
          <Button
            asChild
            size="sm"
            variant="outline"
            className="self-start sm:self-auto"
          >
            <Link to="/forecast">
              Ver análise completa
              <ArrowRight />
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="px-0">
          <CardBody />
        </CardContent>
      </Card>
    </section>
  );
}
