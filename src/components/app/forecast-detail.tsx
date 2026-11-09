import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, CalendarDays, Sparkles } from "lucide-react";

import {
  ForecastChart,
  SeasonalityChart,
} from "@/components/app/forecast-chart";
import {
  ActionPill,
  AiAdjustedPill,
  ConfidencePill,
  PriorityPill,
  RecommendationStatusPill,
} from "@/components/app/recommendation-badges";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type {
  IForecastRecommendationDetail,
  IProductForecast,
  IVariantSplit,
} from "@/interfaces/forecast.interface";
import { DISMISS_REASON_LABELS, LEAD_TIME_SOURCE_LABELS } from "@/types/enums";
import { formatMonth } from "@/utils/date.helpers";
import { formatDateOnly, formatNumber } from "@/utils/format.helpers";
import {
  formatCoverageDays,
  formatSeasonalIndex,
} from "@/utils/forecast.helpers";
import { unitShort } from "@/utils/product.helpers";

// ---------- Formatação ----------

type Unit = { saleUnit: string; decimalPlaces: number };

function formatQty(unit: Unit, value: number) {
  return `${formatNumber(value, unit.decimalPlaces)} ${unitShort(unit.saleUnit)}`;
}

function formatPercent(value: number) {
  return `${formatNumber(value, Number.isInteger(value) ? 0 : 1)}%`;
}

function formatDays(value: number | null) {
  if (value === null) return "—";
  return `${formatNumber(value)} ${value === 1 ? "dia" : "dias"}`;
}

// ---------- Blocos ----------

function Section({
  id,
  title,
  description,
  children,
}: {
  id: string;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section aria-labelledby={id} className="flex flex-col gap-3">
      <div className="flex flex-col gap-0.5">
        <h3 id={id} className="text-sm font-semibold">
          {title}
        </h3>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </div>
      {children}
    </section>
  );
}

function Detail({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm tabular-nums wrap-anywhere">{value}</dd>
    </div>
  );
}

function RecommendationSection({
  detail,
}: {
  detail: IForecastRecommendationDetail;
}) {
  const aiChanged =
    detail.aiAdjusted &&
    detail.calculatedQuantity !== null &&
    detail.suggestedQuantity !== null &&
    detail.calculatedQuantity !== detail.suggestedQuantity;
  const months = detail.calculation.monthsOfHistory;

  return (
    <Section id="forecast-detail-recommendation" title="Recomendação">
      <div className="flex flex-wrap items-center gap-1.5">
        <ActionPill action={detail.action} />
        <PriorityPill priority={detail.priority} />
        <ConfidencePill confidence={detail.confidence} />
        <RecommendationStatusPill status={detail.status} />
        {detail.aiAdjusted && <AiAdjustedPill />}
      </div>
      <p className="text-xs text-muted-foreground">
        Confiança baseada em {formatNumber(months)}{" "}
        {months === 1 ? "mês" : "meses"} de histórico.
        {detail.deadline && ` Comprar até ${formatDateOnly(detail.deadline)}.`}
      </p>

      {aiChanged && (
        <Alert>
          <Sparkles />
          <AlertTitle>A IA ajustou a quantidade</AlertTitle>
          <AlertDescription>
            {formatQty(detail, detail.calculatedQuantity as number)} calculadas
            → {formatQty(detail, detail.suggestedQuantity as number)}
          </AlertDescription>
        </Alert>
      )}

      <dl className="grid grid-cols-1 gap-3">
        {detail.reasonAi && (
          <Detail label="Motivo da IA" value={detail.reasonAi} />
        )}
        <Detail label="Motivo calculado" value={detail.reasonCalculated} />
        {detail.dismissReasonCode && (
          <Detail
            label="Motivo do descarte"
            value={
              DISMISS_REASON_LABELS[detail.dismissReasonCode] +
              (detail.dismissNote ? `: ${detail.dismissNote}` : "")
            }
          />
        )}
        {detail.appliedLink && (
          <Detail
            label="Gerado ao aplicar"
            value={
              detail.appliedLink.type === "PurchaseOrder" ? (
                <Link
                  to={`/purchase-orders/${detail.appliedLink.id}/view`}
                  className="text-primary underline-offset-4 hover:underline"
                >
                  Pedido de compra
                  {detail.appliedLink.number !== null &&
                    ` nº ${detail.appliedLink.number}`}
                </Link>
              ) : detail.appliedLink.type === "Transfer" ? (
                "Transferência de estoque"
              ) : (
                "Promoção"
              )
            }
          />
        )}
      </dl>
    </Section>
  );
}

