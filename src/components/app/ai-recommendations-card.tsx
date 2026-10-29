import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  ArrowRight,
  BadgePercent,
  CheckCircle2,
  Loader2,
  RefreshCw,
  ShoppingCart,
  Sparkles,
  X,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ActionBadge,
  PriorityBadge,
  RecommendationSuggestion,
  RunStatusBadge,
} from "@/components/app/forecast-badges";
import { ApplyPurchaseDialog } from "@/components/app/apply-purchase-dialog";
import { ApplyPromotionDialog } from "@/components/app/apply-promotion-dialog";
import { DismissRecommendationDialog } from "@/components/app/dismiss-recommendation-dialog";
import { ForecastProvider } from "@/providers/forecast.provider";
import { useForecast } from "@/hooks/use-forecast";
import { useAuth } from "@/hooks/use-auth";
import type { IForecastRecommendation } from "@/interfaces/forecast.interface";
import {
  TLegacyForecastRunStatus,
  TLegacyRecommendationAction,
  type TLegacyForecastRunStatus as TForecastRunStatusType,
} from "@/types/enums";
import { isAdmin } from "@/utils/auth.helpers";
import { formatDateTime } from "@/utils/format.helpers";
import {
  formatCoverageDays,
  formatQuantity,
  getTopActionableRecommendations,
  isActionableRecommendation,
} from "@/utils/forecast.helpers";
import { handleError, handleSuccess } from "@/utils/toast.helpers";

const DEFAULT_HORIZON = 3;
const CARD_LIMIT = 5;

function CardSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="flex items-center gap-4">
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-2/3" />
          </div>
          <Skeleton className="h-8 w-24" />
        </div>
      ))}
    </div>
  );
}

