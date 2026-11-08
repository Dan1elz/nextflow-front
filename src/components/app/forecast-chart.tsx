import { useMemo } from "react";
import { BarChart3 } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipProps,
} from "recharts";

import type {
  IProductForecastEvent,
  IProductForecastHistory,
  IProductForecastProjection,
  IProductForecastSeasonality,
} from "@/interfaces/forecast.interface";
import { formatMonth } from "@/utils/date.helpers";
import { formatCurrency, formatNumber } from "@/utils/format.helpers";
import { formatSeasonalIndex } from "@/utils/forecast.helpers";

/**
 * Cores validadas (CVD/contraste) para light e dark:
 * histórico = primary (violeta), projeção = âmbar, estoque atual = ciano.
 */
const HISTORY_COLOR = "var(--color-primary, #7c3aed)";
const PROJECTION_COLOR = "#d97706";
const STOCK_COLOR = "#0891b2";
const AXIS_TICK = { fill: "var(--muted-foreground)", fontSize: 12 };

const MONTH_SHORT_LABELS = [
  "Jan",
  "Fev",
  "Mar",
  "Abr",
  "Mai",
  "Jun",
  "Jul",
  "Ago",
  "Set",
  "Out",
  "Nov",
  "Dez",
];

type ChartPoint = {
  key: string;
  label: string;
  history: IProductForecastHistory | null;
  quantitySold: number | null;
  projectedQuantity: number | null;
  /** Série desenhada pela linha de projeção (inclui o "elo" com o último mês de histórico). */
  projectionLine: number | null;
};

function nextMonth(key: string) {
  let [year, month] = key.split("-").map(Number);
  month += 1;
  if (month > 12) {
    month = 1;
    year += 1;
  }
  return `${year}-${String(month).padStart(2, "0")}`;
}

function emptyPoint(key: string): ChartPoint {
  return {
    key,
    label: formatMonth(key),
    history: null,
    quantitySold: null,
    projectedQuantity: null,
    projectionLine: null,
  };
}

function LegendItem({
  color,
  label,
  variant,
}: {
  color: string;
  label: string;
  variant: "bar" | "dashed" | "line";
}) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
      {variant === "bar" ? (
        <span
          className="inline-block size-3 rounded-sm"
          style={{ backgroundColor: color }}
        />
      ) : (
        <span
          className="inline-block w-5 border-t-2"
          style={{
            borderColor: color,
            borderTopStyle: variant === "dashed" ? "dashed" : "solid",
          }}
        />
      )}
      {label}
    </span>
  );
}

function ChartEmpty({ message }: { message: string }) {
  return (
    <div className="flex h-full min-h-[200px] flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-6 text-center text-muted-foreground">
      <BarChart3 className="size-8 opacity-40" />
      <p className="text-sm">{message}</p>
    </div>
  );
}

type ForecastChartProps = {
  history: IProductForecastHistory[];
  projection: IProductForecastProjection[];
  events?: IProductForecastEvent[];
  currentStock?: number | null;
  saleUnit: string;
  decimalPlaces: number;
  height?: number;
};

/**
 * Histórico de vendas (barras) + projeção de demanda (linha tracejada) + linha do estoque atual
 * e marcadores dos eventos (T-DF3). Meses "yyyy-MM"; todas as séries na mesma unidade (um eixo).
 */