function CalculationSection({
  detail,
}: {
  detail: IForecastRecommendationDetail;
}) {
  const calc = detail.calculation;
  const qty = (value: number | null) =>
    value === null ? "—" : formatQty(detail, value);

  return (
    <Section
      id="forecast-detail-calculation"
      title="Números do cálculo"
      description={
        detail.storeCurrentStock != null
          ? "Cálculo e sugestão com o estoque somado de todas as lojas; ao lado, o da loja selecionada no topo."
          : "Estoque somado de todas as lojas."
      }
    >
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Detail label="Estoque atual" value={qty(detail.currentStock)} />
        <Detail label="A chegar" value={qty(detail.incomingStock)} />
        {detail.storeCurrentStock != null && (
          <>
            <Detail
              label="Estoque nesta loja"
              value={qty(detail.storeCurrentStock)}
            />
            <Detail
              label="A chegar nesta loja"
              value={qty(detail.storeIncomingStock ?? 0)}
            />
          </>
        )}
        <Detail label="Reservado" value={qty(calc.reservedStock)} />
        <Detail
          label="Cobertura"
          value={formatCoverageDays(detail.coverageDays)}
        />
        <Detail
          label="Prazo de entrega"
          value={`${formatDays(calc.leadTimeDays)} (${LEAD_TIME_SOURCE_LABELS[
            calc.leadTimeSource
          ].toLowerCase()})`}
        />
        <Detail label="Estoque de segurança" value={qty(calc.safetyStock)} />
        <Detail label="Necessidade de compra" value={qty(calc.purchaseNeed)} />
        <Detail
          label="Cobertura alvo"
          value={`${formatDays(calc.targetCoverageDays)}${detail.abcClass ? ` (classe ${detail.abcClass})` : ""}`}
        />
        <Detail
          label="Demanda do próximo mês"
          value={`${qty(calc.nextMonthDemand)} (índice ${formatSeasonalIndex(calc.nextMonthSeasonalIndex)})`}
        />
        <Detail label="Vida útil" value={formatDays(calc.shelfLifeDays)} />
        <Detail label="Pedido mínimo" value={qty(calc.minOrderQty)} />
        <Detail label="Múltiplo" value={qty(calc.orderMultiple)} />
        <Detail
          label="Projeção baseada no ano anterior"
          value={calc.basedOnLastYear ? "Sim" : "Não"}
        />
      </dl>
    </Section>
  );
}