function AiRecommendationsCardContent() {
  const { user } = useAuth();
  const admin = isAdmin(user);
  const {
    latestRun,
    latestLoaded,
    loadingLatest,
    latestError,
    generating,
    fetchLatest,
    generateForecast,
  } = useForecast();

  const [purchaseRecs, setPurchaseRecs] = useState<IForecastRecommendation[]>(
    []
  );
  const [promotionRec, setPromotionRec] =
    useState<IForecastRecommendation | null>(null);
  const [dismissRec, setDismissRec] = useState<IForecastRecommendation | null>(
    null
  );

  useEffect(() => {
    void fetchLatest();
  }, [fetchLatest]);

  const topRecommendations = useMemo(
    () =>
      latestRun
        ? getTopActionableRecommendations(latestRun.recommendations, CARD_LIMIT)
        : [],
    [latestRun]
  );

  const actionableCount = useMemo(
    () =>
      latestRun
        ? latestRun.recommendations.filter(isActionableRecommendation).length
        : 0,
    [latestRun]
  );

  const handleGenerate = async () => {
    try {
      const run = await generateForecast(DEFAULT_HORIZON);
      if (run.status === TLegacyForecastRunStatus.Failed) {
        handleError(
          new Error(run.errorMessage || "A análise de demanda falhou."),
          "A análise de demanda falhou."
        );
      } else if (run.status === TLegacyForecastRunStatus.CompletedWithoutAi) {
        handleSuccess(
          "Análise gerada sem IA: recomendações baseadas apenas no cálculo estatístico."
        );
      } else {
        handleSuccess("Análise de demanda gerada com sucesso.");
      }
    } catch (error) {
      handleError(error, "Erro ao gerar a análise de demanda");
    }
  };

  const runStatus = latestRun?.status as TForecastRunStatusType | undefined;

  const renderBody = () => {
    if (generating) {
      return (
        <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
          <Loader2 className="h-7 w-7 animate-spin text-primary" />
          <p className="text-sm font-medium">Gerando análise de demanda...</p>
          <p className="text-xs text-muted-foreground">
            Calculando sazonalidade e consultando a IA. Pode levar até 1 minuto.
          </p>
        </div>
      );
    }

    if (loadingLatest || !latestLoaded) return <CardSkeleton />;

    if (latestError) {
      return (
        <div className="flex flex-col items-center justify-center gap-3 py-6 text-center">
          <AlertTriangle className="h-8 w-8 text-amber-500" />
          <div>
            <p className="text-sm font-medium">
              Não foi possível carregar as recomendações.
            </p>
            <p className="text-xs text-muted-foreground">{latestError}</p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => void fetchLatest()}
          >
            <RefreshCw className="h-4 w-4" />
            Tentar novamente
          </Button>
        </div>
      );
    }

    if (!latestRun) {
      return (
        <div className="flex flex-col items-center justify-center gap-3 py-6 text-center">
          <Sparkles className="h-8 w-8 text-violet-500" />
          <div>
            <p className="text-sm font-medium">
              Nenhuma análise de demanda foi gerada ainda.
            </p>
            <p className="text-xs text-muted-foreground">
              {admin
                ? "Gere a primeira análise para receber sugestões de compra e promoção."
                : "Peça a um administrador para gerar a primeira análise."}
            </p>
          </div>
          {admin && (
            <Button size="sm" onClick={() => void handleGenerate()}>
              <Sparkles className="h-4 w-4" />
              Gerar análise
            </Button>
          )}
        </div>
      );
    }

    if (runStatus === TLegacyForecastRunStatus.Failed) {
      return (
        <div className="flex flex-col items-center justify-center gap-3 py-6 text-center">
          <AlertTriangle className="h-8 w-8 text-rose-500" />
          <div>
            <p className="text-sm font-medium">A última análise falhou.</p>
            {latestRun.errorMessage && (
              <p className="text-xs text-muted-foreground">
                {latestRun.errorMessage}
              </p>
            )}
          </div>
          {admin && (
            <Button size="sm" onClick={() => void handleGenerate()}>
              <RefreshCw className="h-4 w-4" />
              Gerar nova análise
            </Button>
          )}
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-4">
        {latestRun.summary && (
          <p
            className="line-clamp-3 rounded-lg border bg-muted/30 p-3 text-sm text-muted-foreground"
            title={latestRun.summary}
          >
            {latestRun.summary}
          </p>
        )}

        {topRecommendations.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-6 text-center text-muted-foreground">
            <CheckCircle2 className="h-8 w-8 text-emerald-500" />
            <p className="text-sm">
              Nenhuma compra ou promoção pendente. Tudo em dia!
            </p>
          </div>
        ) : (
          <div className="divide-y divide-muted/30">
            {topRecommendations.map((rec) => (
              <div
                key={rec.id}
                className="flex flex-col gap-3 py-3 first:pt-0 last:pb-0 lg:flex-row lg:items-center lg:justify-between"
              >
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold">
                      {rec.product.name}
                    </span>
                    <ActionBadge action={rec.action} />
                    <PriorityBadge priority={rec.priority} />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Cód. {rec.product.productCode}
                    {rec.product.brand ? ` · ${rec.product.brand}` : ""} ·
                    Estoque:{" "}
                    {formatQuantity(rec.currentStock, rec.product.unitType)} ·
                    Cobertura: {formatCoverageDays(rec.coverageDays)}
                  </p>
                  <p
                    className="line-clamp-2 text-xs text-muted-foreground"
                    title={rec.reason}
                  >
                    {rec.reason}
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 lg:flex-nowrap lg:justify-end">
                  <RecommendationSuggestion
                    recommendation={rec}
                    className="lg:min-w-[120px] lg:text-right"
                  />
                  <div className="flex items-center gap-2">
                    {rec.action === TLegacyRecommendationAction.Buy && (
                      <Button size="sm" onClick={() => setPurchaseRecs([rec])}>
                        <ShoppingCart className="h-4 w-4" />
                        Comprar
                      </Button>
                    )}
                    {rec.action === TLegacyRecommendationAction.Promote && admin && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setPromotionRec(rec)}
                      >
                        <BadgePercent className="h-4 w-4" />
                        Aplicar desconto
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-muted-foreground"
                      onClick={() => setDismissRec(rec)}
                    >
                      <X className="h-4 w-4" />
                      Descartar
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {actionableCount > topRecommendations.length && (
          <p className="text-xs text-muted-foreground">
            +{actionableCount - topRecommendations.length} recomendação(ões)
            pendente(s) na{" "}
            <Link to="/forecast" className="underline underline-offset-4">
              análise completa
            </Link>
            .
          </p>
        )}
      </div>
    );
  };

  return (
    <Card className="bg-card/65 backdrop-blur-sm border-l-4 border-l-violet-500">
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="rounded-full bg-violet-500/10 p-2 text-violet-500">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="flex flex-wrap items-center gap-2">
              Recomendações da IA
              {runStatus !== undefined &&
                runStatus !== TLegacyForecastRunStatus.Completed && (
                  <RunStatusBadge status={runStatus} />
                )}
            </CardTitle>
            <CardDescription>
              {latestRun
                ? `Análise de ${formatDateTime(latestRun.createAt)} · próximos ${latestRun.horizonMonths} ${latestRun.horizonMonths === 1 ? "mês" : "meses"}`
                : "Previsão de demanda com sugestões de compra e promoção."}
            </CardDescription>
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
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>{renderBody()}</CardContent>

      <ApplyPurchaseDialog
        open={purchaseRecs.length > 0}
        onOpenChange={(open) => {
          if (!open) setPurchaseRecs([]);
        }}
        recommendations={purchaseRecs}
      />
      <ApplyPromotionDialog
        open={!!promotionRec}
        onOpenChange={(open) => {
          if (!open) setPromotionRec(null);
        }}
        recommendation={promotionRec}
      />
      <DismissRecommendationDialog
        open={!!dismissRec}
        onOpenChange={(open) => {
          if (!open) setDismissRec(null);
        }}
        recommendation={dismissRec}
      />
    </Card>
  );
}

/**
 * Card "Recomendações da IA" do dashboard.
 * Possui o próprio ForecastProvider: carrega e falha de forma isolada das estatísticas do painel.
 */
export function AiRecommendationsCard() {
  return (
    <ForecastProvider>
      <AiRecommendationsCardContent />
    </ForecastProvider>
  );
}
