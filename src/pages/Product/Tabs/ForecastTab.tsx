import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  ArrowRight,
  BadgePercent,
  RefreshCw,
  Sparkles,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ForecastChart,
  SeasonalityChart,
} from "@/components/app/forecast-chart";
import {
  ActionBadge,
  ConfidenceBadge,
  PriorityBadge,
  PromotionSourceBadge,
  PromotionStatusBadge,
  RecommendationStatusBadge,
  RecommendationSuggestion,
} from "@/components/app/forecast-badges";
import { ForecastProvider } from "@/providers/forecast.provider";
import { PromotionsProvider } from "@/providers/promotions.provider";
import { useProductForecast } from "@/hooks/use-product-forecast";
import { usePromotions } from "@/hooks/use-promotions";
import { formatCurrency, formatDateOnly } from "@/utils/format.helpers";
import { formatCoverageDays, formatDiscount } from "@/utils/forecast.helpers";

type ForecastTabProps = {
  productId: string | null;
  currentStock?: number | string | null;
  unitType?: number | null;
};

function Section({
  title,
  description,
  children,
  action,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border p-4">
      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="font-semibold">{title}</h3>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function ProductPromotions({ productId }: { productId: string }) {
  const { promotions, searchPromotions } = usePromotions();
  const [state, setState] = useState<{
    productId: string;
    error: string | null;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    searchPromotions({ filters: { productId }, page: 1, perPage: 50 })
      .then(() => {
        if (!cancelled) setState({ productId, error: null });
      })
      .catch((error: unknown) => {
        if (!cancelled)
          setState({
            productId,
            error:
              error instanceof Error && error.message
                ? error.message
                : "Erro ao carregar promoções",
          });
      });
    return () => {
      cancelled = true;
    };
  }, [productId, searchPromotions]);

  if (!state || state.productId !== productId) {
    return <Skeleton className="h-24 w-full" />;
  }

  if (state.error) {
    return (
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <AlertTriangle className="h-4 w-4 text-amber-500" />
        {state.error}
      </p>
    );
  }

  if (promotions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-6 text-center text-muted-foreground">
        <BadgePercent className="h-6 w-6 opacity-50" />
        <p className="text-sm">
          Nenhuma promoção registrada para este produto.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Desconto</TableHead>
            <TableHead>Período</TableHead>
            <TableHead>Preço promocional</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Origem</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {promotions.map((p) => (
            <TableRow key={p.id}>
              <TableCell className="font-semibold text-violet-700 dark:text-violet-400">
                {formatDiscount(p.discountPercent)}
              </TableCell>
              <TableCell className="whitespace-nowrap">
                {formatDateOnly(p.startDate)} a {formatDateOnly(p.endDate)}
              </TableCell>
              <TableCell className="whitespace-nowrap">
                {formatCurrency(Number(p.promotionalPrice))}
              </TableCell>
              <TableCell>
                <PromotionStatusBadge status={p.status} />
              </TableCell>
              <TableCell>
                <PromotionSourceBadge source={p.source} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function ForecastTabContent({
  productId,
  currentStock,
  unitType,
}: {
  productId: string;
  currentStock?: number | string | null;
  unitType?: number | null;
}) {
  const { data, loading, error, reload } = useProductForecast(productId);
  const rec = data?.latestRecommendation ?? null;
  // Ao abrir a aba direto (?step=3) o produto selecionado ainda não foi carregado pela aba "Produto":
  // usa o produto (dados atuais) embutido na última recomendação.
  const stock =
    currentStock !== undefined && currentStock !== null && currentStock !== ""
      ? Number(currentStock)
      : rec
        ? Number(rec.product.quantity)
        : null;
  const unit = unitType ?? rec?.product.unitType ?? null;

  return (
    <div className="flex flex-col gap-4">
      {error ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed p-8 text-center">
          <AlertTriangle className="h-8 w-8 text-amber-500" />
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button size="sm" variant="outline" onClick={reload}>
            <RefreshCw className="h-4 w-4" />
            Tentar novamente
          </Button>
        </div>
      ) : (
        <>
          {rec && (
            <Section
              title="Última recomendação"
              action={
                <Button asChild size="sm" variant="outline">
                  <Link to="/forecast">
                    Ver análise completa
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              }
            >
              <div className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center gap-1.5">
                  <ActionBadge action={rec.action} />
                  <PriorityBadge priority={rec.priority} />
                  <ConfidenceBadge confidence={rec.confidence} withPrefix />
                  <RecommendationStatusBadge status={rec.status} />
                </div>
                <div className="flex items-start gap-2 rounded-lg border border-violet-200/60 bg-violet-50 p-3 text-sm text-violet-900 dark:border-violet-800/40 dark:bg-violet-950/30 dark:text-violet-200">
                  <Sparkles className="mt-0.5 h-4 w-4 shrink-0" />
                  <p className="whitespace-pre-line">{rec.reason}</p>
                </div>
                <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
                  <span>
                    <span className="text-muted-foreground">Sugestão: </span>
                    <RecommendationSuggestion
                      recommendation={rec}
                      className="inline-block align-top"
                    />
                  </span>
                  <span>
                    <span className="text-muted-foreground">Cobertura: </span>
                    {formatCoverageDays(rec.coverageDays)}
                  </span>
                </div>
              </div>
            </Section>
          )}

          <Section
            title="Histórico de vendas e projeção"
            description="Vendas confirmadas por mês (últimos 24 meses) e demanda projetada pela última análise."
          >
            {loading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : (
              <ForecastChart
                history={data?.history ?? []}
                projection={data?.projection ?? []}
                currentStock={stock}
                unitType={unit}
              />
            )}
          </Section>

          <Section
            title="Perfil sazonal (12 meses)"
            description="Índice de cada mês em relação à média mensal (1,00 = média; 1,80 = 80% acima)."
          >
            {loading ? (
              <Skeleton className="h-[220px] w-full" />
            ) : (
              <SeasonalityChart seasonality={data?.seasonality ?? []} />
            )}
          </Section>
        </>
      )}

      <Section title="Promoções do produto">
        <ProductPromotions productId={productId} />
      </Section>
    </div>
  );
}

export function ForecastTab({
  productId,
  currentStock,
  unitType,
}: ForecastTabProps) {
  if (!productId) {
    return (
      <p className="text-sm text-muted-foreground">
        Salve o produto para visualizar a previsão de demanda.
      </p>
    );
  }

  return (
    <ForecastProvider>
      <PromotionsProvider>
        <ForecastTabContent
          productId={productId}
          currentStock={currentStock}
          unitType={unitType}
        />
      </PromotionsProvider>
    </ForecastProvider>
  );
}