function VariantSplitSection({
  detail,
}: {
  detail: IForecastRecommendationDetail;
}) {
  const split: IVariantSplit[] = detail.variantSplit;
  const total = split.reduce((sum, item) => sum + item.suggestedQuantity, 0);
  const tolerance = 10 ** -detail.decimalPlaces / 2;
  const mismatch =
    detail.suggestedQuantity !== null &&
    Math.abs(total - detail.suggestedQuantity) > tolerance;

  return (
    <Section
      id="forecast-detail-split"
      title="Rateio por variação"
      description="Proporção das vendas de cada variação e o saldo disponível por local."
    >
      {split.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Sem rateio para esta recomendação.
        </p>
      ) : (
        <Table aria-label="Rateio por variação">
          <TableHeader>
            <TableRow>
              <TableHead>Variação</TableHead>
              <TableHead className="text-right">Proporção</TableHead>
              <TableHead className="text-right">Quantidade</TableHead>
              <TableHead>Disponível por local</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {split.map((item) => (
              <TableRow key={item.variantId}>
                <TableCell className="font-medium">
                  {item.variantLabel ?? "Única"}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatPercent(item.sharePercent)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatQty(detail, item.suggestedQuantity)}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {item.availableByLocation.length === 0
                    ? "Sem saldo"
                    : item.availableByLocation
                        .map(
                          (location) =>
                            `${location.locationName}: ${formatNumber(location.available, detail.decimalPlaces)}`
                        )
                        .join(" · ")}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell className="font-medium">Total</TableCell>
              <TableCell />
              <TableCell className="text-right font-semibold tabular-nums">
                {formatQty(detail, total)}
              </TableCell>
              <TableCell />
            </TableRow>
          </TableFooter>
        </Table>
      )}
      {mismatch && (
        <Alert variant="destructive">
          <AlertTriangle />
          <AlertTitle>O rateio não fecha com a quantidade sugerida</AlertTitle>
          <AlertDescription>
            Soma das variações {formatQty(detail, total)}; sugerido{" "}
            {formatQty(detail, detail.suggestedQuantity as number)}.
          </AlertDescription>
        </Alert>
      )}
    </Section>
  );
}

function StoreSplitSection({
  detail,
}: {
  detail: IForecastRecommendationDetail;
}) {
  const split = detail.storeSplit;
  const total = split.reduce((sum, store) => sum + store.quantity, 0);
  return (
    <Section
      id="forecast-detail-stores"
      title="Divisão por loja"
      description="Quanto da compra vai para cada loja, pela participação nas vendas e pela falta de cada uma."
    >
      <Table aria-label="Divisão por loja">
        <TableHeader>
          <TableRow>
            <TableHead>Loja</TableHead>
            <TableHead className="text-right">Participação</TableHead>
            <TableHead className="text-right">Falta</TableHead>
            <TableHead className="text-right">Comprar</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {split.map((store) => (
            <TableRow key={store.storeId}>
              <TableCell className="font-medium">{store.storeName}</TableCell>
              <TableCell className="text-right tabular-nums">
                {formatPercent(store.sharePercent)}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {formatQty(detail, store.shortfall)}
              </TableCell>
              <TableCell className="text-right font-semibold tabular-nums">
                {formatQty(detail, store.quantity)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell className="font-medium">Total</TableCell>
            <TableCell />
            <TableCell />
            <TableCell className="text-right font-semibold tabular-nums">
              {formatQty(detail, total)}
            </TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </Section>
  );
}

function EventsSection({ product }: { product: IProductForecast }) {
  return (
    <Section id="forecast-detail-events" title="Eventos do horizonte">
      {product.events.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Nenhum evento no horizonte.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {product.events.map((event) => (
            <li
              key={`${event.name}-${event.date}`}
              className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm"
            >
              <CalendarDays className="size-4 text-muted-foreground" />
              <span className="font-medium">{event.name}</span>
              <span className="text-muted-foreground">
                {formatDateOnly(event.date)}, procura sobe a partir de{" "}
                {formatDateOnly(event.demandStartsOn)}
              </span>
              {event.linkedToProduct && (
                <Badge variant="secondary">Ligado ao produto</Badge>
              )}
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}

function AccuracySection({ product }: { product: IProductForecast }) {
  return (
    <Section
      id="forecast-detail-accuracy"
      title="Precisão"
      description="Projeção feita antes de cada mês contra o que foi vendido. Mês com ruptura ou sem venda fica fora da média."
    >
      {product.accuracy.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Ainda não há meses encerrados com projeção para comparar.
        </p>
      ) : (
        <Table aria-label="Precisão">
          <TableHeader>
            <TableRow>
              <TableHead>Mês</TableHead>
              <TableHead className="text-right">Previsto</TableHead>
              <TableHead className="text-right">Vendido</TableHead>
              <TableHead className="text-right">Erro</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {product.accuracy.map((item) => (
              <TableRow key={item.month}>
                <TableCell>{formatMonth(item.month)}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatQty(product, item.projected)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatQty(product, item.actual)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {item.errorPercent === null ? (
                    <Badge variant="outline">Fora</Badge>
                  ) : (
                    formatPercent(item.errorPercent)
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Section>
  );
}

// ---------- Visão completa ----------

type ForecastDetailViewProps = {
  product: IProductForecast;
  /** Recomendação da análise; sem ela mostra só a previsão do produto (T-DF5). */
  detail?: IForecastRecommendationDetail | null;
};

/** Mesma visão no drawer da `/forecast` (T-DF3) e na aba Previsão do produto (T-DF5). */
export function ForecastDetailView({
  product,
  detail,
}: ForecastDetailViewProps) {
  const months = product.monthsOfHistory;
  return (
    <div className="flex flex-col gap-6">
      {detail ? (
        <>
          <RecommendationSection detail={detail} />
          <Separator />
          <CalculationSection detail={detail} />
        </>
      ) : (
        <Empty className="border">
          <EmptyHeader>
            <EmptyTitle>Nenhuma recomendação para este produto</EmptyTitle>
            <EmptyDescription>
              A última análise não sugeriu ação. O histórico e a projeção
              continuam abaixo.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
      <Separator />
      <Section
        id="forecast-detail-chart"
        title="Vendas e projeção"
        description="Últimos meses completos e a demanda projetada no horizonte."
      >
        <ForecastChart
          history={product.history}
          projection={product.projection}
          events={product.events}
          currentStock={product.currentStock}
          saleUnit={unitShort(product.saleUnit)}
          decimalPlaces={product.decimalPlaces}
        />
      </Section>
      <Separator />
      <Section
        id="forecast-detail-seasonality"
        title="Sazonalidade"
        description={`Índice de cada mês do produto (1,00 = média), com ${formatNumber(months)} ${months === 1 ? "mês" : "meses"} de histórico.`}
      >
        <SeasonalityChart seasonality={product.seasonality} />
      </Section>
      <Separator />
      <EventsSection product={product} />
      {detail && (
        <>
          <Separator />
          <VariantSplitSection detail={detail} />
          {detail.storeSplit?.length > 1 && (
            <>
              <Separator />
              <StoreSplitSection detail={detail} />
            </>
          )}
        </>
      )}
      <Separator />
      <AccuracySection product={product} />
    </div>
  );
}
