import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  BadgePercent,
  BrainCircuit,
  ExternalLink,
  Loader2,
  PackageSearch,
  PauseCircle,
  RefreshCw,
  Search,
  ShoppingCart,
  Sparkles,
  X,
  XCircle,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  ActionBadge,
  ConfidenceBadge,
  PriorityBadge,
  RecommendationStatusBadge,
  RecommendationSuggestion,
  RunStatusBadge,
} from "@/components/app/forecast-badges";
import { ForecastChart } from "@/components/app/forecast-chart";
import { ApplyPurchaseDialog } from "@/components/app/apply-purchase-dialog";
import { ApplyPromotionDialog } from "@/components/app/apply-promotion-dialog";
import { DismissRecommendationDialog } from "@/components/app/dismiss-recommendation-dialog";

import { ForecastProvider } from "@/providers/forecast.provider";
import { useForecast } from "@/hooks/use-forecast";
import { useAuth } from "@/hooks/use-auth";
import { useProductForecast } from "@/hooks/use-product-forecast";
import type { IForecastRecommendation } from "@/interfaces/forecast.interface";
import {
  TForecastRunStatus,
  TRecommendationAction,
  TRecommendationStatus,
} from "@/types/enums";
import { isAdmin } from "@/utils/auth.helpers";
import {
  formatCurrency,
  formatDateOnly,
  formatDateTime,
  formatNumber,
} from "@/utils/format.helpers";
import {
  formatCoverageDays,
  formatQuantity,
  formatSeasonalIndex,
} from "@/utils/forecast.helpers";
import { handleError, handleSuccess } from "@/utils/toast.helpers";
import { cn } from "@/lib/utils";

type ActionFilter = "all" | "buy" | "promote" | "hold";
type StatusFilter = "pending" | "applied" | "dismissed" | "expired" | "all";

const ACTION_FILTER_MAP: Record<Exclude<ActionFilter, "all">, number> = {
  buy: TRecommendationAction.Buy,
  promote: TRecommendationAction.Promote,
  hold: TRecommendationAction.Hold,
};

const STATUS_FILTER_MAP: Record<Exclude<StatusFilter, "all">, number> = {
  pending: TRecommendationStatus.Pending,
  applied: TRecommendationStatus.Applied,
  dismissed: TRecommendationStatus.Dismissed,
  expired: TRecommendationStatus.Expired,
};

const EXPECTED_GENERATION_SECONDS = 60;

function isSelectableForPurchase(rec: IForecastRecommendation) {
  return (
    rec.action === TRecommendationAction.Buy &&
    rec.status === TRecommendationStatus.Pending
  );
}