export function ForecastChart({
  history,
  projection,
  events = [],
  currentStock,
  saleUnit,
  decimalPlaces,
  height = 300,
}: ForecastChartProps) {
  const qty = (value: number) =>
    `${formatNumber(value, decimalPlaces)} ${saleUnit}`;

  const data = useMemo<ChartPoint[]>(() => {
    const map = new Map<string, ChartPoint>();
    for (const h of history) {
      map.set(h.month, {
        ...emptyPoint(h.month),
        history: h,
        quantitySold: h.quantitySold,
      });
    }
    for (const p of projection) {
      const point = map.get(p.month) ?? emptyPoint(p.month);
      point.projectedQuantity = p.projectedQuantity;
      point.projectionLine = p.projectedQuantity;
      map.set(p.month, point);
    }
    const sorted = [...map.values()].sort((a, b) => a.key.localeCompare(b.key));

    // Eixo contínuo: o histórico termina no último mês completo e a projeção começa no próximo mês,
    // então um mês sem nenhuma série entra como ponto vazio.
    const points: ChartPoint[] = [];
    for (const point of sorted) {
      const previous = points[points.length - 1];
      if (previous) {
        for (
          let key = nextMonth(previous.key);
          key < point.key;
          key = nextMonth(key)
        ) {
          points.push(emptyPoint(key));
        }
      }
      points.push(point);
    }

    // Liga a linha de projeção ao último mês com histórico (continuidade visual).
    const firstProjectionIndex = points.findIndex(
      (p) => p.projectionLine !== null
    );
    for (let i = firstProjectionIndex - 1; i >= 0; i--) {
      const previous = points[i];
      if (previous.quantitySold === null) continue;
      if (previous.projectionLine === null) {
        previous.projectionLine = previous.quantitySold;
      }
      break;
    }
    return points;
  }, [history, projection]);

  const eventMarkers = useMemo(() => {
    const labels = new Map(data.map((p) => [p.key, p.label]));
    return events.flatMap((event) => {
      const label = labels.get(event.date.slice(0, 7));
      return label ? [{ event, label }] : [];
    });
  }, [data, events]);

  const hasHistory = history.length > 0;
  const hasProjection = projection.length > 0;
  const stock = currentStock ?? null;

  if (!hasHistory && !hasProjection) {
    return (
      <ChartEmpty message="Ainda não há histórico de vendas nem projeção para este produto." />
    );
  }

  const renderTooltip = ({ active, payload }: TooltipProps<number, string>) => {
    if (!active || !payload || payload.length === 0) return null;
    const point = payload[0].payload as ChartPoint;
    const h = point.history;
    return (
      <div className="flex flex-col gap-0.5 rounded-lg border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-md">
        <p className="mb-1 font-semibold">{formatMonth(point.key, "long")}</p>
        {h && (
          <>
            <p>
              Vendido:{" "}
              <span className="font-medium">{qty(h.quantitySold)}</span>
            </p>
            {h.quantitySoldOnPromo > 0 && (
              <p>Em promoção: {qty(h.quantitySoldOnPromo)}</p>
            )}
            {h.daysOutOfStock > 0 && (
              <p>
                Dias sem estoque: {formatNumber(h.daysOutOfStock)}
                {h.lostDemandQty > 0
                  ? ` (demanda perdida ${qty(h.lostDemandQty)})`
                  : ""}
              </p>
            )}
            {h.avgPrice !== null && (
              <p>Preço médio: {formatCurrency(h.avgPrice)}</p>
            )}
          </>
        )}
        {point.projectedQuantity !== null && (
          <p>
            Projeção:{" "}
            <span className="font-medium">{qty(point.projectedQuantity)}</span>
          </p>
        )}
        {eventMarkers
          .filter((marker) => marker.label === point.label)
          .map(({ event }) => (
            <p key={event.name} className="text-muted-foreground">
              {event.name}
            </p>
          ))}
      </div>
    );
  };

  return (
    <div className="flex w-full flex-col gap-2">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
        {hasHistory && (
          <LegendItem
            color={HISTORY_COLOR}
            label="Vendas realizadas"
            variant="bar"
          />
        )}
        {hasProjection && (
          <LegendItem
            color={PROJECTION_COLOR}
            label="Demanda projetada"
            variant="dashed"
          />
        )}
        {stock !== null && (
          <LegendItem
            color={STOCK_COLOR}
            label="Estoque atual"
            variant="line"
          />
        )}
      </div>
      <div style={{ height }} className="w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={data}
            margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="var(--border)"
            />
            <XAxis
              dataKey="label"
              tick={AXIS_TICK}
              tickLine={false}
              axisLine={{ stroke: "var(--border)" }}
              interval="preserveStartEnd"
              minTickGap={12}
            />
            <YAxis
              tick={AXIS_TICK}
              tickLine={false}
              axisLine={false}
              width={48}
              allowDecimals={false}
              tickFormatter={(value: number) => formatNumber(value)}
            />
            <Tooltip
              content={renderTooltip}
              cursor={{ fill: "var(--muted)", opacity: 0.4 }}
            />
            <Bar
              dataKey="quantitySold"
              name="Vendas realizadas"
              fill={HISTORY_COLOR}
              radius={[4, 4, 0, 0]}
              maxBarSize={28}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="projectionLine"
              name="Demanda projetada"
              stroke={PROJECTION_COLOR}
              strokeWidth={2}
              strokeDasharray="6 4"
              dot={{ r: 4, strokeWidth: 2, fill: "var(--card)" }}
              activeDot={{ r: 5 }}
              connectNulls
              isAnimationActive={false}
            />
            {eventMarkers.map(({ event, label }) => (
              <ReferenceLine
                key={`${event.name}-${event.date}`}
                xAxisId={0}
                yAxisId={0}
                x={label}
                stroke="var(--muted-foreground)"
                strokeDasharray="2 4"
                label={{
                  value: event.name,
                  position: "insideTopRight",
                  fill: "var(--muted-foreground)",
                  fontSize: 11,
                }}
              />
            ))}
            {stock !== null && (
              <ReferenceLine
                // ids explícitos: no React 19 os defaultProps (id 0) não chegam ao elemento e o
                // Recharts 2 deixaria de estender o eixo Y até o estoque (ifOverflow="extendDomain")
                xAxisId={0}
                yAxisId={0}
                y={stock}
                stroke={STOCK_COLOR}
                strokeWidth={2}
                strokeDasharray="2 3"
                ifOverflow="extendDomain"
                label={{
                  value: `Estoque: ${formatNumber(stock, decimalPlaces)}`,
                  position: "insideTopLeft",
                  fill: "var(--muted-foreground)",
                  fontSize: 11,
                }}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

type SeasonalityChartProps = {
  seasonality: IProductForecastSeasonality[];
  height?: number;
};

/** Perfil sazonal de 12 meses do produto (1,00 = média mensal). */
export function SeasonalityChart({
  seasonality,
  height = 220,
}: SeasonalityChartProps) {
  const data = useMemo(() => {
    const byMonth = new Map(seasonality.map((s) => [s.month, s]));
    return MONTH_SHORT_LABELS.map((label, index) => ({
      month: index + 1,
      label,
      seasonalIndex: byMonth.get(index + 1)?.productIndex ?? null,
      categoryIndex: byMonth.get(index + 1)?.categoryIndex ?? null,
    }));
  }, [seasonality]);

  if (data.every((point) => point.seasonalIndex === null)) {
    return (
      <ChartEmpty message="Perfil sazonal indisponível. Ele é calculado ao gerar uma análise de demanda." />
    );
  }

  const renderTooltip = ({ active, payload }: TooltipProps<number, string>) => {
    if (!active || !payload || payload.length === 0) return null;
    const point = payload[0].payload as (typeof data)[number];
    if (point.seasonalIndex === null) return null;
    const diff = Math.round((point.seasonalIndex - 1) * 100);
    return (
      <div className="rounded-lg border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-md">
        <p className="mb-1 font-semibold">{point.label}</p>
        <p>
          Índice:{" "}
          <span className="font-medium">
            {formatSeasonalIndex(point.seasonalIndex)}
          </span>
        </p>
        {point.categoryIndex !== null && (
          <p>Categoria: {formatSeasonalIndex(point.categoryIndex)}</p>
        )}
        <p className="text-muted-foreground">
          {diff === 0
            ? "Na média mensal"
            : diff > 0
              ? `${diff}% acima da média`
              : `${Math.abs(diff)}% abaixo da média`}
        </p>
      </div>
    );
  };

  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke="var(--border)"
          />
          <XAxis
            dataKey="label"
            tick={AXIS_TICK}
            tickLine={false}
            axisLine={{ stroke: "var(--border)" }}
            interval={0}
          />
          <YAxis
            tick={AXIS_TICK}
            tickLine={false}
            axisLine={false}
            width={40}
            tickFormatter={(value: number) => formatNumber(value, 1)}
          />
          <Tooltip
            content={renderTooltip}
            cursor={{ fill: "var(--muted)", opacity: 0.4 }}
          />
          <ReferenceLine
            xAxisId={0}
            yAxisId={0}
            y={1}
            stroke="var(--muted-foreground)"
            strokeDasharray="4 4"
            label={{
              value: "Média",
              position: "insideTopRight",
              fill: "var(--muted-foreground)",
              fontSize: 11,
            }}
          />
          <Bar
            dataKey="seasonalIndex"
            name="Índice sazonal"
            radius={[4, 4, 0, 0]}
            maxBarSize={28}
            isAnimationActive={false}
          >
            {data.map((entry) => (
              <Cell
                key={entry.month}
                fill={HISTORY_COLOR}
                fillOpacity={
                  entry.seasonalIndex !== null && entry.seasonalIndex >= 1
                    ? 1
                    : 0.45
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