function StatTile({
  label,
  value,
  icon,
  accent,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  accent: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between rounded-lg border border-l-4 bg-card/65 p-3",
        accent
      )}
    >
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <p className="text-xl font-bold">{formatNumber(value)}</p>
      </div>
      <div className="text-muted-foreground [&_svg]:h-5 [&_svg]:w-5">
        {icon}
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  hint,
}: {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border bg-muted/20 p-3">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-0.5 text-sm font-semibold">{value}</p>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

type RecommendationActionsProps = {
  rec: IForecastRecommendation;
  admin: boolean;
  onBuy: (rec: IForecastRecommendation) => void;
  onPromote: (rec: IForecastRecommendation) => void;
  onDismiss: (rec: IForecastRecommendation) => void;
  compact?: boolean;
};

function RecommendationActions({
  rec,
  admin,
  onBuy,
  onPromote,
  onDismiss,
  compact = false,
}: RecommendationActionsProps) {
  if (rec.status !== TRecommendationStatus.Pending) return null;

  const buttons: React.ReactNode[] = [];
  if (rec.action === TRecommendationAction.Buy) {
    buttons.push(
      compact ? (
        <Tooltip key="buy">
          <TooltipTrigger asChild>
            <Button
              size="icon"
              className="h-8 w-8"
              aria-label="Comprar"
              onClick={(e) => {
                e.stopPropagation();
                onBuy(rec);
              }}
            >
              <ShoppingCart className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent sideOffset={6}>Comprar</TooltipContent>
        </Tooltip>
      ) : (
        <Button key="buy" size="sm" onClick={() => onBuy(rec)}>
          <ShoppingCart className="h-4 w-4" />
          Comprar
        </Button>
      )
    );
  }
  if (rec.action === TRecommendationAction.Promote && admin) {
    buttons.push(
      compact ? (
        <Tooltip key="promote">
          <TooltipTrigger asChild>
            <Button
              size="icon"
              variant="secondary"
              className="h-8 w-8"
              aria-label="Aplicar desconto"
              onClick={(e) => {
                e.stopPropagation();
                onPromote(rec);
              }}
            >
              <BadgePercent className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent sideOffset={6}>Aplicar desconto</TooltipContent>
        </Tooltip>
      ) : (
        <Button
          key="promote"
          size="sm"
          variant="secondary"
          onClick={() => onPromote(rec)}
        >
          <BadgePercent className="h-4 w-4" />
          Aplicar desconto
        </Button>
      )
    );
  }
  buttons.push(
    compact ? (
      <Tooltip key="dismiss">
        <TooltipTrigger asChild>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-muted-foreground"
            aria-label="Descartar"
            onClick={(e) => {
              e.stopPropagation();
              onDismiss(rec);
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent sideOffset={6}>Descartar</TooltipContent>
      </Tooltip>
    ) : (
      <Button
        key="dismiss"
        size="sm"
        variant="ghost"
        className="text-muted-foreground"
        onClick={() => onDismiss(rec)}
      >
        <X className="h-4 w-4" />
        Descartar
      </Button>
    )
  );

  return <div className="flex items-center gap-1.5">{buttons}</div>;
}

type ProductDetailsProps = {
  rec: IForecastRecommendation;
  horizonMonths: number;
} & Omit<RecommendationActionsProps, "rec" | "compact">;

function ProductDetails({
  rec,
  horizonMonths,
  ...actions
}: ProductDetailsProps) {
  const { data, loading, error, reload } = useProductForecast(rec.productId);
  const unit = rec.product.unitType;

  return (
    <Card className="bg-card/65 backdrop-blur-sm">
      <CardHeader className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <CardTitle className="text-lg">{rec.product.name}</CardTitle>
          <CardDescription>
            Cód. {rec.product.productCode}
            {rec.product.brand ? ` · ${rec.product.brand}` : ""} · Fornecedor:{" "}
            {rec.product.supplierName || "—"}
          </CardDescription>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <ActionBadge action={rec.action} />
            <PriorityBadge priority={rec.priority} />
            <ConfidenceBadge confidence={rec.confidence} withPrefix />
            <RecommendationStatusBadge status={rec.status} />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <RecommendationActions rec={rec} {...actions} />
          <Button asChild size="sm" variant="outline">
            <Link to={`/products/${rec.productId}/view?step=3`}>
              <ExternalLink className="h-4 w-4" />
              Abrir produto
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-start gap-2 rounded-lg border border-violet-200/60 bg-violet-50 p-3 text-sm text-violet-900 dark:border-violet-800/40 dark:bg-violet-950/30 dark:text-violet-200">
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0" />
          <p className="whitespace-pre-line">{rec.reason}</p>
        </div>

        {rec.status === TRecommendationStatus.Applied && (
          <p className="text-sm text-muted-foreground">
            Aplicada
            {rec.appliedAt ? ` em ${formatDateTime(rec.appliedAt)}` : ""}.
            {rec.purchaseOrderId && (
              <>
                {" "}
                <Link
                  to={`/purchase-orders/${rec.purchaseOrderId}/view`}
                  className="font-medium text-primary underline-offset-4 hover:underline"
                >
                  Ver pedido de compra
                </Link>
              </>
            )}
            {rec.promotionId && (
              <>
                {" "}
                <Link
                  to="/promotions"
                  className="font-medium text-primary underline-offset-4 hover:underline"
                >
                  Ver promoções
                </Link>
              </>
            )}
          </p>
        )}
        {rec.status === TRecommendationStatus.Dismissed &&
          rec.dismissReason && (
            <p className="text-sm text-muted-foreground">
              Motivo do descarte: {rec.dismissReason}
            </p>
          )}

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Metric
            label="Estoque atual"
            value={formatQuantity(rec.currentStock, unit)}
            hint={
              rec.incomingStock > 0
                ? `+${formatQuantity(rec.incomingStock, unit)} a caminho`
                : "Nada a caminho"
            }
          />
          <Metric
            label="Demanda próximo mês"
            value={formatQuantity(rec.nextMonthDemand, unit)}
            hint={`Índice sazonal ${formatSeasonalIndex(rec.nextMonthSeasonalIndex)}`}
          />
          <Metric
            label={`Demanda em ${horizonMonths} ${horizonMonths === 1 ? "mês" : "meses"}`}
            value={formatQuantity(rec.projectedDemand, unit)}
          />
          <Metric
            label="Cobertura"
            value={formatCoverageDays(rec.coverageDays)}
            hint="Dias que o estoque atual cobre"
          />
          <Metric
            label="Sugestão"
            value={<RecommendationSuggestion recommendation={rec} />}
          />
          <Metric
            label="Prazo para comprar"
            value={rec.deadline ? formatDateOnly(rec.deadline) : "—"}
            hint={rec.deadline ? "Considera o prazo de entrega" : undefined}
          />
          <Metric
            label="Preço de venda"
            value={formatCurrency(Number(rec.product.effectivePrice))}
            hint={
              Number(rec.product.effectivePrice) < Number(rec.product.price)
                ? `De ${formatCurrency(Number(rec.product.price))} (em promoção)`
                : undefined
            }
          />
          <Metric
            label="Custo"
            value={
              rec.product.costPrice !== undefined &&
              rec.product.costPrice !== null
                ? formatCurrency(Number(rec.product.costPrice))
                : "Não informado"
            }
          />
        </div>

        <div>
          <p className="mb-2 text-sm font-semibold">
            Histórico de vendas e projeção
          </p>
          {loading ? (
            <Skeleton className="h-[300px] w-full" />
          ) : error ? (
            <div className="flex h-[200px] flex-col items-center justify-center gap-2 rounded-lg border border-dashed text-center">
              <AlertTriangle className="h-6 w-6 text-amber-500" />
              <p className="text-sm text-muted-foreground">{error}</p>
              <Button size="sm" variant="outline" onClick={reload}>
                <RefreshCw className="h-4 w-4" />
                Tentar novamente
              </Button>
            </div>
          ) : (
            <ForecastChart
              history={data?.history ?? []}
              projection={data?.projection ?? []}
              currentStock={rec.currentStock}
              unitType={unit}
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function ForecastContent() {
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

  const [horizon, setHorizon] = useState("3");
  const [elapsed, setElapsed] = useState(0);
  const [actionFilter, setActionFilter] = useState<ActionFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("pending");
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [focusedProductId, setFocusedProductId] = useState<string | null>(null);
  const detailsRef = useRef<HTMLDivElement>(null);

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

  // Cronômetro durante a geração (pode levar até ~60s)
  useEffect(() => {
    if (!generating) return;
    const startedAt = Date.now();
    const timer = setInterval(() => {
      setElapsed(Math.round((Date.now() - startedAt) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [generating]);

  const recommendations = useMemo(
    () => latestRun?.recommendations ?? [],
    [latestRun]
  );

  const statusFiltered = useMemo(
    () =>
      statusFilter === "all"
        ? recommendations
        : recommendations.filter(
            (r) => r.status === STATUS_FILTER_MAP[statusFilter]
          ),
    [recommendations, statusFilter]
  );

  const actionCounts = useMemo(
    () => ({
      all: statusFiltered.length,
      buy: statusFiltered.filter((r) => r.action === TRecommendationAction.Buy)
        .length,
      promote: statusFiltered.filter(
        (r) => r.action === TRecommendationAction.Promote
      ).length,
      hold: statusFiltered.filter(
        (r) => r.action === TRecommendationAction.Hold
      ).length,
    }),
    [statusFiltered]
  );

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return statusFiltered.filter((r) => {
      if (
        actionFilter !== "all" &&
        r.action !== ACTION_FILTER_MAP[actionFilter]
      )
        return false;
      if (!term) return true;
      return [
        r.product.name,
        r.product.productCode,
        r.product.brand ?? "",
        r.product.supplierName ?? "",
      ].some((v) => v.toLowerCase().includes(term));
    });
  }, [statusFiltered, actionFilter, search]);

  const selectableInView = useMemo(
    () => filtered.filter(isSelectableForPurchase),
    [filtered]
  );

  const selectedRecs = useMemo(
    () =>
      recommendations.filter(
        (r) => selectedIds.has(r.id) && isSelectableForPurchase(r)
      ),
    [recommendations, selectedIds]
  );

  const allInViewSelected =
    selectableInView.length > 0 &&
    selectableInView.every((r) => selectedIds.has(r.id));
  const someInViewSelected = selectableInView.some((r) =>
    selectedIds.has(r.id)
  );

  const focusedRec = useMemo(() => {
    const byFocus = focusedProductId
      ? recommendations.find((r) => r.productId === focusedProductId)
      : undefined;
    return byFocus ?? filtered[0] ?? null;
  }, [recommendations, focusedProductId, filtered]);

  const toggleSelected = (id: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const toggleAllInView = (checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      for (const r of selectableInView) {
        if (checked) next.add(r.id);
        else next.delete(r.id);
      }
      return next;
    });
  };

  const focusProduct = (productId: string) => {
    setFocusedProductId(productId);
    requestAnimationFrame(() =>
      detailsRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      })
    );
  };

  const handleGenerate = async () => {
    setElapsed(0);
    try {
      const run = await generateForecast(Number(horizon));
      setSelectedIds(new Set());
      setFocusedProductId(null);
      if (run.status === TForecastRunStatus.Failed) {
        handleError(
          new Error(run.errorMessage || "A análise de demanda falhou."),
          "A análise de demanda falhou."
        );
      } else if (run.status === TForecastRunStatus.CompletedWithoutAi) {
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

  const actionHandlers = {
    admin,
    onBuy: (rec: IForecastRecommendation) => setPurchaseRecs([rec]),
    onPromote: (rec: IForecastRecommendation) => setPromotionRec(rec),
    onDismiss: (rec: IForecastRecommendation) => setDismissRec(rec),
  };

  const horizonSelector = (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <Select value={horizon} onValueChange={setHorizon} disabled={generating}>
        <SelectTrigger className="w-full sm:w-[150px]" aria-label="Horizonte">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="1">Próximo mês</SelectItem>
          <SelectItem value="2">Próximos 2 meses</SelectItem>
          <SelectItem value="3">Próximos 3 meses</SelectItem>
        </SelectContent>
      </Select>
      <Button onClick={() => void handleGenerate()} disabled={generating}>
        {generating ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Sparkles className="h-4 w-4" />
        )}
        {generating
          ? "Gerando..."
          : latestRun
            ? "Gerar nova análise"
            : "Gerar análise"}
      </Button>
    </div>
  );

  const renderHeader = () => (
    <Card className="bg-card/65 backdrop-blur-sm border-l-4 border-l-violet-500">
      <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-3">
          <div className="rounded-full bg-violet-500/10 p-2 text-violet-500">
            <BrainCircuit className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <CardTitle className="flex flex-wrap items-center gap-2 text-xl">
              Previsão de Demanda (IA)
              {latestRun && <RunStatusBadge status={latestRun.status} />}
            </CardTitle>
            <CardDescription>
              {latestRun ? (
                <>
                  Última análise em {formatDateTime(latestRun.createAt)}
                  {latestRun.requestedByName
                    ? ` por ${latestRun.requestedByName}`
                    : ""}{" "}
                  · horizonte de {latestRun.horizonMonths}{" "}
                  {latestRun.horizonMonths === 1 ? "mês" : "meses"} ·{" "}
                  {formatNumber(latestRun.productsAnalyzed)} produtos analisados
                </>
              ) : (
                "O sistema calcula a demanda dos próximos meses a partir do histórico de vendas e a IA prioriza e explica as ações."
              )}
            </CardDescription>
          </div>
        </div>
        {admin && horizonSelector}
      </CardHeader>
      {generating && (
        <CardContent className="pt-0">
          <div className="flex flex-col gap-2 rounded-lg border bg-muted/30 p-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              Analisando o histórico de vendas e consultando a IA... ({elapsed}
              s)
            </div>
            <Progress
              value={Math.min(
                95,
                (elapsed / EXPECTED_GENERATION_SECONDS) * 100
              )}
            />
            <p className="text-xs text-muted-foreground">
              Esse processo pode levar até cerca de 1 minuto. Não feche esta
              página.
            </p>
          </div>
        </CardContent>
      )}
    </Card>
  );

  if (!latestLoaded || (loadingLatest && !latestRun)) {
    return (
      <div className="flex flex-col gap-4">
        {renderHeader()}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (latestError && !latestRun) {
    return (
      <div className="flex flex-col gap-4">
        {renderHeader()}
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
            <AlertTriangle className="h-10 w-10 text-amber-500" />
            <div>
              <p className="font-medium">
                Não foi possível carregar a análise de demanda.
              </p>
              <p className="text-sm text-muted-foreground">{latestError}</p>
            </div>
            <Button variant="outline" onClick={() => void fetchLatest()}>
              <RefreshCw className="h-4 w-4" />
              Tentar novamente
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!latestRun) {
    return (
      <div className="flex flex-col gap-4">
        {renderHeader()}
        <Card>
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Sparkles />
              </EmptyMedia>
              <EmptyTitle>Nenhuma análise gerada ainda</EmptyTitle>
              <EmptyDescription>
                {admin
                  ? "Escolha o horizonte e gere a primeira análise para receber recomendações de compra e promoção."
                  : "Peça a um administrador para gerar a primeira análise de demanda."}
              </EmptyDescription>
            </EmptyHeader>
            {admin && !generating && (
              <EmptyContent>{horizonSelector}</EmptyContent>
            )}
          </Empty>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 animate-in fade-in duration-300">
      {renderHeader()}

      {latestRun.status === TForecastRunStatus.CompletedWithoutAi && (
        <Alert className="border-amber-300/60 bg-amber-50 text-amber-900 dark:border-amber-800/40 dark:bg-amber-950/30 dark:text-amber-200">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Análise concluída sem IA</AlertTitle>
          <AlertDescription className="text-amber-800 dark:text-amber-300">
            As recomendações abaixo vêm apenas do cálculo estatístico.
            {latestRun.errorMessage ? ` Motivo: ${latestRun.errorMessage}` : ""}
          </AlertDescription>
        </Alert>
      )}
      {latestRun.status === TForecastRunStatus.Failed && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertTitle>A análise falhou</AlertTitle>
          <AlertDescription>
            {latestRun.errorMessage || "Tente gerar uma nova análise."}
          </AlertDescription>
        </Alert>
      )}

      {/* Resumo */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label="Comprar"
          value={latestRun.counts?.buy ?? 0}
          icon={<ShoppingCart />}
          accent="border-l-indigo-500"
        />
        <StatTile
          label="Promover"
          value={latestRun.counts?.promote ?? 0}
          icon={<BadgePercent />}
          accent="border-l-violet-500"
        />
        <StatTile
          label="Manter"
          value={latestRun.counts?.hold ?? 0}
          icon={<PauseCircle />}
          accent="border-l-slate-400"
        />
        <StatTile
          label="Pendentes"
          value={latestRun.counts?.pending ?? 0}
          icon={<Sparkles />}
          accent="border-l-amber-500"
        />
      </div>

      {latestRun.summary && (
        <Card className="bg-card/65 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="h-4 w-4 text-violet-500" />
              Resumo da análise
            </CardTitle>
            <CardDescription>
              {latestRun.aiProvider
                ? `Gerado por ${latestRun.aiProvider}${latestRun.aiModel ? ` (${latestRun.aiModel})` : ""}`
                : "Gerado a partir do cálculo estatístico"}
              {latestRun.durationMs
                ? ` · ${formatNumber(latestRun.durationMs / 1000, 1)}s`
                : ""}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-line text-sm leading-relaxed">
              {latestRun.summary}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Recomendações */}
      <Card className="bg-card/65 backdrop-blur-sm">
        <CardHeader className="flex flex-col gap-3">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>Recomendações</CardTitle>
              <CardDescription>
                Clique em um produto para ver o histórico e a projeção.
              </CardDescription>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <InputGroup className="w-full sm:w-[240px]">
                <InputGroupAddon>
                  <Search className="h-4 w-4" />
                </InputGroupAddon>
                <InputGroupInput
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar produto..."
                  aria-label="Buscar produto"
                />
              </InputGroup>
              <Select
                value={statusFilter}
                onValueChange={(v) => setStatusFilter(v as StatusFilter)}
              >
                <SelectTrigger
                  className="w-full sm:w-[160px]"
                  aria-label="Status"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pendentes</SelectItem>
                  <SelectItem value="applied">Aplicadas</SelectItem>
                  <SelectItem value="dismissed">Descartadas</SelectItem>
                  <SelectItem value="expired">Expiradas</SelectItem>
                  <SelectItem value="all">Todos os status</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <Tabs
              value={actionFilter}
              onValueChange={(v) => setActionFilter(v as ActionFilter)}
            >
              <TabsList className="flex h-auto w-full justify-start overflow-x-auto p-1 md:w-auto">
                <TabsTrigger value="all">
                  Todas ({actionCounts.all})
                </TabsTrigger>
                <TabsTrigger value="buy">
                  Comprar ({actionCounts.buy})
                </TabsTrigger>
                <TabsTrigger value="promote">
                  Promover ({actionCounts.promote})
                </TabsTrigger>
                <TabsTrigger value="hold">
                  Manter ({actionCounts.hold})
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {selectedRecs.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {selectedRecs.length} selecionado
                  {selectedRecs.length > 1 ? "s" : ""}
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setSelectedIds(new Set())}
                >
                  Limpar
                </Button>
                <Button size="sm" onClick={() => setPurchaseRecs(selectedRecs)}>
                  <ShoppingCart className="h-4 w-4" />
                  Comprar selecionados
                </Button>
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent>
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-8 text-center text-muted-foreground">
              <PackageSearch className="h-8 w-8 opacity-50" />
              <p className="text-sm">
                Nenhuma recomendação encontrada com os filtros atuais.
              </p>
            </div>
          ) : (
            <>
              {/* Desktop */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10">
                        <Checkbox
                          checked={allInViewSelected}
                          indeterminate={
                            someInViewSelected && !allInViewSelected
                          }
                          disabled={selectableInView.length === 0}
                          onCheckedChange={(v) => toggleAllInView(!!v)}
                          aria-label="Selecionar todas as compras pendentes"
                        />
                      </TableHead>
                      <TableHead>Produto</TableHead>
                      <TableHead>Recomendação</TableHead>
                      <TableHead>Estoque</TableHead>
                      <TableHead>Demanda prevista</TableHead>
                      <TableHead>Cobertura</TableHead>
                      <TableHead>Sugestão</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((rec) => {
                      const unit = rec.product.unitType;
                      const selectable = isSelectableForPurchase(rec);
                      const isFocused = focusedRec?.id === rec.id;
                      return (
                        <TableRow
                          key={rec.id}
                          data-state={
                            selectedIds.has(rec.id) ? "selected" : undefined
                          }
                          className={cn(
                            "cursor-pointer align-top",
                            isFocused && "bg-violet-500/5"
                          )}
                          onClick={() => focusProduct(rec.productId)}
                        >
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <Checkbox
                              checked={selectedIds.has(rec.id)}
                              disabled={!selectable}
                              onCheckedChange={(v) =>
                                toggleSelected(rec.id, !!v)
                              }
                              aria-label="Selecionar para compra"
                            />
                          </TableCell>
                          <TableCell className="max-w-[320px] whitespace-normal">
                            <p className="font-medium">{rec.product.name}</p>
                            <p className="text-xs text-muted-foreground">
                              Cód. {rec.product.productCode}
                              {rec.product.brand
                                ? ` · ${rec.product.brand}`
                                : ""}
                            </p>
                            <p
                              className="mt-1 line-clamp-2 text-xs text-muted-foreground"
                              title={rec.reason}
                            >
                              {rec.reason}
                            </p>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col items-start gap-1">
                              <ActionBadge action={rec.action} />
                              <PriorityBadge priority={rec.priority} />
                              <ConfidenceBadge confidence={rec.confidence} />
                            </div>
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            <p className="text-sm font-medium">
                              {formatQuantity(rec.currentStock, unit)}
                            </p>
                            {rec.incomingStock > 0 && (
                              <p className="text-xs text-muted-foreground">
                                +{formatQuantity(rec.incomingStock, unit)} a
                                caminho
                              </p>
                            )}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            <p className="text-sm">
                              {formatQuantity(rec.nextMonthDemand, unit)}
                              <span className="text-xs text-muted-foreground">
                                {" "}
                                próx. mês
                              </span>
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatQuantity(rec.projectedDemand, unit)} no
                              horizonte
                            </p>
                          </TableCell>
                          <TableCell className="whitespace-nowrap text-sm">
                            {formatCoverageDays(rec.coverageDays)}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            <RecommendationSuggestion recommendation={rec} />
                          </TableCell>
                          <TableCell>
                            <RecommendationStatusBadge status={rec.status} />
                          </TableCell>
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <div className="flex justify-end">
                              <RecommendationActions
                                rec={rec}
                                compact
                                {...actionHandlers}
                              />
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile */}
              <div className="grid gap-3 md:hidden">
                {selectableInView.length > 0 && (
                  <label className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Checkbox
                      checked={allInViewSelected}
                      indeterminate={someInViewSelected && !allInViewSelected}
                      onCheckedChange={(v) => toggleAllInView(!!v)}
                    />
                    Selecionar todas as compras pendentes
                  </label>
                )}
                {filtered.map((rec) => {
                  const unit = rec.product.unitType;
                  const selectable = isSelectableForPurchase(rec);
                  return (
                    <div
                      key={rec.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => focusProduct(rec.productId)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") focusProduct(rec.productId);
                      }}
                      className={cn(
                        "flex flex-col gap-2 rounded-lg border p-3 text-left",
                        focusedRec?.id === rec.id &&
                          "border-violet-400/60 bg-violet-500/5"
                      )}
                    >
                      <div className="flex items-start gap-2">
                        {selectable && (
                          <div onClick={(e) => e.stopPropagation()}>
                            <Checkbox
                              checked={selectedIds.has(rec.id)}
                              onCheckedChange={(v) =>
                                toggleSelected(rec.id, !!v)
                              }
                              aria-label="Selecionar para compra"
                              className="mt-0.5"
                            />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="font-medium">{rec.product.name}</p>
                          <p className="text-xs text-muted-foreground">
                            Cód. {rec.product.productCode}
                          </p>
                        </div>
                        <RecommendationStatusBadge status={rec.status} />
                      </div>
                      <div className="flex flex-wrap gap-1">
                        <ActionBadge action={rec.action} />
                        <PriorityBadge priority={rec.priority} />
                        <ConfidenceBadge confidence={rec.confidence} />
                      </div>
                      <p className="line-clamp-2 text-xs text-muted-foreground">
                        {rec.reason}
                      </p>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <span>
                          <span className="text-muted-foreground">
                            Estoque:{" "}
                          </span>
                          {formatQuantity(rec.currentStock, unit)}
                        </span>
                        <span>
                          <span className="text-muted-foreground">
                            Cobertura:{" "}
                          </span>
                          {formatCoverageDays(rec.coverageDays)}
                        </span>
                        <span>
                          <span className="text-muted-foreground">
                            Próx. mês:{" "}
                          </span>
                          {formatQuantity(rec.nextMonthDemand, unit)}
                        </span>
                        <span>
                          <span className="text-muted-foreground">
                            Horizonte:{" "}
                          </span>
                          {formatQuantity(rec.projectedDemand, unit)}
                        </span>
                      </div>
                      <div
                        className="flex items-center justify-between gap-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <RecommendationSuggestion recommendation={rec} />
                        <RecommendationActions
                          rec={rec}
                          compact
                          {...actionHandlers}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Detalhes do produto selecionado */}
      <div ref={detailsRef} className="scroll-mt-4">
        {focusedRec ? (
          <ProductDetails
            key={focusedRec.id}
            rec={focusedRec}
            horizonMonths={latestRun.horizonMonths}
            {...actionHandlers}
          />
        ) : (
          <Card className="border-dashed">
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              Selecione um produto na tabela para ver o histórico de vendas e a
              projeção.
            </CardContent>
          </Card>
        )}
      </div>

      <ApplyPurchaseDialog
        open={purchaseRecs.length > 0}
        onOpenChange={(open) => {
          if (!open) setPurchaseRecs([]);
        }}
        recommendations={purchaseRecs}
        onSuccess={() => setSelectedIds(new Set())}
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
    </div>
  );
}

export default function ForecastPageWrapper() {
  return (
    <ForecastProvider>
      <ForecastContent />
    </ForecastProvider>
  );
}
